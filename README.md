# Spannr Drop-Off Prototype 02 — Admin Portal and Booking Site MVP

This is a [Next.js](https://nextjs.org/) project bootstrapped with TypeScript and Tailwind CSS.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Next.js App Router routes
- `/components` - Reusable UI components
- `/lib` - Helper functions and utilities (e.g., db.ts for Supabase)
- `/types` - Shared TypeScript types
- `/docs` - Project documentation and notes

## Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials and Resend configuration:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_from_email_address
```

**Note:** For production (Netlify), you'll need to add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to your Netlify environment variables as well.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

