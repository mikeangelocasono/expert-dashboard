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

## Supabase Setup

### 1. Database Setup
Follow the instructions in `SUPABASE_SETUP.md` to set up your Supabase project.

### 2. Enable Realtime (Required for Real-time Features)
To enable real-time data updates, you must enable Realtime on your Supabase tables:

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Run the following SQL commands:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE scans;
ALTER PUBLICATION supabase_realtime ADD TABLE validation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

This will enable Realtime subscriptions on:
- `scans` table
- `validation_history` table
- `profiles` table

**Note:** Without enabling Realtime, you may see errors like "Error subscribing to real-time data changes" in the console. The app will still work but will fall back to periodic data refreshes instead of real-time updates.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
