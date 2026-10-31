# 🚀 Brightloop - Collaborative Subscription Management System

A modern SaaS Subscription Management System built for an 8-hour hackathon. This repository contains the **complete modular skeleton** configured for 4 teammates to independently pick up modules, branch out, and build full functionality with clear boundaries.

---

## 🛠 Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + React Router + Lucide Icons + Axios
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Architecture:** Modular MVC / Domain-based routing

---

## 📁 Repository Structure

```text
Odoo_hack/
├── database.sql                  # MySQL tables & relationship schema
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MySQL connection pool
│   │   ├── middleware/
│   │   │   └── errorHandler.js  # Centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.js          # /api/auth
│   │   │   ├── products.js      # /api/products
│   │   │   ├── plans.js         # /api/plans
│   │   │   ├── customers.js     # /api/customers
│   │   │   ├── subscriptions.js # /api/subscriptions
│   │   │   ├── invoices.js      # /api/invoices
│   │   │   ├── payments.js      # /api/payments
│   │   │   ├── discounts.js     # /api/discounts
│   │   │   └── reports.js       # /api/reports
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/          # Reusable shared UI components
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── PageHeader.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ErrorMessage.jsx
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx
    │   ├── pages/               # Isolated module pages for team members
    │   │   ├── Dashboard/
    │   │   ├── Products/
    │   │   ├── Plans/
    │   │   ├── Customers/
    │   │   ├── Subscriptions/
    │   │   ├── Invoices/
    │   │   ├── Payments/
    │   │   ├── Discounts/
    │   │   ├── Reports/
    │   │   └── Staff/
    │   ├── services/
    │   │   └── api.js           # Shared Axios instance
    │   ├── App.jsx              # Application router
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── tailwind.config.js
    └── package.json
```

---

## 👥 Hackathon Team Division (4 Members)

To avoid git merge conflicts, assign modules independently:

| Teammate | Assigned Modules / Pages | Assigned Backend Routes |
|---|---|---|
| **Member 1 (Lead)** | `Dashboard`, `Reports`, `Staff` | `/api/auth`, `/api/reports` |
| **Member 2** | `Products`, `Plans`, `Discounts` | `/api/products`, `/api/plans`, `/api/discounts` |
| **Member 3** | `Customers`, `Subscriptions` | `/api/customers`, `/api/subscriptions` |
| **Member 4** | `Invoices`, `Payments` | `/api/invoices`, `/api/payments` |

---

## ⚡ Quick Start Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Odoo_hack
```

### 2. Set up MySQL Database
Import the schema into your local MySQL instance:
```bash
mysql -u root -p < database.sql
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env to match your local MySQL credentials if needed
npm start
# or for auto-reload during development:
npm run dev
```
Backend runs on `http://localhost:5000` (Health check at `http://localhost:5000/api/health`).

### 4. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🌿 Git Collaboration Rules

1. **Never commit directly to `main`**.
2. Create a feature branch for your module:
   ```bash
   git checkout -b feature/invoices-module
   ```
3. Commit your changes cleanly:
   ```bash
   git add .
   git commit -m "feat(invoices): add invoice generation logic and table"
   ```
4. Push and open a Pull Request against `main`.
