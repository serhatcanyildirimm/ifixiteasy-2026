<?php
// HTTP-helpers: JSON-responses, request-body en fouten.

// Stuurt een JSON-response en stopt de uitvoering.
function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// 204 No Content (zoals res.status(204).send() in Express).
function no_content(): void
{
    http_response_code(204);
    exit;
}

// Stuurt een foutmelding in hetzelfde formaat als de Node-backend: { message }.
function fail(string $message, int $status = 400): void
{
    json_response(['message' => $message], $status);
}

// Leest en decodeert de JSON request-body (voor POST/PATCH/PUT).
function json_body(): array
{
    static $body = null;
    if ($body !== null) {
        return $body;
    }
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return $body = [];
    }
    $decoded = json_decode($raw, true);
    return $body = is_array($decoded) ? $decoded : [];
}

// Cast bekende booleaanse kolommen (MySQL TINYINT) terug naar echte booleans,
// zodat de JSON identiek is aan wat de PostgreSQL-backend teruggaf.
function cast_row(array $row, array $boolKeys = ['is_active']): array
{
    foreach ($boolKeys as $key) {
        if (array_key_exists($key, $row)) {
            $row[$key] = (bool) $row[$key];
        }
    }
    return $row;
}

function cast_rows(array $rows, array $boolKeys = ['is_active']): array
{
    return array_map(fn($r) => cast_row($r, $boolKeys), $rows);
}
