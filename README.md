# Katala — Katalog & Reservasi Wisata Lampung

Platform web untuk menjelajahi, memesan, dan mengelola destinasi wisata di Provinsi Lampung. Dilengkapi dengan sistem reservasi, pembayaran via Midtrans, tiket digital ber-QR Code, dan dashboard admin.

---

## Fitur Utama

- **Katalog Destinasi** — jelajahi destinasi wisata Lampung dengan filter kategori, pencarian, dan peta interaktif (Leaflet)
- **Reservasi & Pembayaran** — booking tiket dengan kuota harian otomatis, pembayaran via Midtrans Snap
- **Tiket Digital** — tiket QR Code otomatis digenerate setelah pembayaran berhasil
- **Rating & Ulasan** — rating hanya bisa diberikan setelah tiket di-scan oleh petugas
- **Dashboard Admin** — kelola destinasi, pantau transaksi, statistik pendapatan, dan manajemen pengguna
- **Multi-role** — Tourist, Admin, Staff dengan akses berbeda

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Validasi | Zod |
| Pembayaran | Midtrans Snap |
| Peta | Leaflet + React Leaflet |
| QR Code | qrcode, html5-qrcode |
| Monorepo | pnpm workspaces |

---

## Struktur Project

```
Lampung-Tour-Catalog/
├── artifacts/
│   ├── api-server/          # Backend Express API
│   │   └── src/
│   │       ├── routes/      # auth, destinations, reservations, payments, tickets, ratings, admin
│   │       ├── middlewares/ # authMiddleware
│   │       └── lib/         # auth helpers, logger
│   └── katala/              # Frontend React
├── lib/
│   └── db/
│       └── src/
│           └── schema/      # Drizzle schema (users, sessions, destinations, dst.)
└── backup.sql               # Dump database awal
```

---

## Prasyarat

- Node.js >= 18
- pnpm >= 9
- PostgreSQL (lokal)

---

## Instalasi & Menjalankan

### 1. Clone repository

```bash
git clone https://github.com/username/Lampung-Tour-Catalog.git
cd Lampung-Tour-Catalog
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup database

Buat database PostgreSQL baru, lalu jalankan skema awal:

```bash
psql -U postgres -c "CREATE DATABASE katala;"
psql -U postgres -d katala -f backup.sql
```

### 4. Konfigurasi environment

Buat file `.env` di `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/katala
PORT=3000
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

> Jika `MIDTRANS_SERVER_KEY` tidak diisi, sistem otomatis masuk ke **demo mode** — pembayaran akan disimulasikan tanpa memanggil Midtrans.

### 5. Jalankan backend

```bash
cd artifacts/api-server
pnpm dev
```

### 6. Jalankan frontend

```bash
cd artifacts/katala
pnpm dev
```

Frontend tersedia di `http://localhost:5173`, API di `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru | — |
| POST | `/api/auth/login` | Login | — |
| POST | `/api/auth/logout` | Logout | ✓ |
| GET | `/api/auth/me` | Data user login | ✓ |
| PATCH | `/api/auth/profile` | Update profil | ✓ |
| GET | `/api/destinations` | List destinasi (+ pagination, search) | — |
| GET | `/api/destinations/:id` | Detail destinasi | — |
| POST | `/api/destinations` | Tambah destinasi | Admin |
| GET | `/api/reservations` | Riwayat reservasi saya | ✓ |
| POST | `/api/reservations` | Buat reservasi | ✓ |
| POST | `/api/payments/create` | Buat transaksi Midtrans | ✓ |
| POST | `/api/payments/webhook` | Callback Midtrans | — |
| GET | `/api/tickets` | Tiket saya | ✓ |
| POST | `/api/tickets/scan` | Scan tiket | Admin/Staff |
| POST | `/api/ratings` | Beri rating | ✓ |
| GET | `/api/admin/stats` | Statistik dashboard | Admin/Staff |
| GET | `/api/admin/transactions` | Semua transaksi | Admin |
| GET | `/api/health` | Health check | — |

---

## Role Pengguna

| Role | Akses |
|---|---|
| `tourist` | Browsing, reservasi, pembayaran, tiket, rating |
| `staff` | Scan tiket |
| `admin` | Semua akses + kelola destinasi, pengguna, transaksi |

---

## Lisensi

MIT
