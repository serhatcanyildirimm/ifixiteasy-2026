<?php
// E-mail: templates + verzending via PHP mail(). Vervangt mail.service.js en
// mail-templates.js. Verzenden is "best effort" en mag een afspraak nooit breken.

const BRAND = [
    'primary'     => '#0a84ff',
    'primaryDark' => '#0066cc',
    'accent'      => '#30d158',
    'danger'      => '#ff3b30',
    'warning'     => '#ff9f0a',
    'dark'        => '#1c1c1e',
    'text'        => '#111111',
    'textMuted'   => '#6e6e73',
    'bg'          => '#f5f5f7',
    'white'       => '#ffffff',
    'border'      => '#e5e5ea',
];

function esc_html($value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function render_detail_row(string $label, string $value): string
{
    $b = BRAND;
    return "
  <tr>
    <td style=\"padding:12px 16px;border-bottom:1px solid {$b['border']};color:{$b['textMuted']};font-size:13px;width:38%;vertical-align:top;\">
      " . esc_html($label) . "
    </td>
    <td style=\"padding:12px 16px;border-bottom:1px solid {$b['border']};color:{$b['text']};font-size:14px;font-weight:600;vertical-align:top;\">
      " . esc_html($value) . "
    </td>
  </tr>";
}

function render_details_card(array $rows): string
{
    $b = BRAND;
    return "
  <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0 0;border:1px solid {$b['border']};border-radius:14px;overflow:hidden;background:{$b['bg']};\">
    " . implode('', $rows) . "
  </table>";
}

function render_layout(array $opt): string
{
    $b = BRAND;
    $preheader  = $opt['preheader'] ?? '';
    $badge      = $opt['badge'] ?? '';
    $badgeColor = $opt['badgeColor'] ?? $b['primary'];
    $headline   = $opt['headline'] ?? '';
    $intro      = $opt['intro'] ?? '';
    $bodyHtml   = $opt['bodyHtml'] ?? '';
    $footerNote = $opt['footerNote'] ?? 'iFixItEasy — snelle en betrouwbare telefoonreparatie';
    $variant    = $opt['variant'] ?? 'customer';
    $headerBg   = $variant === 'admin' ? $b['dark'] : $b['primary'];
    $topLabel   = $variant === 'admin' ? 'Admin notificatie' : 'Telefoonreparatie';

    return '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>' . esc_html($headline) . '</title>
</head>
<body style="margin:0;padding:0;background-color:' . $b['bg'] . ';font-family:\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">' . esc_html($preheader) . '</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' . $b['bg'] . ';padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:' . $b['white'] . ';border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(17,17,17,0.08);">
          <tr>
            <td style="background-color:' . $headerBg . ';padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.75);">
                ' . esc_html($topLabel) . '
              </p>
              <img src="https://www.ifixiteasy.nl/assets/images/iFixItEasy-logo.png" alt="iFixItEasy" height="40" style="display:inline-block;height:40px;width:auto;max-width:100%;border:0;outline:none;text-decoration:none;background-color:' . $b['white'] . ';padding:10px 18px;border-radius:12px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:' . $badgeColor . '18;color:' . $badgeColor . ';font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
                ' . esc_html($badge) . '
              </span>
              <h2 style="margin:16px 0 12px;font-size:24px;line-height:1.3;color:' . $b['text'] . ';letter-spacing:-0.02em;">
                ' . esc_html($headline) . '
              </h2>
              <p style="margin:0;font-size:16px;line-height:1.6;color:' . $b['textMuted'] . ';">
                ' . $intro . '
              </p>
              ' . $bodyHtml . '
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top:16px;border-top:1px solid ' . $b['border'] . ';">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:' . $b['textMuted'] . ';text-align:center;">
                      ' . esc_html($footerNote) . '
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';
}

function build_appointment_details(array $a): array
{
    $device = trim(($a['brand'] ?? '') . ' ' . ($a['model_name'] ?? ''));
    $start = substr((string) $a['start_time'], 0, 5);
    $end = substr((string) $a['end_time'], 0, 5);
    $slotText = $a['slot_date'] . ' · ' . $start . ' – ' . $end;

    $rows = [
        render_detail_row('Toestel', $device),
        render_detail_row('Probleem', $a['issue_label']),
        render_detail_row('Datum & tijd', $slotText),
    ];
    if (!empty($a['notes'])) {
        $rows[] = render_detail_row('Opmerking', $a['notes']);
    }

    return ['device' => $device, 'slotText' => $slotText, 'card' => render_details_card($rows)];
}

function build_contact_details(array $a): string
{
    return render_details_card([
        render_detail_row('Naam', $a['customer_name']),
        render_detail_row('Telefoon', $a['customer_phone']),
        render_detail_row('E-mail', $a['customer_email'] ?: '—'),
    ]);
}

function tpl_customer_booking(array $a): array
{
    $d = build_appointment_details($a);
    $name = $a['customer_name'];
    $lines = ["Hallo $name,", '', 'Je afspraak is succesvol ingepland.', '',
        "Toestel: {$d['device']}", "Probleem: {$a['issue_label']}", "Tijdslot: {$d['slotText']}"];
    if (!empty($a['notes'])) {
        $lines[] = "Opmerking: {$a['notes']}";
    }
    $lines[] = '';
    $lines[] = 'Tot ziens bij iFixItEasy!';

    return [
        'subject' => 'Bevestiging van je afspraak bij iFixItEasy',
        'text' => implode("\n", $lines),
        'html' => render_layout([
            'preheader' => "Je afspraak voor {$d['device']} staat gepland op {$d['slotText']}.",
            'badge' => 'Afspraak bevestigd', 'badgeColor' => BRAND['accent'],
            'headline' => "Bedankt, $name!",
            'intro' => 'Je afspraak is succesvol ingepland. Hieronder vind je een overzicht van je gegevens.',
            'bodyHtml' => $d['card'],
            'footerNote' => 'Kom je eerder of later? Neem even contact met ons op.',
        ]),
    ];
}

function tpl_admin_new_booking(array $a): array
{
    $d = build_appointment_details($a);
    $lines = ['Er is een nieuwe afspraak ingepland.', '',
        "Naam: {$a['customer_name']}", "Telefoon: {$a['customer_phone']}",
        'E-mail: ' . ($a['customer_email'] ?: '—'), '',
        "Toestel: {$d['device']}", "Probleem: {$a['issue_label']}", "Tijdslot: {$d['slotText']}"];

    return [
        'subject' => "Nieuwe afspraak #{$a['id']}",
        'text' => implode("\n", $lines),
        'html' => render_layout([
            'variant' => 'admin',
            'preheader' => "Nieuwe afspraak van {$a['customer_name']} voor {$d['device']}.",
            'badge' => "Afspraak #{$a['id']}", 'badgeColor' => BRAND['primary'],
            'headline' => 'Nieuwe afspraak ingepland',
            'intro' => 'Er is zojuist een nieuwe afspraak via de website binnengekomen.',
            'bodyHtml' => build_contact_details($a) . $d['card'],
        ]),
    ];
}

function tpl_customer_cancelled(array $a): array
{
    $d = build_appointment_details($a);
    $name = $a['customer_name'];
    $lines = ["Hallo $name,", '', 'Je afspraak is geannuleerd.', '',
        "Toestel: {$d['device']}", "Probleem: {$a['issue_label']}", '',
        'Heb je vragen? Neem gerust contact met ons op.'];

    return [
        'subject' => 'Je afspraak bij iFixItEasy is geannuleerd',
        'text' => implode("\n", $lines),
        'html' => render_layout([
            'preheader' => 'Je afspraak is geannuleerd.',
            'badge' => 'Geannuleerd', 'badgeColor' => BRAND['danger'],
            'headline' => "Hallo $name",
            'intro' => 'Je afspraak is geannuleerd. Hieronder staan de oorspronkelijke gegevens ter referentie.',
            'bodyHtml' => $d['card'],
            'footerNote' => 'Wil je een nieuwe afspraak maken? Bezoek onze website.',
        ]),
    ];
}

function tpl_admin_cancelled(array $a): array
{
    $d = build_appointment_details($a);
    return [
        'subject' => "Afspraak #{$a['id']} geannuleerd",
        'text' => "Afspraak #{$a['id']} is geannuleerd.\n\nNaam: {$a['customer_name']}\nTelefoon: {$a['customer_phone']}",
        'html' => render_layout([
            'variant' => 'admin',
            'preheader' => "Afspraak #{$a['id']} is geannuleerd.",
            'badge' => 'Geannuleerd', 'badgeColor' => BRAND['danger'],
            'headline' => "Afspraak #{$a['id']} geannuleerd",
            'intro' => 'Deze afspraak is in het admin-panel gemarkeerd als geannuleerd.',
            'bodyHtml' => build_contact_details($a) . $d['card'],
        ]),
    ];
}

function tpl_customer_done(array $a): array
{
    $d = build_appointment_details($a);
    $name = $a['customer_name'];
    $b = BRAND;
    $lines = ["Hallo $name,", '', 'Goed nieuws: je reparatie is afgerond. Je kunt je toestel ophalen.', '',
        "Toestel: {$d['device']}", '', 'We zien je graag bij iFixItEasy!'];
    $extra = "{$d['card']}
        <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:24px;\">
          <tr>
            <td align=\"center\" style=\"padding:16px 20px;background-color:{$b['accent']}14;border-radius:14px;border:1px solid {$b['accent']}33;\">
              <p style=\"margin:0;font-size:15px;line-height:1.5;color:{$b['text']};\">
                <strong style=\"color:{$b['accent']};\">Tip:</strong> Neem je referentienummer <strong>#{$a['id']}</strong> mee bij het ophalen.
              </p>
            </td>
          </tr>
        </table>";

    return [
        'subject' => 'Je reparatie is klaar – iFixItEasy',
        'text' => implode("\n", $lines),
        'html' => render_layout([
            'preheader' => "Je {$d['device']} is klaar om opgehaald te worden.",
            'badge' => 'Reparatie klaar', 'badgeColor' => BRAND['accent'],
            'headline' => "Goed nieuws, $name!",
            'intro' => 'Je reparatie is afgerond. Je kunt je toestel op komen halen wanneer het jou uitkomt.',
            'bodyHtml' => $extra,
            'footerNote' => 'Bedankt voor je vertrouwen in iFixItEasy!',
        ]),
    ];
}

function tpl_admin_done(array $a): array
{
    $d = build_appointment_details($a);
    return [
        'subject' => "Afspraak #{$a['id']} afgerond",
        'text' => "Afspraak #{$a['id']} is gemarkeerd als afgerond.\n\nNaam: {$a['customer_name']}\nTelefoon: {$a['customer_phone']}",
        'html' => render_layout([
            'variant' => 'admin',
            'preheader' => "Afspraak #{$a['id']} is afgerond.",
            'badge' => 'Afgerond', 'badgeColor' => BRAND['accent'],
            'headline' => "Afspraak #{$a['id']} afgerond",
            'intro' => 'De klant is per e-mail geïnformeerd dat de reparatie klaar is.',
            'bodyHtml' => build_contact_details($a) . $d['card'],
        ]),
    ];
}

// --- Verzending ---

function mail_config(): array
{
    $config = require __DIR__ . '/../config.php';
    return $config['mail'];
}

function send_mail(string $to, array $email): void
{
    $cfg = mail_config();
    if (empty($cfg['enabled'])) {
        return;
    }
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: iFixItEasy <' . $cfg['from'] . '>',
    ];
    @mail($to, '=?UTF-8?B?' . base64_encode($email['subject']) . '?=', $email['html'], implode("\r\n", $headers));
}

// Stuurt bevestigingsmails na het aanmaken van een afspraak (klant + admin).
function send_appointment_created_emails(array $appointment): void
{
    $cfg = mail_config();
    try {
        if (!empty($appointment['customer_email'])) {
            send_mail($appointment['customer_email'], tpl_customer_booking($appointment));
        }
        if (!empty($cfg['admin'])) {
            send_mail($cfg['admin'], tpl_admin_new_booking($appointment));
        }
    } catch (Throwable $e) {
        error_log('Bevestigingsmail mislukt: ' . $e->getMessage());
    }
}

// Stuurt statusmails bij annulering of afronding.
function send_appointment_status_change_emails(array $appointment, ?string $previousStatus): void
{
    $status = $appointment['status'] ?? '';
    if ($previousStatus === $status) {
        return;
    }
    if (!in_array($status, ['cancelled', 'done'], true)) {
        return;
    }

    $cfg = mail_config();
    try {
        if ($status === 'cancelled') {
            if (!empty($appointment['customer_email'])) {
                send_mail($appointment['customer_email'], tpl_customer_cancelled($appointment));
            }
            if (!empty($cfg['admin'])) {
                send_mail($cfg['admin'], tpl_admin_cancelled($appointment));
            }
        } elseif ($status === 'done') {
            if (!empty($appointment['customer_email'])) {
                send_mail($appointment['customer_email'], tpl_customer_done($appointment));
            }
            if (!empty($cfg['admin'])) {
                send_mail($cfg['admin'], tpl_admin_done($appointment));
            }
        }
    } catch (Throwable $e) {
        error_log('Statusmail mislukt: ' . $e->getMessage());
    }
}
