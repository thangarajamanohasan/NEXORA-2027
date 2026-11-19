# NEXORA 2027 Starter

## Install
```bash
npm install
copy .env.example .env.local
npm run dev
```
PowerShell alternative: `Copy-Item .env.example .env.local`

## Supabase
1. Create a new project at https://supabase.com/dashboard.
2. Open SQL Editor → New query.
3. Run all of `supabase/nexora_setup.sql`.
4. Copy Project URL and Publishable key from Project Settings → API Keys / Connect.
5. Add them to `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
VITE_APP_URL=http://localhost:5173
```
Never use the service_role or secret key in frontend code or any `VITE_` variable.

## Auth URLs
Supabase → Authentication → URL Configuration:
- Site URL: `http://localhost:5173`
- Redirect URL: `http://localhost:5173/**`
For production add your Vercel URL and `https://YOUR-DOMAIN/**`, then set Site URL to the deployed site.
If email confirmation is enabled, students confirm email and sign in; the app then shows a completion form to enter DOB, NIC, address and contact numbers before the seat is allocated. For local-only testing you may temporarily disable confirmation in a test project; keep it enabled in production with working email delivery.

## Create the first admin
1. Register an account through the student form and confirm its email.
2. Run this in Supabase SQL Editor (replace email):
```sql
update public.profiles p set role='admin'
from auth.users u where p.id=u.id and lower(u.email)=lower('ADMIN_EMAIL@example.com');
```
3. Sign out and sign in again. Admin role is read from the database; there is no public admin registration option.

## Deploy
Push the project to a new GitHub repository. Import it in Vercel; framework Vite, build `npm run build`, output `dist`. Add the three VITE_ environment variables in Vercel settings, deploy, then add the Vercel URL to Supabase Auth URL Configuration.
Alternatively:
```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

## Important behaviour
- Permanent student IDs: NXR2027-000001, NXR2027-000002, etc. They never decrease or get reused.
- Exactly 250 seat records exist. A database row lock allocates a distinct seat even under simultaneous requests.
- Cancelling a registration releases its seat, but its student ID is never recycled.
- QR verification reveals only name, student ID, seat and status; it never reveals NIC, address or phone numbers.
- RLS prevents students from reading other students' records. Admin role is assigned only by trusted SQL/dashboard action.
- Before public launch, test email confirmation, concurrent last-seat bookings, cancellation, RLS access, and database backup. Add a privacy notice and retention policy for NIC/contact data.
