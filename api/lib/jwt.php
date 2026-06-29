<?php
// Minimale JWT (HS256) implementatie. Vervangt jsonwebtoken.

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

// Zet een "8h" / "30m" / "7d" / "3600" duur om naar seconden.
function parse_expires(string $value): int
{
    if (preg_match('/^(\d+)\s*([smhd])?$/', trim($value), $m)) {
        $n = (int) $m[1];
        $unit = $m[2] ?? 's';
        return match ($unit) {
            'm' => $n * 60,
            'h' => $n * 3600,
            'd' => $n * 86400,
            default => $n,
        };
    }
    return 8 * 3600;
}

function jwt_sign(array $payload, string $secret, string $expiresIn = '8h'): string
{
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + parse_expires($expiresIn);

    $segments = [
        base64url_encode(json_encode($header)),
        base64url_encode(json_encode($payload)),
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, $secret, true);
    $segments[] = base64url_encode($signature);

    return implode('.', $segments);
}

// Verifieert een token en geeft de payload terug, of null bij ongeldig/verlopen.
function jwt_verify(string $token, string $secret): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$h, $p, $s] = $parts;

    $expected = base64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $s)) {
        return null;
    }

    $payload = json_decode(base64url_decode($p), true);
    if (!is_array($payload)) {
        return null;
    }
    if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
        return null;
    }

    return $payload;
}

// Haalt de Authorization-header op (werkt onder diverse server-configuraties).
function get_auth_header(): string
{
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                return $value;
            }
        }
    }
    return '';
}

// Vereist een geldig admin-token. Geeft de payload terug of stuurt 401.
function require_admin_auth(): array
{
    $config = require __DIR__ . '/../config.php';
    $header = get_auth_header();
    $parts = explode(' ', $header, 2);
    $token = $parts[1] ?? '';

    if ($token === '') {
        fail('Niet ingelogd.', 401);
    }

    $payload = jwt_verify($token, $config['jwt_secret']);
    if ($payload === null) {
        fail('Sessie ongeldig of verlopen.', 401);
    }

    return $payload;
}
