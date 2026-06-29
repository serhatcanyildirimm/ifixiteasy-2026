<?php
// Front controller voor de /api/* endpoints. Vervangt server/app.js +
// server/routes/*.js. De frontend roept dezelfde relatieve URL's aan
// (/api/public/... en /api/admin/...), dus de frontend hoeft niet te wijzigen.

declare(strict_types=1);

require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/jwt.php';
require_once __DIR__ . '/lib/mailer.php';
require_once __DIR__ . '/services.php';

set_exception_handler(function (Throwable $e) {
    error_log('API-fout: ' . $e->getMessage());
    fail($e->getMessage() ?: 'Interne serverfout.', 500);
});

// --- Route bepalen (pad na /api) ---
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$path = $base !== '' && str_starts_with($uri, $base) ? substr($uri, strlen($base)) : $uri;
$path = '/' . trim($path, '/');

// Hulpfunctie: matcht methode + pad-patroon met {param}-placeholders.
function route(string $wantMethod, string $pattern, string $method, string $path, callable $handler): void
{
    if ($method !== $wantMethod) {
        return;
    }
    $regex = '#^' . preg_replace('#\{[^}]+\}#', '([^/]+)', $pattern) . '$#';
    if (preg_match($regex, $path, $m)) {
        array_shift($m);
        $handler(...array_map('urldecode', $m));
        exit;
    }
}

// Eenvoudige rate limiter (best effort, nooit blokkerend bij fouten).
function rate_limit(string $key, int $limit, int $windowSec): void
{
    try {
        $file = sys_get_temp_dir() . '/ife_rl_' . md5($key) . '.json';
        $now = time();
        $hits = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
        $hits = array_values(array_filter($hits, fn($t) => $t > $now - $windowSec));
        if (count($hits) >= $limit) {
            fail('Te veel verzoeken. Probeer het later opnieuw.', 429);
        }
        $hits[] = $now;
        @file_put_contents($file, json_encode($hits));
    } catch (Throwable $e) {
        // Bij een fout met de limiter laten we het verzoek gewoon door.
    }
}

// ============ Health ============
route('GET', '/health', $method, $path, function () {
    try {
        db()->query('SELECT 1');
        json_response(['ok' => true]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'message' => 'Database verbinding mislukt.'], 500);
    }
});

// ============ Public ============
route('GET', '/public/phones', $method, $path, function () {
    json_response(get_public_phones());
});

route('GET', '/public/issues', $method, $path, function () {
    json_response(get_public_issues());
});

route('GET', '/public/availability', $method, $path, function () {
    $date = $_GET['date'] ?? '';
    if ($date === '') {
        fail('Datum is verplicht.', 400);
    }
    json_response(get_public_availability_by_date($date));
});

route('POST', '/public/appointments', $method, $path, function () {
    rate_limit('appointments:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 15, 600);
    $b = json_body();
    $required = ['customerName', 'customerPhone', 'slotId'];
    foreach ($required as $field) {
        if (empty($b[$field])) {
            fail('Vul alle verplichte velden in.', 400);
        }
    }

    // Toestel: een gekozen phoneId uit de catalogus, of een zelf-getypte naam.
    $hasPhoneId = !empty($b['phoneId']);
    $hasCustom = !empty($b['customDeviceName']);
    if (!$hasPhoneId && !$hasCustom) {
        fail('Kies een toestel of typ je toestelnaam.', 400);
    }
    $phoneId = $hasPhoneId
        ? (int) $b['phoneId']
        : resolve_custom_phone_id((string) $b['customDeviceName'], $b['deviceCategory'] ?? 'smartphone');

    // Probleem: een gekozen issueTypeId, of een zelf-getypte omschrijving.
    $hasIssueId = !empty($b['issueTypeId']);
    $hasCustomIssue = !empty($b['customIssueLabel']);
    if (!$hasIssueId && !$hasCustomIssue) {
        fail('Kies een probleem of omschrijf het zelf.', 400);
    }
    $issueTypeId = $hasIssueId
        ? (int) $b['issueTypeId']
        : resolve_custom_issue_id((string) $b['customIssueLabel']);

    try {
        $appointmentId = create_appointment([
            'customerName'  => $b['customerName'],
            'customerPhone' => $b['customerPhone'],
            'customerEmail' => $b['customerEmail'] ?? null,
            'phoneId'       => $phoneId,
            'issueTypeId'   => $issueTypeId,
            'notes'         => $b['notes'] ?? null,
            'slotId'        => (int) $b['slotId'],
        ]);
    } catch (Throwable $e) {
        fail($e->getMessage() ?: 'Afspraak kon niet worden opgeslagen.', 409);
    }

    $appointment = get_appointment_by_id($appointmentId);
    if ($appointment) {
        send_appointment_created_emails($appointment);
    }

    json_response(['message' => 'Afspraak succesvol ingepland.', 'appointmentId' => $appointmentId], 201);
});

// ============ Admin: login (geen auth) ============
route('POST', '/admin/auth/login', $method, $path, function () {
    $b = json_body();
    if (empty($b['email']) || empty($b['password'])) {
        fail('E-mail en wachtwoord zijn verplicht.', 400);
    }
    try {
        $token = login_admin($b['email'], $b['password']);
        json_response(['token' => $token]);
    } catch (Throwable $e) {
        fail($e->getMessage(), 401);
    }
});

// Alle overige /admin/* routes vereisen authenticatie.
if (str_starts_with($path, '/admin/')) {
    $admin = require_admin_auth();
}

route('POST', '/admin/phones/upload', $method, $path, function () {
    $config = require __DIR__ . '/config.php';
    if (empty($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('Geen bestand geupload.', 400);
    }
    $file = $_FILES['image'];
    if ($file['size'] > 2 * 1024 * 1024) {
        fail('Bestand is te groot (max 2 MB).', 400);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        fail('Alleen jpg, png of webp is toegestaan.', 400);
    }

    $dir = $config['uploads_dir'];
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $safeName = preg_replace('/[^a-zA-Z0-9.\-_]/', '-', $file['name']);
    $filename = (int) round(microtime(true) * 1000) . '-' . $safeName;
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
        fail('Uploaden mislukt.', 500);
    }

    json_response(['imageUrl' => $config['uploads_url_base'] . '/' . $filename], 201);
});

route('POST', '/admin/auth/change-password', $method, $path, function () use (&$admin) {
    $b = json_body();
    if (empty($b['currentPassword']) || empty($b['newPassword']) || empty($b['confirmPassword'])) {
        fail('Alle wachtwoordvelden zijn verplicht.', 400);
    }
    if ($b['newPassword'] !== $b['confirmPassword']) {
        fail('Nieuw wachtwoord en bevestiging komen niet overeen.', 400);
    }
    try {
        change_admin_password((int) $admin['sub'], $b['currentPassword'], $b['newPassword']);
        no_content();
    } catch (Throwable $e) {
        fail($e->getMessage(), 400);
    }
});

route('GET', '/admin/phones', $method, $path, function () {
    json_response(get_admin_phones());
});

route('POST', '/admin/phones', $method, $path, function () {
    $b = json_body();
    if (empty($b['brand']) || empty($b['modelName'])) {
        fail('Merk en model zijn verplicht.', 400);
    }
    $id = create_phone($b['brand'], $b['modelName'], $b['imageUrl'] ?? null, $b['deviceCategory'] ?? null);
    json_response(['id' => $id], 201);
});

route('PATCH', '/admin/phones/{id}', $method, $path, function ($id) {
    $b = json_body();
    if (empty($b['brand']) || empty($b['modelName']) || !is_bool($b['isActive'] ?? null)) {
        fail('Ongeldige gegevens voor telefoonupdate.', 400);
    }
    update_phone((int) $id, $b['brand'], $b['modelName'], $b['isActive'], $b['imageUrl'] ?? null, $b['deviceCategory'] ?? null);
    no_content();
});

route('GET', '/admin/availability', $method, $path, function () {
    json_response(get_admin_availability());
});

route('POST', '/admin/availability', $method, $path, function () {
    $b = json_body();
    if (empty($b['slotDate']) || empty($b['startTime']) || empty($b['endTime']) || empty($b['capacity'])) {
        fail('Onvolledige slotgegevens.', 400);
    }
    $id = create_availability($b['slotDate'], $b['startTime'], $b['endTime'], (int) $b['capacity']);
    json_response(['id' => $id], 201);
});

route('PATCH', '/admin/availability/day/{date}', $method, $path, function ($date) {
    $b = json_body();
    if ($date === '' || !is_bool($b['isActive'] ?? null)) {
        fail('Datum en isActive zijn verplicht.', 400);
    }
    toggle_day_availability($date, $b['isActive']);
    no_content();
});

route('PATCH', '/admin/availability/{id}', $method, $path, function ($id) {
    $b = json_body();
    if (empty($b['slotDate']) || empty($b['startTime']) || empty($b['endTime']) || empty($b['capacity']) || !is_bool($b['isActive'] ?? null)) {
        fail('Onvolledige slotgegevens.', 400);
    }
    update_availability((int) $id, $b['slotDate'], $b['startTime'], $b['endTime'], (int) $b['capacity'], $b['isActive']);
    no_content();
});

route('GET', '/admin/appointments', $method, $path, function () {
    json_response(get_admin_appointments(
        $_GET['status'] ?? '',
        $_GET['dateFrom'] ?? '',
        $_GET['dateTo'] ?? '',
        $_GET['q'] ?? ''
    ));
});

route('GET', '/admin/dashboard/summary', $method, $path, function () {
    json_response(get_dashboard_summary());
});

route('PATCH', '/admin/appointments/{id}/status', $method, $path, function ($id) {
    $b = json_body();
    $status = $b['status'] ?? '';
    if (!in_array($status, ['pending', 'confirmed', 'done', 'cancelled'], true)) {
        fail('Ongeldige status.', 400);
    }
    $previousStatus = update_appointment_status((int) $id, $status);
    $appointment = get_appointment_by_id((int) $id);
    if ($appointment) {
        send_appointment_status_change_emails($appointment, $previousStatus);
    }
    no_content();
});

route('DELETE', '/admin/appointments/{id}', $method, $path, function ($id) {
    $idNum = (int) $id;
    if ($idNum < 1) {
        fail('Ongeldig afspraak-id.', 400);
    }
    if (!delete_appointment($idNum)) {
        fail('Afspraak niet gevonden.', 404);
    }
    no_content();
});

// Geen route gematcht.
fail('Niet gevonden.', 404);
