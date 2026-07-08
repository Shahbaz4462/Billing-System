# 🧁 Bakery Billing & Management System

<div align="center">

![Bakery POS Banner](https://img.shields.io/badge/Bakery-POS%20System-F59E0B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7wn6mBPC90ZXh0Pjwvc3ZnPg==)

**A full-featured, offline-first Point-of-Sale and Inventory Management System for bakeries and sweet shops.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

[🚀 Live Demo](#live-demo) • [✨ Features](#features) • [🔐 Login Details](#login-credentials) • [🛠️ Setup](#local-development) • [☁️ Deploy on Vercel](#vercel-deployment)

</div>

---

## 📸 Overview

Bakery Billing & Management System is a modern, **offline-first** POS application built specifically for Pakistani bakeries and sweet shops. It runs entirely in the browser — no server required — storing all data in `localStorage`. Deploy it once on Vercel and use it from any device.

The system supports **Urdu and English** languages, features **role-based access** (Owner & Employee), and covers the full business workflow from billing to payroll management.

---

## ✨ Features

### 🧾 Billing & POS
- Fast product search by name, code, or barcode
- Multi-item bills with quantity management
- Flat or percentage discounts per bill
- Tax calculation (configurable rate)
- Payment methods: Cash, Card, JazzCash, EasyPaisa
- Professional thermal receipt printing (80mm)
- Bill editing with full audit history

### 📦 Inventory Management
- Product CRUD with categories, barcodes, batch numbers & expiry dates
- Low stock alerts with configurable minimum thresholds
- Employee inventory request & owner approval workflow
- Supplier tracking per product

### 📊 Dashboard & Analytics
- Real-time sales charts (daily, weekly, monthly)
- Revenue, profit & bill count KPIs
- Product performance (hot/average/low sellers)
- Payment method breakdown

### 👥 Employee Management
- Employee profiles with role-based system access
- Monthly salary tracking & advance payment management
- Payment history per employee
- Salary status reporting

### 🔐 Security & Audit
- Role-based access: Owner (full access) | Employee (billing only)
- Complete audit log of all system actions
- Bill change history with diff tracking
- Approval workflow for sensitive operations

### ⚙️ Settings & Customization
- Bakery name, address, phone (English + Urdu)
- Tax rate, currency, paper size
- Theme (Light/Dark) and language (English/Urdu)
- Data backup & restore (JSON export/import)
- Reset to factory defaults

---

## 🔐 Login Credentials

> [!IMPORTANT]
> This is an offline-first application. All data is stored in your browser's `localStorage`. On first login, the system auto-populates with sample products and bills.

### Owner Account (Full Access)
| Field | Value |
|-------|-------|
| **Username** | `owner` |
| **Password** | `owner123` |
| **Role** | Owner (all features unlocked) |
| **Access** | Dashboard, Billing, Inventory, Bills, Employees, Approvals, Audit Logs, Settings |

### Employee Account (Restricted)
| Field | Value |
|-------|-------|
| **Username** | `ahmad` |
| **Password** | `emp123` |
| **Role** | Employee |
| **Access** | Billing, Inventory requests (pending approval) |

> [!TIP]
> You can create additional employees from the **Employees** page after logging in as owner. Go to Employees → Add New Employee and toggle "System Access" to on.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm 9+ (comes with Node.js)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Shahbaz4462/Billing-System.git
cd Billing-System

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

### Preview Production Build Locally

```bash
npm run preview
```

---

## ☁️ Vercel Deployment

### Step 1 — Import Your GitHub Repository
1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **"Add New Project"**
3. Select the `Billing-System` repository from your list

### Step 2 — Configure Build Settings

Vercel will auto-detect Vite. Verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

### Step 3 — Environment Variables

> [!NOTE]
> This project uses **localStorage only** — it has **no backend, no database, and no external API**. You do **NOT** need to set any environment variables for the basic deployment to work.

If you want to customize the build (optional):

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_APP_NAME` | `Bakery POS` | App display name |
| `VITE_APP_VERSION` | `1.0.0` | Version label |

To add environment variables in Vercel:
- Go to your project → **Settings** → **Environment Variables**
- Add each key-value pair and select the environment (Production/Preview/Development)

### Step 4 — Deploy

Click **"Deploy"** — Vercel will build and deploy in ~1-2 minutes.

Your app will be live at: `https://billing-system-<hash>.vercel.app`

### Vercel Settings Checklist

```
✅ Framework:       Vite (auto-detected)
✅ Build Command:   npm run build
✅ Output Dir:      dist
✅ Node Version:    18.x or 20.x
✅ Root Directory:  ./ (leave empty — repo root)
✅ vercel.json:     Present (handles SPA routing)
✅ Env Variables:   None required
```

> [!WARNING]
> Do NOT set the root directory to a subfolder unless your source code is inside one. Since this project is deployed directly from the repo root, leave the root directory field **empty** in Vercel.

---

## 🏗️ Project Architecture

```
bakery-billing-system/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # App shell (sidebar, header)
│   │   ├── Modal.tsx        # Reusable modal dialog
│   │   ├── Notifications.tsx# Toast notifications
│   │   └── ReceiptPreview.tsx # Thermal receipt renderer
│   ├── pages/               # Full-page views
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── BillingPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── BillsPage.tsx
│   │   ├── EmployeesPage.tsx
│   │   ├── ApprovalsPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── store/
│   │   ├── AppContext.tsx    # React context (auth, notifications)
│   │   └── database.ts      # localStorage CRUD layer
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── i18n/
│   │   └── translations.ts  # English/Urdu translations
│   ├── App.tsx              # Root component & routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles & Tailwind
├── index.html               # HTML shell
├── vite.config.ts           # Vite configuration
├── vercel.json              # Vercel SPA routing config
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

---

## 🗃️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.x | Build tool |
| Tailwind CSS | 4.x | Styling |
| Chart.js + react-chartjs-2 | 4.x / 5.x | Analytics charts |
| date-fns | 4.x | Date utilities |
| uuid | 14.x | ID generation |
| react-hot-toast | 2.x | Toast notifications |
| react-icons | 5.x | Icon library |
| localStorage | Browser API | Data persistence |

---

## 💾 Data & Privacy

- All data is stored **locally in the browser** via `localStorage`
- No data is sent to any server
- Use **Settings → Backup Data** to export a JSON file
- Use **Settings → Restore Data** to import a backup
- Use **Settings → Reset System** to clear all data and start fresh

---

## 📝 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Muhammad Shahbaz**  
[![GitHub](https://img.shields.io/badge/GitHub-Shahbaz4462-181717?style=flat-square&logo=github)](https://github.com/Shahbaz4462)

---

<div align="center">

Made with ❤️ for Pakistani Bakeries | Built with React + Vite + TypeScript

</div>
