<br/><div align="center">
# 💻 MYLIFE — Frontend Health Vault Portal

**Vite + React 19 + Tailwind CSS 4 + Motion — glassmorphic patient portal**

[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Motion](https://img.shields.io/badge/Animation-Motion-FF0055?logo=framer&logoColor=white)](https://motion.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **The user-facing portal of MYLIFE.** Patients, doctors, family caregivers, and admins interact with the platform through a responsive, glassmorphic health vault — clinical records, family linking, emergency profiles, appointments, women's health tracking, and AI-assisted document upload.

</div>

---

This repository contains **only the frontend**. The FastAPI microservices, NGINX gateway, and Docker Compose stack live in a separate backend repo.

| Document | Location |
|----------|----------|
| System architecture | [MyLife-HealthCare-Backend/architecture.md](https://github.com/Zeero-G/MyLife-HealthCare-Backend/blob/main/architecture.md) |
| API reference | [MyLife-HealthCare-Backend/API_DOCUMENTATION.md](https://github.com/Zeero-G/MyLife-HealthCare-Backend/blob/main/API_DOCUMENTATION.md) |
| Implementation notes | [walkthrough.md](./walkthrough.md) (local dev changelog) |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Build | [Vite 6](https://vitejs.dev/) |
| UI | [React 19](https://react.dev/), [Lucide React](https://lucide.dev/) icons |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) (`@tailwindcss/vite`) |
| Animation | [Motion](https://motion.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Language | TypeScript 5.8 |
| API transport | `fetch` via centralized client (`src/api.ts`) |
| Auth state | React Context (`src/AuthContext.tsx`) + `localStorage` JWT |

---

## How it connects to the backend

In development, Vite proxies API paths to the NGINX gateway on **port 80**. Leave `VITE_API_BASE_URL` empty so requests stay same-origin and hit the proxy.

```text
Browser (localhost:3000)
    → Vite dev proxy (/auth, /records, …)
    → NGINX gateway (localhost:80)
    → FastAPI microservices (8001–8005)
```

Proxied prefixes (see `vite.config.ts`):

| Prefix | Backend service (via gateway) |
|--------|-------------------------------|
| `/auth` | auth-service |
| `/records`, `/emergency`, `/appointments` | medical-records-service |
| `/family`, `/health/cycle`, `/health/pregnancy` | family-profile-service |
| `/ai` | ai-processing-service |
| `/notify` | notification-service |

For production or preview against a remote gateway, set `VITE_API_BASE_URL` to the gateway origin (e.g. `https://api.example.com`).

---

## Key features

- **Liquid crystal UI** — Frosted panels, teal/blue gradients, and Motion micro-interactions in `src/index.css`.
- **Role-based dashboards** — After login, routing in `DashboardView.tsx` by `user.role`:
  - **patient** — overview, records, upload, family, emergency, appointments, women's health (female patients), account
  - **doctor** — patient list, record verification, appointments queue
  - **family_member** — linked patient records (read-oriented family dashboard)
  - **admin** — administrative overview panel
- **Central API client** — `src/api.ts` groups calls (`authAPI`, `recordsAPI`, `familyAPI`, `emergencyAPI`, `appointmentsAPI`, `healthAPI`, `aiAPI`) with JWT injection and automatic refresh on `401`.
- **Health vault** — List/create/update/delete records, QR share links, multipart upload to `/records/upload`.
- **Emergency profile** — View and upsert vitals/allergies for responder scenarios.
- **Family linking** — Search by user UUID, link/unlink with relationship labels.
- **Appointments** — Patients book; doctors manage queue; status updates via REST.
- **Women's health** — Menstrual cycle and pregnancy logging (`/health/cycle`, `/health/pregnancy`).
- **AI portal** — Upload documents; poll `/ai/results/{docId}` and summaries.

---

## Related repositories

| Repository | Purpose |
|------------|---------|
| [Zeero-G/MyLife-HealthCare-Backend](https://github.com/Zeero-G/MyLife-HealthCare-Backend) | FastAPI services, NGINX gateway, Docker Compose, Supabase schema |
| **This repo** | Vite React SPA only |

Clone both side by side for full-stack local work:

```bash
git clone https://github.com/Zeero-G/MyLife-HealthCare-Backend.git
git clone https://github.com/Zeero-G/MyLife-HealthCare-Frontend.git
```

> **Note:** The local folder may be spelled `MyLife-HealthCare-Fronend`; the GitHub remote uses `MyLife-HealthCare-Frontend`.

---

## Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm
- Backend stack running (Docker recommended) — see backend README

---

## Environment setup

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Gateway origin for production builds. **Leave empty in local dev** to use the Vite proxy. |

Optional: copy to `.env.local` instead of `.env` if you prefer Vite's local override convention.

---

## Local development

1. **Start the backend** (from the backend repo):

   ```bash
   cd MyLife-HealthCare-Backend
   docker compose up --build -d
   docker compose ps
   ```

   Confirm the gateway responds: `curl -s http://localhost/health`

2. **Install and run the frontend** (this repo):

   ```bash
   cd MyLife-HealthCare-Fronend   # or your clone directory name
   npm install
   npm run dev
   ```

3. Open **[http://localhost:3000](http://localhost:3000)**.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 (`--host 0.0.0.0`) |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Typecheck only (`tsc --noEmit`) |

### Disable HMR

If hot reload causes issues in certain environments:

```bash
DISABLE_HMR=true npm run dev
```

---

## Production build

```bash
# Point at your deployed API gateway
echo 'VITE_API_BASE_URL=https://your-gateway.example.com' > .env
npm run build
npm run preview   # optional smoke test
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, S3 + CDN, etc.). Configure the host to serve `index.html` for client-side routes.

---

## Security notes

- JWT access and refresh tokens are stored in **`localStorage`** — acceptable for MVP; consider `httpOnly` cookies or secure storage for hardened deployments.
- Never commit `.env` with production gateway URLs or secrets (this app only uses `VITE_*` public vars).
- All authenticated calls send `Authorization: Bearer <access_token>`; refresh uses `POST /auth/refresh`.
- Emergency profile **read** by user ID can be called without auth (responder flow); writes require a valid session.
- CORS is handled by the backend gateway in development; production gateways should restrict origins appropriately.

---

## Project structure

```text
MyLife-HealthCare-Fronend/
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx      # Shell: tabs, role routing, mobile nav
│   │   ├── PatientDashboard.tsx   # Patient overview widgets
│   │   ├── DoctorDashboard.tsx    # Doctor workspace
│   │   ├── FamilyDashboard.tsx    # Family caregiver view
│   │   ├── AdminDashboard.tsx     # Admin panel
│   │   ├── RecordsView.tsx        # CRUD + share QR
│   │   ├── UploadView.tsx         # Document upload → AI pipeline
│   │   ├── EmergencyView.tsx      # Emergency profile editor
│   │   ├── AppointmentView.tsx    # Booking & doctor queue
│   │   ├── WomensHealthView.tsx   # Cycle & pregnancy tracking
│   │   └── AccountView.tsx        # Profile settings
│   ├── App.tsx                    # Landing, auth forms, view routing
│   ├── AuthContext.tsx            # Session provider
│   ├── api.ts                     # HTTP client + token refresh
│   ├── types.ts                   # Shared TypeScript models
│   ├── main.tsx                   # React root + AuthProvider
│   └── index.css                  # Liquid crystal theme tokens
├── index.html
├── vite.config.ts                 # Aliases + dev proxy → :80
├── tsconfig.json
├── package.json
├── .env.example
├── walkthrough.md                 # Feature/integration changelog
└── README.md
```

Utility scripts at repo root (`update_records.py`, `patch_family.py`, etc.) are one-off dev helpers — not part of the runtime app.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Login/network errors | Backend up? `curl http://localhost/health` and `docker compose logs gateway` |
| 404 on API calls | Gateway running on port 80; proxy paths match `vite.config.ts` |
| CORS in production | Set `VITE_API_BASE_URL` to the real gateway; do not mix empty base URL with a remote API |
| Stale session | Clear `localStorage` keys `mylife_access_token`, `mylife_refresh_token`, `mylife_view`, `mylife_tab` |

---

## Roadmap

- [ ] ESLint + Prettier aligned with team standards (lint script is typecheck-only today)
- [ ] Environment-specific config (staging vs production gateways)
- [ ] Push notification UI wired to `/notify` (backend FCM ready)
- [ ] Offline / PWA shell for emergency profile read path
- [ ] E2E tests (Playwright) against dockerized backend
- [ ] Accessibility audit (WCAG) on dashboard flows

---

## Contributing

Backend changes belong in **MyLife-HealthCare-Backend**. For UI bugs or features, open issues/PRs in this repository. Match existing patterns: API calls in `api.ts`, types in `types.ts`, role-specific UI in `components/`.

## License

Licensed under the MIT License.
