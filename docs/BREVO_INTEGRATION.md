# Brevo Newsletter Integration

## Overview

This integration syncs Bio Age Test submissions to Brevo (formerly Sendinblue) with dual-list management:

- **List #3 (BioAge Leads)**: ALL test submissions are added automatically
- **List #2 (Longevity Newsletter)**: External Brevo form signup only

## Configuration

### Environment Variables (Secrets)

Configure these in Lovable Cloud settings:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `BREVO_API_KEY` | Your Brevo API key | `xkeysib-xxxx...` |
| `BREVO_LIST_ID_BIOAGE` | List ID for all submissions | `3` |
| `BREVO_LIST_ID_NEWSLETTER` | List ID for newsletter opt-ins | `2` |

### Getting Brevo List IDs

1. Log in to [Brevo Dashboard](https://app.brevo.com)
2. Go to **Contacts > Lists**
3. Click on a list to view its ID in the URL (e.g., `/lists/3`)

## Data Flow

### Submission (Index.tsx)

```
User completes test → DB write → sync-brevo edge function
                                 ↓
                                 Contact created/updated in Brevo
                                 ↓
                                 Added to List #3 (BioAge Leads)
```

### Newsletter Opt-in (TestResults.tsx)

```
User clicks "Newsletter" CTA → Opens external Brevo form (sibforms.com)
                              ↓
                              User signs up via Brevo form
                              ↓
                              Brevo adds to List #2 (Newsletter)
```

## Brevo Contact Attributes

Only these fields are synced:

| Attribute | Description |
|-----------|-------------|
| `FIRSTNAME` | User's first name (if provided) |
| `email` | User's email address |

## API Call (Single Request)

The edge function uses a single API call to create/update contact AND add to list:

```json
POST https://api.brevo.com/v3/contacts
{
  "email": "user@example.com",
  "attributes": { "FIRSTNAME": "Max" },
  "listIds": [3],
  "updateEnabled": true
}
```

For existing contacts, it falls back to separate list-add calls.

## Error Handling & Retry

- Failed syncs are stored in `brevo_sync_failures` table
- Includes: email, firstname, error_message, error_status
- Can be retried manually or via scheduled job

## Server Logs

The edge function logs:
```
[sync-brevo] BREVO_SYNC_START email=test@example.com newsletterOptIn=false
[sync-brevo] Sending to Brevo: listIds=[3]
[sync-brevo] BREVO_SYNC_SUCCESS status=201 email=test@example.com listIds=[3]
```

On error:
```
[sync-brevo] BREVO_SYNC_ERROR status=400 body={...} email=test@example.com
[sync-brevo] Stored failure for retry: test@example.com
```

## Testing

### Test with a dummy email:

1. Complete the Bio Age Test using a test email (e.g., `test+brevo@yourdomain.com`)
2. Check in Brevo Dashboard: Contact appears in List #3 (BioAge Leads)
3. Check edge function logs for `BREVO_SYNC_SUCCESS`

### Check failed syncs:

```sql
SELECT * FROM brevo_sync_failures WHERE resolved_at IS NULL ORDER BY created_at DESC;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Contact not appearing in Brevo | Check BREVO_API_KEY is correct |
| Wrong list | Verify BREVO_LIST_ID_BIOAGE = 3 |
| 400 error on contact creation | Check email format, may need fallback to list-add |
| No logs appearing | Redeploy edge function |

## Files

- `supabase/functions/sync-brevo/index.ts` - Edge function for Brevo API
- `src/pages/Index.tsx` - Calls sync-brevo after test submission
- `src/components/TestResults.tsx` - Newsletter CTA (external link)
