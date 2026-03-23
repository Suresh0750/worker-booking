# WorkerHub — Client Frontend

Next.js 14 · TypeScript · Tailwind CSS · Zod · React Hook Form

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL to point at your API gateway

# 3. Run dev server
npm run dev
# → http://localhost:3001
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        ← Landing page
│   ├── layout.tsx                      ← Root layout (fonts, providers)
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx              ← Login with validation
│   │   └── register/page.tsx           ← Multi-step registration
│   ├── client/
│   │   ├── search/page.tsx             ← Worker search + filters
│   │   ├── worker/[id]/page.tsx        ← Worker profile view
│   │   ├── book/[workerId]/page.tsx    ← Booking form
│   │   └── bookings/page.tsx           ← Client booking history
│   └── worker/
│       ├── dashboard/page.tsx          ← Earnings + draggable requests
│       ├── slots/page.tsx              ← Slot mgmt OR job requests
│       ├── photos/page.tsx             ← Photo upload
│       └── profile/page.tsx            ← Profile edit
├── components/
│   ├── ui/
│   │   ├── Input.tsx                   ← Input with error state
│   │   ├── Button.tsx                  ← Button variants
│   │   ├── FormFields.tsx              ← Select + Textarea
│   │   └── LocationPicker.tsx          ← Geolocation + OSM search
│   ├── worker/
│   │   └── WorkerCard.tsx              ← Search result card
│   └── layout/
│       └── Navbar.tsx                  ← Responsive nav
├── hooks/                              ← Add custom hooks here
├── lib/
│   ├── api.ts                          ← Axios client + token refresh
│   ├── auth-context.tsx                ← React auth context
│   ├── utils.ts                        ← Helpers, constants
│   └── validations.ts                  ← All Zod schemas
└── types/
    └── index.ts                        ← Domain types
```

---

## Booking Type Logic

| Worker type          | Slot strategy    | What they see in /worker/slots       |
|----------------------|------------------|--------------------------------------|
| Barber, Cleaner      | SLOT_BASED       | Create time slots, clients book them |
| Carpenter, Plumber   | REQUEST_BASED    | Incoming job requests to accept/decline |
| Multi-skill          | HYBRID           | Set availability windows             |

The `/worker/slots` page auto-detects the worker's `slotType` from their profile and renders the appropriate UI — no extra routing needed.

---

## Forms & Validation

All forms use **React Hook Form** + **Zod** with real-time validation:

| Page              | Schema               | Key validations                                      |
|-------------------|----------------------|------------------------------------------------------|
| Login             | `loginSchema`        | Email format, password required                      |
| Register          | `registerSchema`     | Step-aware: worker fields only required if role=WORKER |
| Booking           | `bookingSchema`      | Job description min length, location required        |
| Slot creation     | `slotSchema`         | Future times, end after start                        |
| Profile edit      | `profileEditSchema`  | Rate positive, bio max length                        |

---

## API Routes Expected

The client expects your API gateway to expose:

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh

GET    /workers/search?query=&profession=&city=&minRating=&maxRate=&available=
GET    /workers/:id
GET    /workers/:id/slots

POST   /bookings
GET    /client/bookings
POST   /client/bookings/:id/cancel

GET    /worker/profile
PUT    /worker/profile
GET    /worker/dashboard
GET    /worker/bookings?status=
POST   /worker/bookings/:id/confirm
POST   /worker/bookings/:id/cancel
GET    /worker/slots
POST   /worker/slots
DELETE /worker/slots/:id
GET    /worker/job-requests
POST   /worker/job-requests/:id/accept
POST   /worker/job-requests/:id/decline
POST   /worker/photos        (multipart/form-data)
DELETE /worker/photos        (body: { url })
```

---

## Key Dependencies

| Package              | Purpose                                |
|----------------------|----------------------------------------|
| `next` 14            | App router, SSR, image optimization    |
| `react-hook-form`    | Form state management                  |
| `zod`                | Schema validation                      |
| `@hookform/resolvers`| Connect zod to react-hook-form         |
| `axios`              | HTTP client with interceptors          |
| `swr`                | Data fetching / cache (add as needed)  |
| `recharts`           | Earnings chart on dashboard            |
| `react-hot-toast`    | Toast notifications                    |
| `lucide-react`       | Icon library                           |
| `clsx` + `tailwind-merge` | Conditional class names           |

---

## Auth Flow

1. Register → auto-login → redirect to dashboard/search
2. Access token stored in `localStorage` → attached to every request via Axios interceptor
3. On 401 → auto-refresh using refresh token → retry original request
4. Refresh fails → clear tokens → redirect to `/auth/login`
