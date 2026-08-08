This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## GitHub sign-in

"Connect GitHub" needs an OAuth App's Client ID/Secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (`.env.local`). GitHub only lets you create these through the web UI — there's no API for it:

1. Open [github.com/settings/applications/new](https://github.com/settings/applications/new?name=ArcFi&url=http%3A%2F%2Flocalhost%3A3000&callback_url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgithub) (pre-filled with the values below).
2. Confirm: **Homepage URL** `http://localhost:3000`, **Authorization callback URL** `http://localhost:3000/api/auth/callback/github`.
3. Click **Register application**.
4. Copy the **Client ID**, then click **Generate a new client secret** and copy that too (shown once).
5. Paste both into `frontend/.env.local` as `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`, then restart `npm run dev`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
