# Reviva Skin & Surgery — Next.js + Sanity

The revivaskinandsurgery.com site, moved from static HTML/PHP to **Next.js** with
**Sanity** as the CMS. The design is unchanged: same CSS, JS, images and markup,
and the same URLs (`/acne-treatment.html`, `/blog/….html`). All 158 pages were
checked against the old site and render identically.

## How it fits together

| Part | Where |
|---|---|
| Pages (all 158, incl. 84 blog posts) | Sanity → **Pages** / **Blog posts**, rendered by `app/[[...path]]` |
| Header + footer (menu, phones, addresses, hours, links) | Sanity → **Site Settings**, `components/Header.tsx`, `components/Footer.tsx` |
| CSS / JS / images | `public/assets` (unchanged from the old site) |
| Landing pages | `public/lp/*` → `/lp/skin-clinic-in-noida`, `/lp/skin-care-clinic-in-noida` |
| 170 old-URL 301 redirects | `content/redirects.json` (from the old `.htaccess`) |
| Contact form endpoint | `app/contact-process.php/route.ts` → saves **Enquiries** in Sanity |
| CMS (replaces `/admin`) | `/studio` |

Until Sanity is configured the site serves the snapshot in `content/pages`, so it
works on Vercel straight away.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000, Studio at /studio
```

## Connect Sanity (one-time)

1. `npx sanity login`, then `npx sanity init --env .env.local` (choose "Create new project",
   dataset `production`), or create a project at sanity.io/manage and copy `.env.example`
   to `.env.local` and fill it in.
2. In sanity.io/manage → **API**:
   - **CORS origins**: add `http://localhost:3000` and your live domain (allow credentials).
   - **Tokens**: create an *Editor* token → `SANITY_API_WRITE_TOKEN`.
3. Load the site into Sanity: `npm run sanity:import`
4. **Webhook** (instant updates on publish): URL `https://<domain>/api/revalidate`,
   trigger on create/update/delete, secret = `SANITY_REVALIDATE_SECRET`.

## Deploy (GitHub → Vercel)

1. Push this folder to a GitHub repo.
2. vercel.com → **Add New Project** → import the repo (framework: Next.js, defaults are fine).
3. Add the variables from `.env.example` under **Settings → Environment Variables**.
4. Every push to `main` deploys automatically.

## Editing content

- **Text, images, links on a page:** Studio → Pages / Blog posts → open the page → *Page content (HTML)*.
- **Title / description:** same document, *SEO* tab.
- **Menu, phone numbers, addresses, footer links:** Studio → Site Settings.
- **New page:** create a Page, set the URL path (e.g. `/new-treatment.html`), paste HTML using the site's existing classes.
- **Images:** add files under `public/assets/images` and reference them as `/assets/images/<file>`.

## Before go-live

- `public/robots.txt` currently blocks all crawlers (`Disallow: /`), as on the old
  staging copy. Change it to allow indexing when switching the domain over.
- The contact form's submit is still intercepted by `custom.js` (it only shows an alert —
  pre-existing behaviour). Remove that handler to start receiving enquiries in Sanity.
