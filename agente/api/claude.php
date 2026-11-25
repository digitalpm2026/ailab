<?php
/* Proxy hacia la API de Anthropic para «Su agente IA en 60 segundos».
   La clave nunca llega al navegador: se lee de la variable de entorno ANTHROPIC_API_KEY
   o del archivo privado htdocs/ailab-privado/anthropic.php (ver LEEME). */
require __DIR__ . '/_comun.php';

const MODELO = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;
const PETICIONES_POR_HORA = 150; // por visitante (una demo completa usa ~20)

preparar_peticion();
limitar('claude', PETICIONES_POR_HORA);

$clave = getenv('ANTHROPIC_API_KEY') ?: '';
if (!$clave) {
  $archivo = carpeta_privada() . '/anthropic.php';
  if (is_file($archivo)) $clave = (string) (include $archivo);
}
if (!$clave) responder_error(500, 'not_configured');

$entrada = leer_json(150000);

// Se valida y se reconstruye la petición: el navegador no puede cambiar modelo, tokens ni herramientas.
$mensajes = $entrada['messages'] ?? null;
if (!is_array($mensajes) || !$mensajes || count($mensajes) > 60) responder_error(400, 'bad_request');
$limpios = [];
foreach ($mensajes as $m) {
  $rol = $m['role'] ?? '';
  $contenido = $m['content'] ?? '';
  if (!in_array($rol, ['user', 'assistant'], true) || !is_string($contenido) || $contenido === '') responder_error(400, 'bad_request');
  $limpios[] = ['role' => $rol, 'content' => recortar($contenido, 20000)];
}

$cuerpo = ['model' => MODELO, 'max_tokens' => MAX_TOKENS, 'messages' => $limpios];
if (isset($entrada['system']) && is_string($entrada['system'])) $cuerpo['system'] = recortar($entrada['system'], 60000);

$quiereBusqueda = false;
foreach (($entrada['tools'] ?? []) as $t) {
  if (($t['name'] ?? '') === 'web_search') $quiereBusqueda = true;
}
if ($quiereBusqueda) $cuerpo['tools'] = [['type' => 'web_search_20250305', 'name' => 'web_search', 'max_uses' => 3]];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 90,
  CURLOPT_HTTPHEADER => [
    'content-type: application/json',
    'anthropic-version: 2023-06-01',
    'x-api-key: ' . $clave,
  ],
  CURLOPT_POSTFIELDS => json_encode($cuerpo, JSON_UNESCAPED_UNICODE),
]);
$respuesta = curl_exec($ch);
$estado = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$errorCurl = curl_error($ch);
curl_close($ch);

if ($respuesta === false) {
  error_log('agente60: curl ' . $errorCurl);
  responder_error(502, 'upstream');
}
if ($estado === 429) responder_error(429, 'rate_limited');
if ($estado >= 400) {
  error_log('agente60: anthropic ' . $estado . ' ' . substr($respuesta, 0, 500));
  responder_error(502, 'upstream');
}
echo $respuesta;
