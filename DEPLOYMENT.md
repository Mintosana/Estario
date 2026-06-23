# Estario Deployment

Recommended split:

- Frontend: Vercel, using `client/` as the project root.
- Backend and PostgreSQL: Render, using the root `render.yaml` Blueprint.

## 1. Push The Branch

`render.yaml` currently deploys from `stripe-payment-implementation`, which is the active local branch.

```bash
git add render.yaml DEPLOYMENT.md client/.env.example server/.env.example client/package.json server/package.json server/src
git commit -m "Add deployment configuration"
git push origin stripe-payment-implementation
```

If you want to deploy from `main`, merge this branch into `main` and change `branch` in `render.yaml` to `main`.

## 2. Deploy Backend On Render

Open:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/Mintosana/Estario
```

Render will create:

- `estario-api`, an Express web service.
- `estario-postgres`, a PostgreSQL database.

Fill this required Blueprint secret:

```text
CLIENT_URL=https://YOUR_VERCEL_DOMAIN.vercel.app
```

You can set it temporarily to the expected Vercel domain, then update it after the Vercel deploy.

Optional backend env vars:

```text
CLIENT_URLS=https://YOUR_CUSTOM_DOMAIN.com,https://YOUR_PREVIEW_DOMAIN.vercel.app
OPENAI_API_KEY=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=ron
```

## 3. Deploy Frontend On Vercel

Create a Vercel project from the same GitHub repo and set:

```text
Root Directory: client
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Set this Vercel environment variable:

```text
VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
```

The `client/vercel.json` rewrite handles React Router deep links.

## 4. Finish CORS

After Vercel gives you the final frontend URL, update Render:

```text
CLIENT_URL=https://YOUR_FINAL_VERCEL_URL
```

If you use multiple Vercel preview/custom domains, add them as a comma-separated `CLIENT_URLS` value.

## Upload Storage Note

The default Render Blueprint uses `plan: free`, so uploaded images use the service filesystem and may be lost across deploys/restarts. For real production uploads, upgrade the API service and add a Render disk mounted at:

```text
/opt/render/project/src/server/uploads
```

The code already supports this path through `UPLOAD_DIR`.
