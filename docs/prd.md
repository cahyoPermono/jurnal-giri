Dokumen Kebutuhan Produk (Product Requirements Document)
Aplikasi "Giri Financials" - Versi Web App
Proyek: Giri Financials

Versi Dokumen: 2.0 (Web App)

Tanggal: 9 September 2025

1. Ringkasan Eksekutif
"Giri Financials" adalah sebuah aplikasi web yang di-hosting secara lokal, dirancang untuk modernisasi dan digitalisasi sistem manajemen keuangan di PAUD Sunan Giri. Aplikasi ini menyediakan platform terpusat yang dapat diakses melalui browser dari berbagai perangkat dalam jaringan lokal yang sama. Tujuannya adalah untuk menggantikan pencatatan manual, meningkatkan akurasi data, menyederhanakan pelaporan, dan memberikan gambaran keuangan yang transparan dan akuntabel. Deployment menggunakan teknologi Docker untuk memastikan instalasi yang bersih, konsisten, dan mudah dikelola pada satu laptop server.

2. Latar Belakang & Tujuan
2.1. Masalah yang Dihadapi
Proses keuangan saat ini yang berbasis manual (buku kas/spreadsheet) menimbulkan beberapa tantangan:

Akses Terbatas: Data hanya dapat dilihat atau diubah pada satu komputer atau buku fisik, menghambat kolaborasi antara bendahara dan kepala sekolah.

Risiko Kehilangan Data: Kerusakan hardware atau file dapat menyebabkan hilangnya seluruh data keuangan.

Inefisiensi Pelaporan: Proses rekapitulasi data untuk laporan bulanan memakan waktu dan rentan terhadap kesalahan manusia.

Kurangnya Transparansi: Sulit untuk melacak aliran dana antar kas dan mendapatkan gambaran keuangan secara real-time.

2.2. Solusi yang Diusulkan
Membangun aplikasi web yang berjalan di server lokal (laptop Windows) dengan karakteristik berikut:

Akses Multi-Perangkat: Dapat diakses oleh pengguna yang berwenang (bendahara, kepala sekolah) dari laptop atau perangkat lain selama terhubung ke jaringan WiFi yang sama.

Database Terpusat: Menggunakan PostgreSQL sebagai database terpusat untuk memastikan konsistensi dan integritas data.

Fitur Lengkap: Menyediakan semua fungsionalitas yang dibutuhkan, mulai dari jurnal umum, manajemen siswa, hingga pelaporan instan.

Deployment Modern: Menggunakan Docker untuk mengemas aplikasi dan database, menyederhanakan instalasi dan pemeliharaan.

2.3. Sasaran Proyek
Aksesibilitas: Memungkinkan minimal 2 pengguna (Operator & Admin) untuk mengakses sistem secara bersamaan dari perangkat yang berbeda.

Efisiensi: Mengurangi waktu yang dibutuhkan untuk membuat laporan keuangan bulanan hingga 95%.

Akurasi: Memastikan semua perhitungan saldo dan laporan dihasilkan secara otomatis dan akurat oleh sistem.

Keamanan: Melindungi data keuangan melalui sistem login yang aman dan database yang andal.

3. Persona Pengguna
Operator (Bendahara):

Deskripsi: Pengguna harian yang bertanggung jawab atas semua pencatatan transaksi, verifikasi pembayaran, dan pengelolaan kas fisik maupun bank.

Kebutuhan: Antarmuka yang cepat dan intuitif untuk input data; kemampuan untuk melihat daftar siswa yang menunggak SPP dengan mudah; proses pencatatan yang tidak rumit.

Skenario: "Saya perlu mencatat pembayaran SPP dari 5 siswa yang baru saja membayar via transfer. Saya ingin melakukannya dengan cepat dari laptop saya tanpa harus mengganggu Kepala Sekolah yang mungkin juga sedang melihat laporan."

Admin (Kepala Sekolah):

Deskripsi: Pengguna yang membutuhkan gambaran umum keuangan untuk pengambilan keputusan dan pengawasan. Tidak terlibat dalam input data harian.

Kebutuhan: Akses mudah ke dashboard ringkasan; kemampuan untuk melihat dan mencetak laporan bulanan kapan saja; fitur untuk mengawasi aktivitas pengguna melalui jejak audit.

Skenario: "Menjelang rapat dengan komite, saya perlu mencetak laporan laba rugi bulan lalu. Saya bisa membuka aplikasi dari laptop di ruangan saya dan langsung mengunduh PDF-nya."

4. Kebutuhan Fungsional (Fitur)
F-01: Otentikasi & Otorisasi Pengguna
F-01.1: Halaman login yang aman untuk masuk ke aplikasi.

F-01.2: Sistem berbasis peran dengan dua level hak akses:

Admin: Akses penuh untuk melihat semua data, laporan, jejak audit, dan mengelola akun pengguna.

Operator: Hak akses untuk operasional harian: mengelola data master (siswa, kategori), mencatat semua jenis transaksi, dan menghasilkan laporan.

F-02: Dashboard Utama
F-02.1: Tampilan ringkasan real-time yang menampilkan total saldo dan saldo per masing-masing kas.

F-02.2: Grafik sederhana perbandingan Total Debit vs. Total Kredit bulan berjalan.

F-02.3: Panel notifikasi untuk peringatan penting: siswa dengan SPP jatuh tempo, daftar hutang, dan daftar piutang.

F-03: Manajemen Data Master
F-03.1: Master Siswa: Antarmuka untuk melakukan CRUD pada data siswa.

F-03.2: Master Kategori Kredit: Antarmuka untuk menambah atau mengubah kategori pengeluaran.

F-03.3: Master Pengguna (khusus Admin): Antarmuka untuk mengelola akun pengguna (tambah/hapus Operator).

F-04: Manajemen Kas & Transaksi
F-04.1: Sistem Multi-Kas: Pengelolaan 5 akun kas terpisah (Pendaftaran, SPP, Kegiatan, Lain-lain, Bank).

F-04.2: Jurnal Umum: Fitur untuk mencatat transaksi Debit (pemasukan) dan Kredit (pengeluaran) dengan formulir yang intuitif.

F-04.3: Transfer Antar Kas: Fitur khusus untuk memindahkan dana antar kas internal secara aman.

F-05: Pelaporan & Ekspor PDF
F-05.1: Semua laporan dapat difilter berdasarkan rentang tanggal.

F-05.2: Fitur "Ekspor ke PDF" untuk semua laporan.

F-05.3: Jenis Laporan: Jurnal Umum, Laporan Laba Rugi Sederhana, Laporan Arus Kas, dan Laporan Tanggungan per Siswa.

F-06: Jejak Audit (Audit Trail)
F-06.1: Sistem secara otomatis mencatat semua aktivitas krusial (pembuatan/perubahan transaksi, login, dll.).

F-06.2: Halaman khusus (hanya untuk Admin) untuk melihat log audit yang berisi informasi Aksi, Pengguna, dan Waktu.

5. Kebutuhan Non-Fungsional
Deployment: Aplikasi harus dapat di-deploy sebagai satu kesatuan menggunakan docker-compose pada satu mesin Windows.

Aksesibilitas: Aplikasi harus dapat diakses dari browser web modern (Chrome, Firefox) di perangkat apa pun (laptop, tablet) yang terhubung ke jaringan lokal yang sama.

Performa: Waktu muat halaman dan respons transaksi harus cepat (<2 detik) dalam kondisi penggunaan normal di jaringan lokal.

Keamanan: Password pengguna harus di-hash. Kunci rahasia dan kredensial database harus disimpan sebagai variabel lingkungan dan tidak boleh terlihat di kode sumber.

Usabilitas: Antarmuka harus bersih, responsif, dan mudah dinavigasi oleh pengguna dengan tingkat keahlian teknis yang beragam.

6. Di Luar Cakupan (Out of Scope untuk Versi 1.0)
Akses aplikasi dari luar jaringan lokal (internet).

Sinkronisasi atau backup data ke cloud.

Aplikasi mobile native (iOS/Android).

Integrasi dengan sistem pembayaran online (payment gateway).

Manajemen inventaris aset sekolah.