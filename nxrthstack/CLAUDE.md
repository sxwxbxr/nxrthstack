# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint (eslint-config-next with core-web-vitals and typescript)
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run Drizzle migrations
npm run db:push      # Push schema to database (dev only)
npm run db:studio    # Open Drizzle Studio
```

## Architecture

This is a Next.js 16 application using the App Router with React 19 and Tailwind CSS 4.

### Project Structure

```
app/
├── (marketing)/     # Public homepage
├── (shop)/          # Shop pages (/shop, /shop/[slug])
├── (auth)/          # Auth pages (/login, /register)
├── (dashboard)/     # Customer dashboard (protected)
├── (admin)/         # Admin panel (admin role required)
└── api/             # API routes

components/
├── ui/              # Reusable UI components (FadeIn, ShimmerButton, etc.)
├── shop/            # Shop components (ProductCard, PricingTable)
├── dashboard/       # Dashboard components
├── admin/           # Admin components
└── auth/            # Auth components

lib/
├── db/              # Drizzle ORM (schema.ts, index.ts)
├── auth.ts          # NextAuth.js configuration
├── stripe.ts        # Stripe client
├── license.ts       # License generation (user-provided logic)
└── utils.ts         # Utility functions (cn())
```

### Database

- **Drizzle ORM** with Neon PostgreSQL
- Schema in `lib/db/schema.ts`
- Tables: users, products, productPrices, productFiles, productImages, purchases, subscriptions

### Authentication

- **NextAuth.js v5** with credentials provider
- Protected routes via `middleware.ts`
- Roles: `customer` (default), `admin`

### Payments

- **Stripe** for checkout and subscriptions
- Webhook handler at `/api/stripe/webhook`
- Customer portal for subscription management

### Styling System

- **Tailwind CSS 4** with PostCSS integration via `@tailwindcss/postcss`
- **Motion (Framer Motion)** for animations
- CSS variables defined in `app/globals.css` for theming (light/dark mode)
- Dark mode activated via `.dark` class on parent element
- Design tokens use OKLCH color space

### Key Conventions

- Path alias: `@/*` maps to project root
- Use `cn()` from `lib/utils.ts` for conditional class names
- Component styling uses class-variance-authority (CVA) for variant patterns
- All shop/dashboard/admin pages use dark mode by default
- Icons exported from `components/icons.tsx`

## Environment Variables

```env
DATABASE_URL=           # Neon PostgreSQL connection string
NEXTAUTH_SECRET=        # NextAuth secret (generate with openssl rand -base64 32)
NEXTAUTH_URL=           # App URL (http://localhost:3000 for dev)
STRIPE_SECRET_KEY=      # Stripe secret key (sk_...)
STRIPE_PUBLISHABLE_KEY= # Stripe publishable key (pk_...)
STRIPE_WEBHOOK_SECRET=  # Stripe webhook secret (whsec_...)
NAS_STORAGE_URL=        # NAS storage URL (https://clips.sweber.dev)
NAS_API_KEY=            # NAS storage API key
```
