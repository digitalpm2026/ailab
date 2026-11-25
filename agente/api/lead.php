<?php
/* Guarda los datos del formulario final en htdocs/ailab-privado/leads-agente.csv.php
   (el archivo empieza con un bloqueo PHP, así que no se puede leer desde el navegador). */
require __DIR__ . '/_comun.php';

preparar_peticion();
limitar('lead', 20);

$d = leer_json(30000);

$limpiar = function ($v): string {
  if (is_array($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE);
  $v = trim(str_replace(["\r", "\n"], ' ', (string) $v));
  $v = recortar($v, 600);
  // Evita fórmulas al abrir el CSV en Excel.
  if ($v !== '' && strpbrk($v[0], '=+-@') !== false) $v = "'" . $v;
  return $v;
};

$email = (string) ($d['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || trim((string) ($d['nombre'] ?? '')) === '') responder_error(400, 'bad_lead');

$campos = ['nombre', 'email', 'empresa', 'whatsapp', 'volumen', 'agente', 'rubro', 'pais', 'tono', 'objetivo', 'cobertura', 'nota', 'faltantes', 'xp', 'mensajes', 'datosCapturados'];
$fila = [date('c')];
foreach ($campos as $c) $fila[] = $limpiar($d[$c] ?? '');

$dir = carpeta_privada();
if (!is_dir($dir) && !@mkdir($dir, 0700, true)) responder_error(500, 'storage');
$archivo = $dir . '/leads-agente.csv.php';
$nuevo = !is_file($archivo);
$fh = @fopen($archivo, 'a');
if (!$fh) responder_error(500, 'storage');
flock($fh, LOCK_EX);
if ($nuevo) {
  fwrite($fh, "<?php exit; ?>\n");
  fputcsv($fh, array_merge(['fecha'], $campos));
}
fputcsv($fh, $fila);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['ok' => true]);
