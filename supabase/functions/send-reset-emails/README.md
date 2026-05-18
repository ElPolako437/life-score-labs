# send-reset-emails

Edge Function für den automatisierten Reset-E-Mail-Versand.

## Cron Schedule

Täglich um **08:00 UTC** via Supabase Cron:

```
Cron expression: 0 8 * * *
```

**In Supabase Dashboard einrichten:**
→ Database → Cron Jobs → New Cron Job

| Feld | Wert |
|------|------|
| Name | `send-reset-emails` |
| Schedule | `0 8 * * *` |
| Type | Edge Function |
| Function | `send-reset-emails` |

## Secrets (bereits gesetzt oder setzen via Supabase Dashboard → Settings → Edge Functions → Secrets)

| Name | Beschreibung |
|------|-------------|
| `RESEND_API_KEY` | Resend API Key |
| `SUPABASE_URL` | Automatisch verfügbar |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatisch verfügbar |

## Mail-Logik

| Tag | Mail-Key |
|-----|----------|
| 1   | `tag-1`  |
| 5   | `tag-5`  |
| 7   | `tag-7`  |
| 9   | `tag-9`  |

- `start_datum` = Tag 1
- Bereits gesendete Mails werden in `mails_sent` (jsonb Array) gespeichert
- Keine Doppelversendung möglich

## Mail-Inhalte

Die HTML-Templates in `index.ts` sind aktuell Platzhalter (`[Inhalt für tag-X folgt]`).
Inhalte werden separat befüllt — Funktion ist sonst vollständig einsatzbereit.
