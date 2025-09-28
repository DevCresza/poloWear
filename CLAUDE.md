# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a B2B e-commerce platform called "POLO B2B" built with Vite + React that connects multiple stakeholders in a fashion/clothing business:
- **Multimarca clients** (wholesale buyers)
- **Fornecedores** (suppliers/manufacturers)
- **Admins** (platform administrators)

The app uses mock API implementations for backend services and authentication.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture & Structure

### Core Technologies
- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM v7
- **UI Components**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS with custom neumorphic design system
- **Forms**: React Hook Form + Zod validation
- **Backend**: Mock API implementation

### Key Directories
- `/src/pages/` - Main page components and routing logic
- `/src/components/ui/` - Reusable shadcn/ui components
- `/src/components/admin/` - Admin-specific components
- `/src/components/crm/` - CRM-related components
- `/src/components/pedidos/` - Order management components
- `/src/api/` - Mock API client configuration and integrations
- `/src/lib/` - Utility functions
- `/src/hooks/` - Custom React hooks

### Page Structure & Routing
The app uses a custom page routing system via `/src/pages/index.jsx`:
- Pages are defined in the `PAGES` object and auto-mapped to routes
- All portal pages require authentication and use the Layout component
- Public pages (like Home) render without the sidebar layout
- Current page detection is URL-based via `_getCurrentPage()` function

### Authentication & User Roles
- Authentication handled by mock implementation
- Three user types: `admin`, `fornecedor` (supplier), `multimarca` (client)
- Layout component (`/src/pages/Layout.jsx`) shows different navigation based on user role:
  - **Admin**: Full access to all sections (user management, CRM, products, orders)
  - **Fornecedor**: Product management, inventory, orders, capsules
  - **Multimarca**: Catalog browsing, cart, order history

### Mock API Integration
- Mock client configured in `/src/api/base44Client.js` with demo data
- Entity interfaces and authentication methods in `/src/api/entities.js`
- Mock API functions and integrations in `/src/api/functions.js` and `/src/api/integrations.js`

### UI Design System
- Uses custom neumorphic design with Tailwind CSS
- Shadow utilities: `shadow-neumorphic`, `shadow-neumorphic-inset`, `shadow-neumorphic-button`
- Color scheme: Slate/gray based with blue accents
- Component aliases configured via `components.json` (shadcn/ui setup)

### Component Patterns
- UI components follow shadcn/ui conventions in `/src/components/ui/`
- Business components organized by domain (admin, crm, pedidos)
- Forms use React Hook Form + Zod validation pattern
- Modals and dialogs use Radix UI primitives
- Icons from Lucide React

## Important Notes

- The app uses file extensions `.jsx` for React components (not `.tsx` - no TypeScript)
- Path aliases configured: `@/` points to `/src/`
- All authenticated pages use mock authentication
- Role-based access control implemented in Layout navigation
- Custom routing system - add new pages to `PAGES` object in `/src/pages/index.jsx`