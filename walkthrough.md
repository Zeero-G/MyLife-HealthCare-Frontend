# MyLife Healthcare – Technical Walkthrough

## What Was Done

### Phase 1: Backend Bug Fixes

#### 1. `records.py` – FastAPI Route Order Bug (Critical)
The routes `/share-qr`, `/upload`, and `/family/{patient_id}` were defined **after** the parameterized `/{record_id}` route. FastAPI matches routes top-to-bottom, so the words "share-qr" and "family" were being treated as record IDs.

**Fix:** Moved all specific routes before the `/{record_id}` catch-all.

#### 2. `family.py` – Missing User Names
`GET /family/members` only returned raw `linked_accounts` rows (UUIDs). The frontend had no way to display who the member was.

**Fix:** After fetching links, the backend now does a secondary query per member to get `full_name`, `email`, `role`, `gender` from the `users` table.

#### 3. `emergency.py` – Missing Write Endpoints
Only `GET /emergency/profile/{user_id}` existed. Patients couldn't create or update their profiles.

**Fix:** Added `POST /emergency/profile`, `PUT /emergency/profile`, and `POST /emergency/profile/upsert` — all requiring JWT auth.

#### 4. `auth.py` – Added `GET /auth/doctors`
Required for appointment booking feature — lets patients browse all registered doctors.

### Phase 2: New Backend – Appointments

New `appointments.py` router in `medical-records-service`:

| Endpoint | Method | Who |
|---|---|---|
| `/appointments/` | POST | Patient books |
| `/appointments/mine` | GET | Patient's appointments |
| `/appointments/doctor` | GET | Doctor's queue |
| `/appointments/{id}` | PUT | Update status |
| `/appointments/{id}` | DELETE | Cancel |

Updated `nginx.conf` to proxy `/appointments` to medical-records-service (8002).
Updated `vite.config.ts` to proxy `/appointments` in dev.

### Phase 3: Database Schema Update

Added to `database/schema.sql`:
- `medical_schema.appointments` table with `patient_id`, `doctor_id`, `scheduled_at`, `reason`, `status`, `notes`
- `medical_schema.doctor_notes` table
- Indexes for both new tables

> [!IMPORTANT]
> Run the new `schema.sql` in your Supabase SQL Editor to create the `appointments` and `doctor_notes` tables.

### Phase 4: Frontend – New Types & API

`types.ts` additions:
- `Doctor`, `Appointment`, `AppointmentCreatePayload`, `AppointmentUpdatePayload`
- `MenstrualCycle`, `MenstrualCyclePayload`, `PregnancyRecord`, `PregnancyPayload`
- `EmergencyProfilePayload` (for write operations)
- `FamilyMember` enriched with `full_name`, `email`, `role`, `gender`

`api.ts` additions:
- `authAPI.listDoctors()` – GET /auth/doctors
- `appointmentsAPI.book/myAppointments/doctorAppointments/update/cancel`
- `healthAPI.getCycles/logCycle/getPregnancy/logPregnancy`
- `emergencyAPI.create/update/upsert`

### Phase 5: New Frontend Components

| Component | File | Purpose |
|---|---|---|
| RecordsView | `src/components/RecordsView.tsx` | Full CRUD + Share QR modal + Delete + Filter |
| UploadView | `src/components/UploadView.tsx` | Drag-and-drop file upload with real API |
| EmergencyView | `src/components/EmergencyView.tsx` | Blood type, allergies, contacts view/edit |
| WomensHealthView | `src/components/WomensHealthView.tsx` | Cycle logging + pregnancy tracking (real API) |
| AppointmentView | `src/components/AppointmentView.tsx` | Patient books + doctor manages queue |

### Phase 6: Updated Existing Components

#### `DashboardView.tsx`
- All tabs now render **real components** (previously "Work in progress")
- Added mobile bottom navigation bar
- Women's Health tab only shows for `gender === 'female'`
- User avatar + email shown in sidebar

#### `PatientDashboard.tsx`
- Record count now from real `records.length` (not hardcoded "24")
- Menstrual cycle chart now uses real API data
- Upcoming appointment displayed in overview
- All stat cards are clickable and navigate to their respective tabs

#### `FamilyDashboard.tsx`
- Members now show `full_name` instead of just UUID
- Fixed `record.type` → `record.record_type` (correct field name)
- Add member form includes copy instruction
- Member cards show gender, role, email

#### `DoctorDashboard.tsx`
- Replaced hardcoded "12 Documents / 45 Active" with real appointment data
- Pending appointments shown with Confirm/Decline actions
- All appointments listed with status badges

---

## How To Run

### Backend
```bash
cd /home/malan/Desktop/ZeeroG/MyLife-HealthCare
docker-compose up
```

### Frontend
```bash
cd /home/malan/Desktop/ZeeroG/MyLife-Frontend
npm run dev
# Opens at http://localhost:3000
```

---

## Supabase Database – Required Action

> [!IMPORTANT]
> Run this SQL in your Supabase SQL Editor to add the appointments table:

```sql
CREATE TABLE IF NOT EXISTS appointments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL,
    doctor_id    UUID NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    reason       TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','completed','cancelled')),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
```

> [!NOTE]
> Note: If your Supabase tables use the custom schemas from `schema.sql` (e.g., `medical_schema.appointments`), adjust the table name in `appointments.py` accordingly.

---

## Feature Test Flows

### ✅ Medical Records
1. Log in as patient → Dashboard → **My Records** tab
2. Click **Add Record** → fill form → Submit
3. Hover a record → click 🗑️ Delete → confirm
4. Hover a record → click 📤 Share → copy the generated URL

### ✅ Family Members
1. Log in as patient → **Family Members** tab → **Add Member**
2. Ask family member to go to their Account tab and copy User ID
3. Paste ID + select relationship → Link Account
4. Click member card → view their medical records below

### ✅ Doctor Appointments
1. Patient: **Appointments** tab → **Book Appointment**
2. Browse doctors → Select → Pick time/reason → Confirm
3. Doctor logs in → **Overview** shows pending appointments
4. Doctor clicks **Confirm** or **Decline**
5. Patient sees updated status on their Appointments tab

### ✅ Women's Health (female patients only)
1. Log in as female patient → sidebar shows **Women's Health** tab
2. Click → **🌙 Cycle** tab → **Log Cycle** → fill dates
3. Chart updates with real data
4. Switch to **🤰 Pregnancy** tab → Add Record

### ✅ Emergency Profile
1. Patient → **Emergency Profile** tab
2. Select blood type → add allergies/conditions/medications → Save
3. Emergency responders can access: `GET /emergency/profile/{your-user-id}` publicly

---

## Architecture Summary

```
Browser (React/Vite :3000)
    ↓ proxy
NGINX Gateway (:80)
    ├── /auth         → auth-service        (:8001)
    ├── /records      → medical-records     (:8002)
    ├── /emergency    → medical-records     (:8002)
    ├── /appointments → medical-records     (:8002)  ← NEW
    ├── /family       → family-profile      (:8003)
    ├── /health       → family-profile      (:8003)
    ├── /ai           → ai-processing       (:8004)
    └── /notify       → notification        (:8005)
```
