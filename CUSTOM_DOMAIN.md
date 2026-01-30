# Add Custom Domain to Cloudflare Pages

Use **cyber-sec.evokeai.info** for your frontend (Pages) with domain **evokeai.info**.

---

## Step 1: Open your Pages project in Cloudflare

1. Go to **[dash.cloudflare.com](https://dash.cloudflare.com)** and log in.
2. Left sidebar → **Workers & Pages**.
3. Click your **frontend** Pages project (e.g. `cybersec-frontend` or `mocha-app`).

---

## Step 2: Add the custom domain

1. In the project, go to **Custom domains** (or **Settings** → **Custom domains**).
2. Click **Set up a custom domain** (or **Add custom domain**).
3. Enter: **`cyber-sec.evokeai.info`**
4. Click **Continue** (or **Add domain**).

---

## Step 3: DNS (choose one case)

### Case A: evokeai.info is already on Cloudflare

- Cloudflare will add a **CNAME** for `cyber-sec.evokeai.info` pointing to your Pages URL (e.g. `cybersec-frontend.pages.dev`).
- If it says “We’ve added the DNS record for you,” you’re done. Wait a few minutes for DNS to propagate.
- If it asks you to add a record manually:
  - Go to **Websites** → **evokeai.info** → **DNS** → **Records**.
  - Add:
    - **Type:** CNAME  
    - **Name:** `cyber-sec`  
    - **Target:** `cybersec-frontend.pages.dev` (or the exact value Cloudflare shows).  
    - **Proxy status:** Proxied (orange cloud) is fine.

### Case B: evokeai.info is NOT on Cloudflare

**Option 1 – Move DNS to Cloudflare (recommended)**

1. In Cloudflare Dashboard: **Websites** → **Add a site**.
2. Enter **evokeai.info** and follow the steps (add nameservers at your registrar).
3. After the zone is active, go back to your **Pages** project → **Custom domains** and add **cyber-sec.evokeai.info** again; Cloudflare can then add the CNAME for you.

**Option 2 – Keep DNS at current provider**

1. In the Pages **Custom domains** screen, Cloudflare will show the target (e.g. `cybersec-frontend.pages.dev`).
2. At your DNS provider (where evokeai.info is managed), add:
   - **Type:** CNAME  
   - **Name/Host:** `cyber-sec` (or `cyber-sec.evokeai.info` if it asks for full name).  
   - **Target/Value:** the exact URL Cloudflare gave you (e.g. `cybersec-frontend.pages.dev`).
3. Save, then in Cloudflare click **Verify** (or **Continue**) for **cyber-sec.evokeai.info**.

---

## Step 4: SSL (HTTPS)

- For domains on Cloudflare, SSL is usually **Full** or **Full (strict)** and is automatic.
- For external DNS, Cloudflare may show a status like “Pending” until the CNAME is visible; after that, SSL is issued automatically.

---

## Step 5: Use the custom domain in the app (optional)

If your app or API client needs to know the current host:

- **Frontend:** The site will be served at **https://cyber-sec.evokeai.info**; no code change needed unless you hardcode the old Pages URL somewhere.
- **Backend / CORS:** If your Worker checks `Origin`, add **https://cyber-sec.evokeai.info** to the allowed origins.

---

## Summary

| Item        | Value                    |
|------------|---------------------------|
| Custom domain | **cyber-sec.evokeai.info** |
| Root domain   | **evokeai.info**          |
| Where to set  | Cloudflare Pages → Custom domains |
| DNS record    | CNAME `cyber-sec` → `your-project.pages.dev` |

After DNS propagates (often 5–15 minutes), **https://cyber-sec.evokeai.info** will open your frontend.
