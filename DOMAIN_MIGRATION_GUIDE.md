# Domain Migration Guide: Undercut Academy to Overcut Academy

This step-by-step guide outlines the exact process to transition the application from `setups.undercutacademy.com` to `setups.overcutacademy.com`, specifically tailored for your tech stack: **Netlify (Frontend)**, **Render (Backend)**, **Supabase (Database)**, and **Resend (Email Sender)**.

## 1. External Services Configuration

### A. Netlify (Frontend)
1. **Log in to Netlify:** Go to your Netlify dashboard and select your frontend site for the Setup App.
2. **Domain Settings:** Navigate to **Site configuration** > **Domain management** > **Production domains**.
3. **Add the New Domain:** Click **Add a domain** and enter `setups.overcutacademy.com`.
4. **Update DNS:** Netlify will provide you with a CNAME record (usually pointing to `your-site-name.netlify.app`). 
5. **Domain Registrar:** Go to your domain registrar (where you bought `overcutacademy.com`), open the DNS settings, and add the CNAME record provided by Netlify for the `setups` subdomain.
6. **SSL/TLS:** Netlify should automatically provision a Let's Encrypt certificate once the DNS change propagates. Verify this in the Netlify domain settings under **HTTPS**.
7. **Environment Variables:** In Netlify, go to **Site configuration** > **Environment variables**. Ensure `NEXT_PUBLIC_API_URL` is correctly pointing to your Render backend URL (if it's using a custom domain, make sure you update that as well).

### B. Render (Backend)
1. **Log in to Render:** Go to your Render dashboard and select your backend Web Service.
2. **Environment Variables:** Navigate to the **Environment** tab.
3. **Update Manager Email:** Change the `MANAGER_EMAIL` environment variable from `undercutacademy@gmail.com` to your new email (e.g., `pslkartingdata@gmail.com`).
4. **Update CORS/Frontend URL:** If you have an environment variable defining allowed CORS origins or the frontend URL (e.g., `FRONTEND_URL`), update it to `https://setups.overcutacademy.com`.
5. **(Optional) Custom Domain:** If your Render backend uses a custom domain (e.g., `api.undercutacademy.com`), navigate to the **Settings** tab > **Custom Domains**, add the new domain (e.g., `api.overcutacademy.com`), update DNS accordingly, and update `NEXT_PUBLIC_API_URL` in Netlify.

### C. Resend (Email Sender)
1. **Log in to Resend:** Go to your Resend dashboard and navigate to **Domains**.
2. **Add the New Domain:** Click **Add Domain** and enter `overcutacademy.com`. Region: select appropriate region.
3. **DNS Records:** Resend will display several DNS records (TXT, MX, CNAME) for DKIM, SPF, and DMARC.
4. **Domain Registrar:** Go to your domain registrar's DNS settings and add all the exact records provided by Resend.
5. **Verify Domain:** Wait for the DNS to propagate (can take minutes to hours) and click **Verify Domain** in Resend. Once verified, you are authorized to send emails from `setup@overcutacademy.com`.

### D. Supabase (Database / Auth)
1. **Log in to Supabase:** Go to your project dashboard.
2. **Authentication URLs:** Navigate to **Authentication** > **URL Configuration**.
3. **Update Site URL:** Change the **Site URL** from `https://setups.undercutacademy.com` to `https://setups.overcutacademy.com`.
4. **Redirect URLs:** Under **Additional Redirect URLs**, add `https://setups.overcutacademy.com/*` (and remove the old one if no longer needed).
5. **Database Connection:** Your `DATABASE_URL` and `DIRECT_URL` in Render do not need to change, as they connect directly to the Supabase pooler regardless of your frontend domain.

---

## 2. Backend Code Alterations

### `backend/src/services/emailService.ts`
1. **Sender Email:** Locate the `from` email address in both `sendManagerNotificationEmail` and `sendManagerNotificationEmailBatch` functions. Change it from `setup@undercutacademy.com` to `setup@overcutacademy.com`.
2. **Dashboard Link:** In the HTML templates for both single and batch emails, there is a hardcoded "View in Dashboard" button that links to `https://setups.undercutacademy.com/...`. Update this URL to `https://setups.overcutacademy.com/...`.

### `backend/.env` (Local Development)
1. **Manager Email:** Update `MANAGER_EMAIL=undercutacademy@gmail.com` to your new manager email (e.g., `pslkartingdata@gmail.com`).

---

## 3. Frontend Code Alterations

### `frontend/app/layout.tsx`
1. **Metadata Base URL:** Update the `metadataBase` variable from `new URL('https://setups.undercutacademy.com')` to `new URL('https://setups.overcutacademy.com')`. This fixes your OpenGraph and SEO tags.
2. **Title:** Consider updating the `title` variable inside the `metadata` object from `"Setups - Undercut"` to `"Setups - Overcut"`.

### Hardcoded Text and URLs in Pages
Search for instances of "undercutacademy" (or "Undercut") inside text or links and update them to "overcutacademy" (or "Overcut") in the following files:
* `frontend/app/[teamSlug]/form/page.tsx`
* `frontend/app/[teamSlug]/form/success/page.tsx`
* `frontend/app/[teamSlug]/page.tsx`
* `frontend/app/[teamSlug]/manager/login/page.tsx`
* `frontend/app/[teamSlug]/manager/dashboard/page.tsx`

---

## 4. Final Deployment and Testing
1. **Commit and Push:** Commit your code changes and push to your repository (GitHub/GitLab).
2. **Auto-Deploy:** Render and Netlify should automatically trigger a build and deploy with your new code.
3. **Test the Application:**
   * Open `https://setups.overcutacademy.com`.
   * Test form submission.
   * Verify an email is sent to the new `MANAGER_EMAIL` coming from `setup@overcutacademy.com`.
   * Check if the links inside the email go back to the correct `overcutacademy.com` dashboard.
