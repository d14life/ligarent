<?php
/**
 * LIGARENT — enquiry endpoint (plain PHP).
 *
 * Use this instead of the Cloudflare Worker when the site is on ordinary
 * shared hosting with PHP. Upload this file, create api/config.php next to it
 * (see api/README.md), and point window.LIGARENT_CONFIG.leadEndpoint at it.
 *
 * The bot token lives in config.php, which must sit OUTSIDE the web root or be
 * blocked by the .htaccess shipped alongside it. It is never sent to browsers.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$cfgPath = __DIR__ . '/config.php';
if (!is_file($cfgPath)) {
    http_response_code(500);
    error_log('ligarent: api/config.php is missing');
    echo json_encode(['error' => 'not configured']);
    exit;
}
$cfg = require $cfgPath;   // ['bot_token' => '...', 'chat_id' => '...', 'allowed_origin' => '...']

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $cfg['allowed_origin'] ?? '*';
if ($allowed === '*' || $origin === $allowed) {
    header('Access-Control-Allow-Origin: ' . ($origin !== '' ? $origin : '*'));
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Vary: Origin');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'method not allowed']); exit;
}

$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(400); echo json_encode(['error' => 'bad json']); exit; }

// honeypot: accept silently so bots learn nothing
if (!empty($d['company'])) { echo json_encode(['ok' => true]); exit; }

$required = ['phone', 'whatsapp', 'job', 'tons', 'location'];
$missing = [];
foreach ($required as $k) {
    if (trim((string)($d[$k] ?? '')) === '') $missing[] = $k;
}
if ($missing) {
    http_response_code(400);
    echo json_encode(['error' => 'missing', 'fields' => $missing]);
    exit;
}

foreach ($d as $k => $v) {
    if (is_string($v)) $d[$k] = mb_substr($v, 0, $k === 'job' ? 1500 : 300);
}

/** Telegram HTML parse_mode allows only a small tag set. */
function esc(?string $s): string {
    return str_replace(['&', '<', '>'], ['&amp;', '&lt;', '&gt;'], (string)$s);
}
function digits(?string $s): string {
    return preg_replace('/\D/', '', (string)$s) ?? '';
}

$lines = [];
$lines[] = '🚜 <b>NEW ENQUIRY — LIGARENT</b>';
$lines[] = '';
if (!empty($d['name'])) $lines[] = '👤 <b>Name:</b> ' . esc($d['name']);
$lines[] = '📞 <b>Phone:</b> <a href="tel:+' . digits($d['phone']) . '">' . esc($d['phone']) . '</a>';
$lines[] = '💬 <b>WhatsApp:</b> <a href="https://wa.me/' . digits($d['whatsapp']) . '">' . esc($d['whatsapp']) . '</a>';
$lines[] = '';
$lines[] = '🏗 <b>Job:</b>';
$lines[] = esc($d['job']);
$lines[] = '';
$lines[] = '⚖️ <b>Size:</b> ' . esc($d['tons']);
$lines[] = '📍 <b>Location:</b> ' . esc($d['location']);

$meta = [];
if (!empty($d['lang'])) $meta[] = 'lang ' . esc($d['lang']);
if (!empty($d['ts'])) $meta[] = esc($d['ts']);
if (!empty($d['ref'])) $meta[] = 'from ' . esc($d['ref']);
if ($meta) { $lines[] = ''; $lines[] = '<i>' . implode(' · ', $meta) . '</i>'; }

$payload = json_encode([
    'chat_id' => $cfg['chat_id'],
    'text' => implode("\n", $lines),
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => true,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.telegram.org/bot' . $cfg['bot_token'] . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200) {
    error_log('ligarent: telegram rejected the message: ' . $code . ' ' . (string)$res);
    http_response_code(502);
    echo json_encode(['error' => 'delivery failed']);
    exit;
}

echo json_encode(['ok' => true]);
