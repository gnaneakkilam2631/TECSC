<<<<<<< HEAD
# Workbench — Shop Manager

A web app for a computer sales & servicing shop: inventory/purchase records,
staff attendance, and automatic salary deduction based on attendance.

## Project structure

```
shop-manager/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # top-level app: session, data loading, routing
    ├── index.css          # design tokens + global styles
    ├── lib/
    │   ├── storage.js     # data persistence (localStorage for now)
    │   └── utils.js       # helpers: money formatting, attendance math
    └── components/
        ├── Login.jsx
        ├── AdminApp.jsx        # sidebar + routes between admin tabs
        ├── Dashboard.jsx
        ├── Inventory.jsx
        ├── StaffAdmin.jsx
        ├── AttendanceAdmin.jsx
        ├── SalaryReport.jsx
        ├── StaffApp.jsx        # staff self-service screen
        └── SectionHeader.jsx
```

## Running it locally in VS Code

1. Install [Node.js](https://nodejs.org/) (v18 or later) if you don't have it.
2. Open this folder in VS Code.
3. Open a terminal in VS Code (`` Ctrl+` ``) and run:
   ```
   npm install
   npm run dev
   ```
4. Open the URL it prints (usually `http://localhost:5173`).

First login: username `admin`, password `admin123`. Add staff and change the
admin password from inside the app once you're in.

## Pushing this to GitHub

From the terminal, inside this folder:

```
git init
git add .
git commit -m "Initial commit: shop manager app"
```

Then create a new empty repository on GitHub (no README/license, since you
already have files), and run the two commands it shows you, which look like:

```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Important limitation right now

Data is stored in the browser's `localStorage`, meaning **it only lives on
the one device/browser you use it in** — your father's login on his laptop
won't see attendance a staff member marks on their phone. This was a
deliberate choice to get you a fully working app with zero setup.

To make it usable across devices (which you'll want for real use — staff
marking attendance from their own phones, your father checking from home),
swap `src/lib/storage.js` for calls to a real backend. Good low-effort
options:
- **Supabase** or **Firebase** (free tier, minimal backend code, easiest to
  wire in without changing any other file — every component only calls
  `storeGet`/`storeSet`)
- A small custom API if you want full control later

## Ideas for what to add next

- Customer billing / invoicing
- Repair/service job tracking (device in, status, cost)
- Expense tracking (rent, electricity, etc.)
- Stronger login security (hashed passwords, not plain text) before real
  deployment
=======
# TECSC
Business management system for sales and services 
>>>>>>> dbd8b06fc8d409ab1ff5ca85baa1c21ee55236fa
