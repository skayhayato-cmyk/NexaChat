# 💬 Nexa Chat

> **Global Chat Platform** — Realtime, Aman, dan Lengkap  
> Dibangun dengan Next.js 14, Tailwind CSS, Prisma, Neon DB, dan Pusher

---

## ✨ Fitur Lengkap

| Fitur | Keterangan |
|-------|-----------|
| 🔐 **Auth** | Daftar/Login dengan email, username, password |
| 🛡️ **Anti-Bot** | Centang persetujuan + verifikasi matematika |
| 💬 **Global Chat** | Semua user chatting dalam 1 ruang |
| 👥 **Online Users** | Lihat siapa saja yang sedang online |
| 📷 **Foto & GIF** | Kirim gambar langsung di chat |
| 🎥 **Video** | Kirim & putar video langsung |
| 📁 **Dokumen** | Kirim ZIP, PDF, Word, Excel, dll |
| 🎙️ **Voice Note** | Rekam & kirim pesan suara |
| 🎭 **Stiker Custom** | Buat stiker sendiri seperti WhatsApp |
| 😀 **Emoji** | Panel emoji lengkap |
| ❤️ **Reaksi** | React ke pesan dengan emoji |
| 🗑️ **Hapus Pesan** | Hapus pesanmu sendiri |
| ✏️ **Edit Profil** | Ganti nama, status, dan foto profil |
| 🔔 **Notifikasi** | Push notification tiap ada pesan baru |
| 📱 **PWA** | Install sebagai aplikasi di HP |
| 🔄 **Service Worker** | Offline support + caching |
| ⌨️ **Typing Indicator** | Tampilkan siapa yang sedang mengetik |
| 🌙 **Dark Theme** | UI gelap yang elegan dengan glassmorphism |

---

## 🚀 Cara Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database (Neon.tech)

1. Buka [neon.tech](https://neon.tech) → Buat akun gratis
2. Buat project baru, copy **Connection String**
3. Akan dapat URL seperti: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`

### 3. Setup Pusher (Real-time)

1. Buka [pusher.com](https://pusher.com) → Daftar gratis
2. Buat app baru → pilih cluster terdekat (misal `ap1` untuk Asia)
3. Copy: App ID, Key, Secret, Cluster

### 4. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://..."       # Dari Neon
DIRECT_URL="postgresql://..."         # Sama dengan DATABASE_URL
JWT_SECRET="random-string-panjang-64-karakter"
PUSHER_APP_ID="xxx"
PUSHER_KEY="xxx"
PUSHER_SECRET="xxx"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="xxx"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Generate Icons

```bash
# Install svgexport global
npm install -g svgexport

# Generate semua ukuran icon dari SVG logo
node scripts/generate-icons.mjs
svgexport public/icons/logo.svg public/icons/icon-512.png 512:512
svgexport public/icons/logo.svg public/icons/icon-384.png 384:384
svgexport public/icons/logo.svg public/icons/icon-192.png 192:192
svgexport public/icons/logo.svg public/icons/icon-128.png 128:128
svgexport public/icons/logo.svg public/icons/icon-96.png 96:96
svgexport public/icons/logo.svg public/icons/icon-72.png 72:72
```

### 7. Jalankan Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Struktur Proyek

```
nexa-chat/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # Daftar akun
│   │   │   ├── login/route.ts       # Login
│   │   │   └── logout/route.ts      # Logout
│   │   ├── messages/
│   │   │   ├── route.ts             # GET & POST pesan
│   │   │   ├── [id]/route.ts        # DELETE pesan
│   │   │   ├── [id]/react/route.ts  # Reaksi emoji
│   │   │   └── typing/route.ts      # Typing indicator
│   │   ├── upload/route.ts          # Upload file/media
│   │   ├── users/
│   │   │   ├── online/route.ts      # Daftar user online
│   │   │   ├── profile/route.ts     # GET & UPDATE profil
│   │   │   └── heartbeat/route.ts   # Update status online
│   │   └── stickers/route.ts        # CRUD stiker
│   ├── chat/page.tsx                # Halaman chat utama
│   ├── login/page.tsx               # Halaman login
│   ├── register/page.tsx            # Halaman daftar
│   ├── globals.css                  # Styling global
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ChatClient.tsx               # Main chat UI
│   ├── ChatInput.tsx                # Input pesan + upload
│   ├── MessageBubble.tsx            # Tampilan pesan
│   ├── OnlineUsers.tsx              # Panel user online
│   ├── ProfileModal.tsx             # Modal edit profil
│   ├── StickerPanel.tsx             # Panel stiker
│   └── NexaLogo.tsx                 # Logo SVG
├── hooks/
│   ├── useNotifications.ts          # Push notification
│   └── useHeartbeat.ts              # Online status
├── lib/
│   ├── auth.ts                      # JWT + validasi
│   ├── db.ts                        # Prisma client
│   ├── pusher.ts                    # Pusher config
│   └── upload.ts                    # File upload helper
├── prisma/
│   └── schema.prisma                # Database schema
├── public/
│   ├── sw.js                        # Service Worker
│   ├── manifest.json                # PWA manifest
│   ├── icons/                       # App icons
│   └── sounds/                      # Notif sounds
├── scripts/
│   └── generate-icons.mjs           # Generate logo
└── middleware.ts                    # Auth middleware
```

---

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom CSS
- **Database**: PostgreSQL via Neon (Serverless)
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Realtime**: Pusher
- **Icons**: Lucide React
- **PWA**: Service Worker + Web Manifest

---

## 🔒 Keamanan

- Password di-hash dengan bcrypt (salt 12)
- JWT token HttpOnly cookie (30 hari)
- Validasi email, username, password di server
- Anti-bot: centang persetujuan + soal matematika
- Rate limiting di middleware
- File upload validation (tipe & ukuran)
- CORS dan CSRF protection bawaan Next.js

---

## 📱 Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel dashboard
# Atau via CLI:
vercel env add DATABASE_URL
vercel env add PUSHER_APP_ID
# ... dst
```

> **Penting**: Untuk upload file di production, gunakan layanan seperti **Cloudinary** atau **AWS S3** karena Vercel bersifat serverless (filesystem tidak persisten).

---

## 📝 Lisensi

MIT — Bebas digunakan dan dimodifikasi.

---

**Made with ❤️ untuk Nexa Chat** · Powered by Next.js + Neon + Pusher
