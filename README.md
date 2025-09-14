# Jurnal Giri

Aplikasi jurnal keuangan modern yang dibangun untuk membantu mengelola transaksi, hutang, dan laporan keuangan secara efisien.

## ✨ Fitur Utama

- **Autentikasi Pengguna**: Sistem login dengan dua level akses: `ADMIN` dan `OPERATOR`.
- **Manajemen Transaksi**: Pencatatan transaksi pemasukan (DEBIT) dan pengeluaran (KREDIT).
- **Manajemen Siswa & Hutang**: Mengelola data siswa dan melacak hutang yang perlu dibayar.
- **Laporan Keuangan**: Menghasilkan berbagai laporan seperti Laporan Arus Kas, Laba Rugi, dan lainnya.
- **Pengaturan Dinamis**: Konfigurasi parameter aplikasi seperti biaya SPP melalui antarmuka admin.
- **Antarmuka Database**: Akses langsung ke database melalui **Adminer** untuk kemudahan pengelolaan data.

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Autentikasi**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan [Shadcn/UI](https://ui.shadcn.com/)
- **Kontainerisasi**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **UI Database**: [Adminer](https://www.adminer.org/)

## 🚀 Memulai Proyek (Lokal)

Proyek ini sepenuhnya dikonfigurasi untuk berjalan di dalam kontainer Docker, menyederhanakan proses setup.

### Prasyarat

- [Docker](https://www.docker.com/products/docker-desktop/) terinstal di mesin Anda.

### Langkah-langkah Instalasi

1.  **Clone Repositori**

    ```bash
    git clone <URL_REPOSITORI_ANDA>
    cd jurnal-giri
    ```

2.  **Buat File Environment**

    Salin file `.env.example` menjadi `.env`. Variabel default sudah dikonfigurasi untuk lingkungan Docker.

    ```bash
    cp .env.example .env
    ```

3.  **Jalankan dengan Docker Compose**

    Perintah ini akan membangun image Docker, membuat kontainer, dan menjalankan semua layanan di latar belakang.

    ```bash
    docker-compose up -d --build
    ```

    Proses ini mungkin memakan waktu beberapa menit saat pertama kali dijalankan karena perlu mengunduh image dan menginstal dependensi.

## 🌐 Layanan yang Berjalan

Setelah `docker-compose up` berhasil, layanan berikut akan tersedia:

- **Aplikasi Jurnal Giri**: [http://localhost:3000](http://localhost:3000)
- **Antarmuka Database (Adminer)**: [http://localhost:8080](http://localhost:8080)
- **Koneksi Langsung ke Database**: Port `5433` di `localhost` (untuk dihubungkan via tool database eksternal).

## 👤 Akun Default

Proses setup secara otomatis membuat dua pengguna default di database:

- **Admin**
  - **Username**: `admin@jurnalgiri.com`
  - **Password**: `passwordgiri`

- **Operator**
  - **Username**: `operator@girifinancials.com`
  - **Password**: `password`

## 🗃️ Login ke Adminer

Untuk mengakses database melalui Adminer, gunakan kredensial berikut di halaman login [http://localhost:8080](http://localhost:8080):

- **System**: `PostgreSQL`
- **Server**: `db` (ini adalah nama host internal Docker)
- **Username**: `admin`
- **Password**: `password`
- **Database**: `girifinancials`