# WhatsApp templates to submit to Meta

Language: English (`en`). Category: Utility. Names and variable order must match exactly.

| Name | Body |
|---|---|
| `pass_confirmed` | Your pass for {{1}} on {{2}} is confirmed. Pass code: {{3}}. |
| `event_reminder` | Reminder: {{1}} is tomorrow at {{2}}, {{3}}. Your pass code is {{4}}. |
| `event_soon` | {{1}} starts at {{2}}. Gates open at {{3}}. Your pass code is {{4}}. |
| `event_updated` | {{1}} has changed: {{2}}. |
| `event_cancelled` | {{1}} on {{2}} has been cancelled. |
| `payment_pending` | Your payment for {{1}} ({{2}}) on {{3}} is still pending. |
| `waitlist_offer` | A seat opened up for {{1}}. Confirm by {{2}}. |
| `certificate_ready` | Your certificate for {{1}} is ready on EvntCult. |
| `checked_in` | You are checked in at {{1}}. Your certificate: {{2}} |
| `event_update` | Update for {{1}}: {{2}} |

## Going live

Set these on the Worker. No other change is needed.

```
npx wrangler secret put WA_PHONE_NUMBER_ID
npx wrangler secret put WA_TOKEN
npx wrangler secret put WA_APP_SECRET
npx wrangler secret put WA_VERIFY_TOKEN
```

Webhook URL: `/api/webhooks/whatsapp`, subscribed to `messages`.
