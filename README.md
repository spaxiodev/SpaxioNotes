# Spaxio

Spaxio is an AI-native operating system for students, creators, freelancers, and young professionals.

This build is prepared for production deployment on Vercel with:

- Supabase authentication with SSR cookies
- Supabase row-level security for user-owned data
- Supabase private storage bucket for uploads
- Stripe Checkout for Pro subscriptions
- Stripe Billing Portal
- Stripe webhook handling for subscription state
- Anthropic-backed workspace assistant and structured capture
- SMTP reminder email via Private Email-compatible mail servers
- Local fallback mode when Supabase env vars are not present

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. In Supabase Auth settings, set the site URL:

```text
http://localhost:3000
```

For production, set it to your Vercel URL.

4. Add redirect URLs:

```text
http://localhost:3000/auth/confirm
https://your-domain.com/auth/confirm
```

5. Update the Supabase Confirm signup email template to use:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

## Stripe Setup

1. Create a Stripe product named `Spaxio Pro`.
2. Create a recurring monthly price for CA$15/month.
3. Copy the price ID into `STRIPE_PRO_PRICE_ID`.
4. Create a second recurring monthly price for CA$10/month for invite promotions.
5. Copy the invite price ID into `STRIPE_PRO_REFERRAL_PRICE_ID`.
6. Use a restricted API key when possible, scoped to the Stripe resources this app needs.
7. Add a webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

8. Subscribe the webhook to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

9. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Environment Variables

Required on Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_PRO_REFERRAL_PRICE_ID=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
PROMOTION_EMAIL_CRON_SECRET=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, or `SMTP_PASS` to the browser.

## SMTP Reminder Email

Reminder cards include an email action that sends the reminder to the signed-in user's email address through `/api/reminders/email`.

For Namecheap Private Email, use:

```bash
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@your-domain.com
SMTP_PASS=your-private-email-password
SMTP_FROM=you@your-domain.com
```

The SMTP values are server-only. In production with Supabase enabled, the route requires an authenticated user and ignores any browser-supplied recipient address.

Promotion creation queues email deliveries instead of sending to every user inside the request. Configure a scheduled job to `POST /api/promotions/email-queue` with `Authorization: Bearer $PROMOTION_EMAIL_CRON_SECRET`; use `?limit=50` or another value up to `200` to control each batch. Promotion emails include an unsubscribe link, and signed-in users can also opt out from Settings.

## Production Build

```bash
npm run lint
npm run build
```

## Deployment Checklist

- Supabase SQL schema applied
- Supabase Auth URL and redirect URLs configured
- Supabase email template updated for SSR confirm flow
- Stripe product and recurring price created
- Stripe restricted API key or server-side secret configured in Vercel only
- Stripe webhook endpoint created
- Stripe webhook signing secret configured and signature verification tested
- SMTP Private Email credentials configured
- Vercel environment variables added
- `NEXT_PUBLIC_SITE_URL` set to the production origin
- `npm run build` passes locally

## AI Layer

The app calls `/api/ai/workspace`, which uses the Anthropic Messages API with `ANTHROPIC_API_KEY`.
The key stays server-side. Captures fall back to deterministic local extraction if the key is missing or the model request fails.
# SpaxioNotes
