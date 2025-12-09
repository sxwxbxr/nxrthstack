# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (eslint-config-next with core-web-vitals and typescript)
```

## Architecture

This is a Next.js 16 application using the App Router with React 19 and Tailwind CSS 4.

### Project Structure

- `app/` - Next.js App Router pages and layouts
- `lib/utils.ts` - Utility functions (contains `cn()` for className merging with clsx + tailwind-merge)

### Styling System

- **Tailwind CSS 4** with PostCSS integration via `@tailwindcss/postcss`
- **tw-animate-css** for animations
- CSS variables defined in `app/globals.css` for theming (light/dark mode)
- Dark mode activated via `.dark` class on parent element
- Design tokens use OKLCH color space

### Key Conventions

- Path alias: `@/*` maps to project root
- Use `cn()` from `lib/utils.ts` for conditional class names
- Component styling uses class-variance-authority (CVA) for variant patterns
