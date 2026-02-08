# ProSeek Client

React SPA that serves as the user-facing interface for ProSeek.

## Running

```bash
# Start Vite dev server
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

## Overview

```
src/
├── components/          → Page-level and feature components
├── shared-components/   → Reusable UI primitives (Button, TextInput, Modal, etc.)
├── contexts/            → React Context providers (session, modals)
├── hooks/               → Custom React hooks
├── widget/              → Standalone widget utilities (e.g. CAPTCHA)
├── api/                 → Fetch wrappers for server API calls
├── types/               → TypeScript type definitions
├── styles/              → Global styles
├── App.tsx              → Router and top-level layout
└── main.tsx             → Entry point
```

### Key areas

- **Components** — The main views: prayer chat, login, map (Google Maps), header, and modals (contact info, confirmation, chatroom verification). Each component uses co-located Less module files for styling.
- **Shared Components** — Generic UI building blocks: `Button`, `TextInput`, `CheckboxView`, `Callout`, `Link`, `ModalContainer`, `WithTooltip`. These are not tied to any specific feature.
- **Contexts** — `SessionContextProvider` manages auth state and session data. `ModalContextProvider` handles modal display via `ModalManager`.
- **API** — Thin fetch wrappers in `api/` that call the server's `/api` endpoints. Organized by resource (`users.ts`, `prayer_request_chats.ts`).
- **Routing** — Uses react-router-dom. Current routes: `/` (prayer chat), `/chats/:chatroomId` (specific chat), `/login`.

## Environment

Create a `client/.env` file:

```
GOOGLE_MAPS_API_KEY=your_key_here
```
