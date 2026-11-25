<?php
/* Funciones compartidas por claude.php y lead.php. No contiene datos sensibles. */

const ORIGENES_PERMITIDOS = ['https://ailab.pra2media.com'];

function responder_error(int $codigo, string $error): void {
  http_response_code($codigo);
  echo json_encode(['error' => $error]);
  exit;
}

/* Carpeta privada fuera de /ailab: el despliegue nunca la toca y no está en GitHub.
   Ruta: htdocs/ailab-privado/ (se puede cambiar con la variable AGENTE_PRIVADO_DIR). */
function carpeta_privada(): string {
  $env = getenv('AGENTE_PRIVADO_DIR');
  return $env ? rtrim($env, '/') : dirname(__DIR__, 3) . '/ailab-privado';
}

function preparar_peticion(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header('X-Content-Type-Options: nosniff');

  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder_error(405, 'method_not_allowed');

  // Solo se aceptan peticiones hechas desde la propia web.
  $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
  $referer = $_SERVER['HTTP_REFERER'] ?? '';
  $ok = false;
  foreach (ORIGENES_PERMITIDOS as $o) {
    if ($origen === $o || ($origen === '' && strpos($referer, $o . '/') === 0)) $ok = true;
  }
  if (!$ok) responder_error(403, 'forbidden');
}

/* Límite simple de peticiones por IP y por hora. */
function limitar(string $clave, int $maxPorHora): void {
  $dir = sys_get_temp_dir() . '/agente60_rl';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  $archivo = $dir . '/' . hash('sha256', $clave . '|' . ($_SERVER['REMOTE_ADDR'] ?? '0')) . '.json';
  $ahora = time();
  $marcas = [];
  if (is_file($archivo)) {
    $marcas = json_decode((string) @file_get_contents($archivo), true) ?: [];
    $marcas = array_values(array_filter($marcas, fn($t) => $t > $ahora - 3600));
  }
  if (count($marcas) >= $maxPorHora) responder_error(429, 'rate_limited');
  $marcas[] = $ahora;
  @file_put_contents($archivo, json_encode($marcas), LOCK_EX);
}

function leer_json(int $maxBytes): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || strlen($raw) > $maxBytes) responder_error(413, 'too_large');
  $datos = json_decode($raw, true);
  if (!is_array($datos)) responder_error(400, 'bad_request');
  return $datos;
}

/* Recorta texto UTF-8 sin depender de la extensión mbstring. */
function recortar(string $s, int $max): string {
  if (function_exists('mb_substr')) return mb_substr($s, 0, $max);
  if (strlen($s) <= $max) return $s;
  preg_match('/^.{0,' . $max . '}/su', $s, $m);
  return $m[0] ?? substr($s, 0, $max);
}
