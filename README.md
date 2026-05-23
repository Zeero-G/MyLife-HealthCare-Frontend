<br/><div align="center">
# 💻 MYLIFE — Frontend Health Vault Portal

**Vite + React + TailwindCSS + Motion powered glassmorphic dashboard & landing interface**

[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Motion](https://img.shields.io/badge/Animation-Motion-FF0055?logo=framer&logoColor=white)](https://motion.dev/)

> **The user-facing portal of MYLIFE.** Designed with a custom "liquid crystal" design language, it provides patients with a responsive, glassmorphic health vault to manage their clinical histories, link family members, configure emergency profiles, and share record-access keys securely on their own terms.

<img src="logos/logo.png" alt="MYLIFE Logo" width="200" style="display:none;" />

</div>

---

See [architecture.md](../MyLife-HealthCare/architecture.md) in the backend repository for the full system architecture specifications, encompassing the FastAPI microservices layout and the unified NGINX gateway.

---

## ✨ Key Features

- **Liquid Crystal Aesthetics:** Implements a premium, glassy theme utilizing harmonized blue/teal HSL gradients, frosted backdrops, subtle sheens, and smooth hover/active micro-animations via pure Tailwind CSS.
- **Microservices API Client:** Features a centralized and type-safe api layer (`src/api.ts`) interfacing with all five FastAPI backend services (`auth`, `records`, `family`, `ai`, and `notifications`) routed through a unified endpoint.
- **JWT Authorization with Auto-Refresh:** Integrated with React Context (`src/AuthContext.tsx`). The API client handles JWT inclusion, automatically captures `401 Unauthorized` responses, invokes the token refresh API, updates storage, and transparently retries failed requests.
- **Secure Health Vault Dashboard:** Complete patient-centric workspace:
  - **Overview:** Summarizes latest medical entries, caregiver statuses, and recent updates.
  - **My Records:** Lists health reports and scans. Patients can securely request unique, temporary QR-coded share links (`POST /records/share-qr`).
  - **AI Processing Portal:** Streamlined drag-and-drop document upload sending raw files (Images/PDFs) to the backend for automated extraction and NLP categorization.
  - **Family Linkings:** Direct search-and-link mechanism to associate guardian/dependent accounts using secure UUID handles.
  - **Emergency Smart Bypass:** Read-only summary panel demonstrating how authorized responders (such as 1990 Suwa Seriya ambulance staff) view vital allergies, blood groups, and chronic conditions.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js (version 18+)](https://nodejs.org/) and `npm` installed on your machine.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd MyLife-Frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *In development, `VITE_API_BASE_URL` can remain empty to utilize the dev server proxy.*

---

## 🛠️ Development & Running Locally

Vite is configured with a development proxy that forwards all backend service calls (e.g. `/auth`, `/records`, `/family`) to the NGINX gateway running on port 80.

To start the development server:
```bash
npm run dev
```
The application will run on [http://localhost:3000](http://localhost:3000).

*Note: Ensure the backend services are running in docker (`docker-compose up`) to enable successful login, registration, and record manipulation.*

To verify type safety and perform linting checks:
```bash
npm run lint
```

To compile the production build:
```bash
npm run build
```

---

## 📁 File Structure

```text
MyLife-Frontend/
├── src/
│   ├── components/
│   │   └── DashboardView.tsx # Patient Health Vault dashboard UI
│   ├── App.tsx               # Main Router, Landing page & Auth forms
│   ├── AuthContext.tsx       # Global React Context for Session Management
│   ├── api.ts                # API client with interceptors & auto-refresh
│   ├── types.ts              # TypeScript models mirroring backend Pydantic models
│   ├── main.tsx              # Application root element rendering App & AuthProvider
│   └── index.css             # Fluid/Liquid crystal styling rules
├── index.html                # Entry point HTML document
├── package.json              # Dependencies and scripts definitions
├── tsconfig.json             # TypeScript compiler settings
├── vite.config.ts            # Vite proxy & build configuration
├── .env.example              # Env configuration template
└── README.md                 # Project documentation
```

---

## 📄 License

Licensed under the MIT License.
