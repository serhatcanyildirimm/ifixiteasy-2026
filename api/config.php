<?php
// iFixItEasy - centrale configuratie voor de PHP-backend.
// LET OP: dit bestand bevat geheimen. PHP-bestanden worden NIET als broncode
// uitgeserveerd, dus dit is veilig op de server. Deel het niet publiek.

return [
    // --- Database (DirectAdmin / MySQL) ---
    'db' => [
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'ifixit_NEWDB',
        'user'     => 'ifixit_NEWDB',
        'password' => 'Q95NvCpXZEy9tqgTUgTb',
        'charset'  => 'utf8mb4',
    ],

    // --- Authenticatie ---
    'jwt_secret'     => '477b9a95b03ddc57b1f400b299e0a3f764cc10da6e0c657b542e575d58998ae0cf5b850a38d5b78721dc7c7456af478a',
    'jwt_expires_in' => '8h',

    // --- Standaard admin (wordt aangemaakt via mysql_schema.sql) ---
    'admin_default_email'    => 'admin@ifixiteasy.nl',
    'admin_default_password' => 'Admin123!',

    // --- Uploads ---
    // Map waar geuploade telefoonafbeeldingen worden opgeslagen, en het
    // publieke URL-pad waarmee de frontend ze opvraagt.
    'uploads_dir'      => __DIR__ . '/../server/uploads',
    'uploads_url_base' => '/server/uploads',

    // --- E-mail ---
    // PHP mail() via de mailserver van de hosting. Zet 'enabled' op false om
    // mailen volledig uit te schakelen (afspraken werken dan gewoon door).
    'mail' => [
        'enabled' => true,
        'from'    => 'noreply@ifixiteasy.nl',
        'admin'   => 'info@ifixiteasy.nl',
    ],
];
