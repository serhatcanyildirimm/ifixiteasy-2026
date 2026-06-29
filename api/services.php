<?php
// Databaselogica. Vervangt server/services/*.js (MySQL i.p.v. PostgreSQL).

require_once __DIR__ . '/lib/db.php';

const DEVICE_CATEGORIES = ['smartphone', 'laptop', 'tablet', 'console', 'computer', 'watch'];

function normalize_device_category($value): string
{
    $v = strtolower(trim((string) ($value ?: 'smartphone')));
    return in_array($v, DEVICE_CATEGORIES, true) ? $v : 'smartphone';
}

// ---------- Phones ----------

function get_public_phones(): array
{
    return cast_rows(db_all(
        'SELECT id, brand, model_name, image_url, device_category
         FROM phones WHERE is_active = 1
         ORDER BY brand ASC, model_name ASC'
    ));
}

function get_admin_phones(): array
{
    return cast_rows(db_all(
        'SELECT id, brand, model_name, image_url, device_category, is_active, created_at, updated_at
         FROM phones ORDER BY brand ASC, model_name ASC'
    ));
}

function create_phone(string $brand, string $modelName, ?string $imageUrl, $deviceCategory): int
{
    $category = normalize_device_category($deviceCategory);
    db_exec(
        'INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
         VALUES (?, ?, ?, ?, 1)',
        [$brand, $modelName, $imageUrl ?: null, $category]
    );
    return (int) db()->lastInsertId();
}

function update_phone(int $id, string $brand, string $modelName, bool $isActive, ?string $imageUrl, $deviceCategory): void
{
    if ($deviceCategory === null) {
        db_exec(
            'UPDATE phones SET brand = ?, model_name = ?, image_url = ?, is_active = ? WHERE id = ?',
            [$brand, $modelName, $imageUrl ?: null, $isActive ? 1 : 0, $id]
        );
        return;
    }
    $category = normalize_device_category($deviceCategory);
    db_exec(
        'UPDATE phones SET brand = ?, model_name = ?, image_url = ?, device_category = ?, is_active = ? WHERE id = ?',
        [$brand, $modelName, $imageUrl ?: null, $category, $isActive ? 1 : 0, $id]
    );
}

// Vindt-of-maakt een placeholder-toestel voor een door de klant zelf getypte
// toestelnaam (wanneer het toestel niet in de catalogus staat). De rij krijgt
// merk 'Overig' en is_active = 0, zodat hij niet in de publieke lijst verschijnt
// maar de afspraak wel een geldige phone_id heeft en de admin de naam ziet.
function resolve_custom_phone_id(string $name, $deviceCategory): int
{
    $name = trim($name);
    if ($name === '') {
        throw new RuntimeException('Toestelnaam is verplicht.');
    }
    if (mb_strlen($name) > 120) {
        $name = mb_substr($name, 0, 120);
    }
    $category = normalize_device_category($deviceCategory);
    $existing = db_one(
        "SELECT id FROM phones
         WHERE brand = 'Overig' AND model_name = ? AND device_category = ?
         LIMIT 1",
        [$name, $category]
    );
    if ($existing) {
        return (int) $existing['id'];
    }
    db_exec(
        "INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
         VALUES ('Overig', ?, NULL, ?, 0)",
        [$name, $category]
    );
    return (int) db()->lastInsertId();
}

// ---------- Issues ----------

function get_public_issues(): array
{
    return db_all('SELECT id, code, label FROM issue_types WHERE is_active = 1 ORDER BY label ASC');
}

// Vindt-of-maakt een verborgen issue-type voor een door de klant zelf getypt
// probleem (is_active = 0 zodat het niet in de publieke lijst komt, maar de
// afspraak wel een geldige issue_type_id heeft en de admin het probleem ziet).
function resolve_custom_issue_id(string $label): int
{
    $label = trim($label);
    if ($label === '') {
        throw new RuntimeException('Omschrijf je probleem.');
    }
    if (mb_strlen($label) > 120) {
        $label = mb_substr($label, 0, 120);
    }
    $existing = db_one(
        "SELECT id FROM issue_types WHERE is_active = 0 AND label = ? LIMIT 1",
        [$label]
    );
    if ($existing) {
        return (int) $existing['id'];
    }
    // Genereer een unieke code (kolom is UNIQUE).
    $code = 'custom-' . substr(bin2hex(random_bytes(8)), 0, 12);
    db_exec(
        "INSERT INTO issue_types (code, label, is_active) VALUES (?, ?, 0)",
        [$code, $label]
    );
    return (int) db()->lastInsertId();
}

// ---------- Availability ----------

const SLOT_DURATION_MINUTES = 30;
const DEFAULT_SLOT_CAPACITY = 1;
const AUTO_GENERATE_DAYS_AHEAD = 45;

// Openingstijden per weekdag (0=zondag .. 6=zaterdag), zoals availability.service.js.
function opening_hours_for_weekday(int $weekday): ?array
{
    $map = [
        1 => ['09:00:00', '17:30:00'],
        2 => ['09:00:00', '17:30:00'],
        3 => ['09:00:00', '17:30:00'],
        4 => ['09:00:00', '17:30:00'],
        5 => ['09:00:00', '17:30:00'],
        6 => ['09:00:00', '17:00:00'],
    ];
    return $map[$weekday] ?? null;
}

function time_to_minutes(string $t): int
{
    [$h, $m] = array_map('intval', explode(':', $t));
    return $h * 60 + $m;
}

function minutes_to_time(int $total): string
{
    return sprintf('%02d:%02d:00', intdiv($total, 60), $total % 60);
}

function build_day_slots(string $slotDate): array
{
    $ts = strtotime($slotDate);
    if ($ts === false) {
        return [];
    }
    $weekday = (int) date('w', $ts);
    $hours = opening_hours_for_weekday($weekday);
    if ($hours === null) {
        return [];
    }
    $start = time_to_minutes($hours[0]);
    $end = time_to_minutes($hours[1]);
    $slots = [];
    for ($cursor = $start; $cursor + SLOT_DURATION_MINUTES <= $end; $cursor += SLOT_DURATION_MINUTES) {
        $slots[] = [$slotDate, minutes_to_time($cursor), minutes_to_time($cursor + SLOT_DURATION_MINUTES), DEFAULT_SLOT_CAPACITY];
    }
    return $slots;
}

function ensure_availability_for_date(string $slotDate): void
{
    $daySlots = build_day_slots($slotDate);
    if (!$daySlots) {
        return;
    }
    $existing = db_one('SELECT id FROM availability_slots WHERE slot_date = ? LIMIT 1', [$slotDate]);
    if ($existing) {
        return;
    }
    foreach ($daySlots as $s) {
        db_exec(
            'INSERT IGNORE INTO availability_slots (slot_date, start_time, end_time, capacity, is_active)
             VALUES (?, ?, ?, ?, 1)',
            [$s[0], $s[1], $s[2], $s[3]]
        );
    }
}

function ensure_availability_window(int $daysAhead = AUTO_GENERATE_DAYS_AHEAD): void
{
    $today = strtotime('today');
    for ($offset = 0; $offset <= $daysAhead; $offset++) {
        ensure_availability_for_date(date('Y-m-d', strtotime("+$offset day", $today)));
    }
}

function get_public_availability_by_date(string $date): array
{
    ensure_availability_for_date($date);
    $rows = db_all(
        "SELECT s.id, DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date, s.start_time, s.end_time, s.capacity,
                COUNT(a.id) AS booked_count
         FROM availability_slots s
         LEFT JOIN appointments a ON a.slot_id = s.id AND a.status IN ('pending', 'confirmed')
         WHERE s.slot_date = ? AND s.is_active = 1
         GROUP BY s.id
         HAVING COUNT(a.id) < s.capacity
         ORDER BY s.start_time ASC",
        [$date]
    );
    return array_map(function ($r) {
        $r['booked_count'] = (int) $r['booked_count'];
        return $r;
    }, $rows);
}

function get_admin_availability(): array
{
    ensure_availability_window();
    return cast_rows(db_all(
        "SELECT id, DATE_FORMAT(slot_date, '%Y-%m-%d') AS slot_date, start_time, end_time, capacity, is_active, updated_at
         FROM availability_slots ORDER BY slot_date ASC, start_time ASC"
    ));
}

function create_availability(string $slotDate, string $startTime, string $endTime, int $capacity): int
{
    db_exec(
        'INSERT INTO availability_slots (slot_date, start_time, end_time, capacity, is_active)
         VALUES (?, ?, ?, ?, 1)',
        [$slotDate, $startTime, $endTime, $capacity]
    );
    return (int) db()->lastInsertId();
}

function update_availability(int $id, string $slotDate, string $startTime, string $endTime, int $capacity, bool $isActive): void
{
    db_exec(
        'UPDATE availability_slots SET slot_date = ?, start_time = ?, end_time = ?, capacity = ?, is_active = ? WHERE id = ?',
        [$slotDate, $startTime, $endTime, $capacity, $isActive ? 1 : 0, $id]
    );
}

function toggle_day_availability(string $date, bool $isActive): void
{
    db_exec('UPDATE availability_slots SET is_active = ? WHERE slot_date = ?', [$isActive ? 1 : 0, $date]);
}

// ---------- Appointments ----------

function create_appointment(array $p): int
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $slot = db_one(
            'SELECT id, capacity, is_active FROM availability_slots WHERE id = ? FOR UPDATE',
            [$p['slotId']]
        );
        if (!$slot || (int) $slot['is_active'] !== 1) {
            throw new RuntimeException('Dit tijdslot is niet beschikbaar.');
        }

        $count = db_one(
            "SELECT COUNT(*) AS booked_count FROM appointments WHERE slot_id = ? AND status IN ('pending', 'confirmed')",
            [$p['slotId']]
        );
        if ((int) $count['booked_count'] >= (int) $slot['capacity']) {
            throw new RuntimeException('Dit tijdslot is al volgeboekt.');
        }

        db_exec(
            "INSERT INTO appointments
             (customer_name, customer_phone, customer_email, phone_id, issue_type_id, notes, slot_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
            [
                $p['customerName'], $p['customerPhone'], $p['customerEmail'] ?: null,
                $p['phoneId'], $p['issueTypeId'], $p['notes'] ?: null, $p['slotId'],
            ]
        );
        $id = (int) $pdo->lastInsertId();
        $pdo->commit();
        return $id;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_admin_appointments(string $status, string $dateFrom, string $dateTo, string $query): array
{
    $sql = "SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.notes, a.status, a.created_at,
                   p.brand, p.model_name, p.image_url,
                   i.label AS issue_label,
                   DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date, s.start_time, s.end_time
            FROM appointments a
            INNER JOIN phones p ON p.id = a.phone_id
            INNER JOIN issue_types i ON i.id = a.issue_type_id
            INNER JOIN availability_slots s ON s.id = a.slot_id
            WHERE 1 = 1";
    $params = [];

    if ($status !== '') {
        $sql .= ' AND a.status = ?';
        $params[] = $status;
    }
    if ($dateFrom !== '') {
        $sql .= ' AND s.slot_date >= ?';
        $params[] = $dateFrom;
    }
    if ($dateTo !== '') {
        $sql .= ' AND s.slot_date <= ?';
        $params[] = $dateTo;
    }
    if ($query !== '') {
        $sql .= ' AND (a.customer_name LIKE ? OR a.customer_phone LIKE ? OR p.model_name LIKE ?)';
        $like = '%' . $query . '%';
        array_push($params, $like, $like, $like);
    }

    $chronological = $dateFrom !== '' && $dateTo !== '';
    $sql .= $chronological
        ? ' ORDER BY s.slot_date ASC, s.start_time ASC'
        : ' ORDER BY s.slot_date DESC, s.start_time DESC';

    return db_all($sql, $params);
}

function get_appointment_by_id(int $id): ?array
{
    return db_one(
        "SELECT a.id, a.customer_name, a.customer_phone, a.customer_email, a.notes, a.status,
                p.brand, p.model_name,
                i.label AS issue_label,
                DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date, s.start_time, s.end_time
         FROM appointments a
         INNER JOIN phones p ON p.id = a.phone_id
         INNER JOIN issue_types i ON i.id = a.issue_type_id
         INNER JOIN availability_slots s ON s.id = a.slot_id
         WHERE a.id = ?",
        [$id]
    );
}

function update_appointment_status(int $id, string $status): ?string
{
    $row = db_one('SELECT status FROM appointments WHERE id = ?', [$id]);
    $previousStatus = $row['status'] ?? null;
    db_exec('UPDATE appointments SET status = ? WHERE id = ?', [$status, $id]);
    return $previousStatus;
}

function delete_appointment(int $id): bool
{
    return db_exec('DELETE FROM appointments WHERE id = ?', [$id])->rowCount() > 0;
}

// ---------- Dashboard ----------

function get_dashboard_summary(): array
{
    $counts = db_one(
        "SELECT
            (SELECT COUNT(*) FROM appointments) AS totalAppointments,
            (SELECT COUNT(*) FROM appointments WHERE status IN ('pending', 'confirmed')) AS openAppointments,
            (SELECT COUNT(*) FROM availability_slots WHERE is_active = 1) AS activeSlots,
            (SELECT COUNT(*) FROM phones WHERE is_active = 1) AS activePhones"
    );
    $counts = array_map('intval', $counts);

    $statusBreakdown = db_all(
        'SELECT status, COUNT(*) AS total FROM appointments GROUP BY status ORDER BY total DESC'
    );

    $upcoming = db_all(
        "SELECT a.id, a.customer_name, a.status, DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
                s.start_time, s.end_time, p.brand, p.model_name
         FROM appointments a
         INNER JOIN availability_slots s ON s.id = a.slot_id
         INNER JOIN phones p ON p.id = a.phone_id
         WHERE s.slot_date >= CURDATE()
         ORDER BY s.slot_date ASC, s.start_time ASC
         LIMIT 6"
    );

    return ['counts' => $counts, 'statusBreakdown' => $statusBreakdown, 'upcomingAppointments' => $upcoming];
}

// ---------- Admin auth ----------

function login_admin(string $email, string $password): string
{
    $config = require __DIR__ . '/config.php';
    $admin = db_one('SELECT id, email, password_hash, role, is_active FROM admin_users WHERE email = ?', [$email]);

    if (!$admin || (int) $admin['is_active'] !== 1 || !password_verify($password, $admin['password_hash'])) {
        throw new RuntimeException('Onjuiste inloggegevens.');
    }

    return jwt_sign(
        ['sub' => (int) $admin['id'], 'email' => $admin['email'], 'role' => $admin['role']],
        $config['jwt_secret'],
        $config['jwt_expires_in']
    );
}

function change_admin_password(int $adminId, string $currentPassword, string $newPassword): void
{
    $admin = db_one('SELECT id, password_hash, is_active FROM admin_users WHERE id = ?', [$adminId]);
    if (!$admin || (int) $admin['is_active'] !== 1) {
        throw new RuntimeException('Admin account niet beschikbaar.');
    }
    if (!password_verify($currentPassword, $admin['password_hash'])) {
        throw new RuntimeException('Huidig wachtwoord is onjuist.');
    }
    if (strlen($newPassword) < 8 || !preg_match('/[a-zA-Z]/', $newPassword) || !preg_match('/\d/', $newPassword)) {
        throw new RuntimeException('Nieuw wachtwoord moet minimaal 8 tekens, letters en cijfers bevatten.');
    }
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    db_exec('UPDATE admin_users SET password_hash = ? WHERE id = ?', [$hash, $adminId]);
}
