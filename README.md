# HC-DRMS — Human Capital Data Request Management System

Platform internal untuk standardisasi proses permintaan data kepegawaian: dari intake → klarifikasi → fulfillment multi-source → review → delivery → arsip & knowledge management.

> **Status:** MVP / Proof of Concept. Stack production target lihat bagian [Phase 2](#phase-2-roadmap).

---

## Highlight Fitur

- **Login multi-role** dengan 8 akun demo (1 per role)
- **Request lifecycle end-to-end** — state machine 14 status mengikuti BRD §6.2
- **Dynamic intake form** per kategori dengan auto-classification sensitivitas
- **RBAC** — requestor hanya melihat permintaan miliknya, role lain melihat sesuai konteks
- **Approval matrix** berdasarkan kategori × sensitivitas × granularity
- **Threaded clarification** dengan voice-to-text (Web Speech API, Bahasa Indonesia)
- **Multi-source deliverable** dengan auto-detect inkonsistensi cut-off antar sumber
- **Effort tracking** per fase pekerjaan untuk capacity planning
- **Review gate** dengan checklist QC sebelum delivery
- **CSAT** rating saat requestor confirm
- **Knowledge Base** dengan formula viewer (SQL/DAX/M/Excel) + parameters
- **Data Source Catalog** dengan field-level documentation
- **Manager dashboard** — KPI cards + 7 chart blocks (volume, SLA, workload, sensitivity heatmap, dst)
- **Personal dashboard** adaptive per role (engineer, requestor)
- **Audit log** immutable read-only sesuai UU PDP

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| State | TanStack Query + React Context |
| Mock Data | @faker-js/faker (seed deterministic) |
| Storage | localStorage (PoC) — Supabase di Phase 2 |
| Tests | vitest (38 unit tests) |
| Deployment | Vercel |

---

## Akun Demo (PoC)

Halaman `/login` menampilkan 8 kartu akun. Klik salah satu untuk masuk sebagai role tersebut:

| Role | Tugas Utama |
|---|---|
| **Requestor** | Submit request, klarifikasi, terima hasil + CSAT |
| **Requestor Manager** | Approve request bawahan |
| **HCIS Engineer** | Pickup dari worklist, ekstraksi, upload deliverable |
| **HCIS Reviewer** | QC deliverable di Review Gate |
| **HCIS Manager** | Dashboard analytics + monitoring + assignment |
| **Data Owner** | Approval data sensitif (Compensation, Talent) |
| **Auditor** | Read-only audit log |
| **System Admin** | Master data & konfigurasi (Phase 2 untuk full UI) |

> Untuk speed demo, role switcher di header (avatar dropdown) memungkinkan pindah role tanpa logout-login.

---

## Cara Menjalankan Lokal

Prasyarat: Node.js ≥ 20.9, npm ≥ 10.

```bash
# Clone
git clone https://github.com/bachtiarashidiqy/hcdrms.git
cd hcdrms

# Install
npm install

# Dev server (Turbopack)
npm run dev
# → http://localhost:3000
```

Aplikasi akan generate seed data otomatis di first load (60 users, 200 requests, 15 KB articles, 8 data sources, 90+ deliverables, 500 audit logs) dan disimpan di `localStorage`.

**Reset data**: klik tombol refresh (🔄) di header → konfirmasi.

---

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Start production server
npm run typecheck    # TypeScript check
npm run test         # Unit tests (vitest run)
npm run test:watch   # Unit tests watch mode
```

---

## Struktur Folder

```
src/
├── app/                  # Next.js App Router
│   ├── (app)/            # Protected routes (sidebar + header layout)
│   │   ├── dashboard/    # Manager + personal dashboard
│   │   ├── requests/     # List, detail, intake form
│   │   ├── worklist/     # Engineer worklist
│   │   ├── kb/           # Knowledge base
│   │   ├── data-sources/ # Data source catalog
│   │   └── admin/        # Audit log, master data
│   ├── login/            # Login page (no sidebar)
│   └── layout.tsx        # Root layout + Providers
├── features/             # Feature-based domain logic
│   ├── auth/
│   ├── request/          # Schema, sensitivity classifier, components
│   ├── workflow/         # State machine, transitions, clarification
│   ├── fulfillment/      # Worklist, deliverable, effort, review gate
│   ├── kb/               # Article browse + detail
│   ├── data-source/      # Catalog grid + detail
│   ├── dashboard/        # Analytics + chart components
│   └── audit/            # Audit log table
├── components/
│   ├── ui/               # shadcn primitives (auto-generated)
│   └── shared/           # Composite shared (Header, Sidebar, RoleSwitcher, VoiceInput, AuthGuard)
├── lib/                  # constants, utils, mock store
├── mocks/                # seed.ts (deterministic via faker.seed(42))
└── types/                # domain.ts (entitas BRD §9)
```

Aturan: **feature-based, bukan type-based**. Business logic pure di `features/*/lib/`, terpisah dari I/O.

---

## Voice-to-Text

Field text panjang dilengkapi tombol mikrofon untuk voice input via Web Speech API:
- Klarifikasi thread
- Tujuan penggunaan data (intake form)
- Caveats deliverable

Bahasa default `id-ID`. Browser yang didukung: Chrome dan Edge terbaru. Tombol auto-hide kalau browser tidak support.

---

## Testing

```bash
npm run test
```

38 unit tests mencakup:
- State machine workflow (21 tests) — transition validity, role-based permissions, end-to-end happy path
- Sensitivity classifier (10 tests) — kategori × granularity → level sensitivitas
- Cut-off inconsistency detector (7 tests) — boundary conditions

---

## Phase 2 Roadmap

Yang **tidak** dibangun di MVP, ada di roadmap setelah Direksi approval:

| Item | Phase 2 |
|---|---|
| Database real | Migrasi dari localStorage ke Supabase (schema sudah Supabase-shaped) |
| Authentication | SSO/Active Directory korporat (saat ini mock login) |
| Notification | Email outbound + Microsoft Teams webhook (saat ini in-app toast) |
| Localization | English toggle (saat ini Bahasa Indonesia) |
| Power BI | Embedded dashboard (saat ini link reference) |
| Real integration | API ke SAP HCM, sistem sumber lainnya (saat ini manual entry) |

---

## Catatan untuk Kontributor / AI Agent

- Konvensi proyek: lihat `CLAUDE.md` (link ke `AGENTS.md`)
- Next.js 16 punya breaking changes — selalu cek `node_modules/next/dist/docs/` sebelum invoke API yang tidak familiar
- Default ke Server Components; tambahkan `"use client"` hanya saat butuh interaktivitas
- Form: react-hook-form + zod schema di `features/*/schemas/`
- Default tidak menulis komentar kecuali WHY non-obvious

---

## Lisensi

Internal — proprietary.
