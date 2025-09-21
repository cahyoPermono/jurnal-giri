# Docker Network Configuration

## Mengatasi Masalah IP Address di Docker

Aplikasi ini sudah dikonfigurasi untuk menangani perubahan jaringan dengan mudah.

## Instalasi Docker

### Windows

#### 1. Download Docker Desktop
- Kunjungi: https://docs.docker.com/desktop/install/windows-install/
- Download **Docker Desktop for Windows**
- Jalankan installer dan ikuti instruksi

#### 2. Persyaratan Sistem
- **Windows 10/11 64-bit**: Pro, Enterprise, atau Education (versi 1903+)
- **Windows Home**: Memerlukan WSL 2 (Windows Subsystem for Linux)
- **Hardware**: Minimal 4GB RAM
- **Virtualisasi**: Aktifkan VT-x/AMD-V di BIOS

#### 3. Instalasi WSL 2 (Untuk Windows Home)
```powershell
# Jalankan di PowerShell sebagai Administrator
wsl --install
wsl --set-default-version 2
```

#### 4. Verifikasi Instalasi
```cmd
# Buka Command Prompt
docker --version
docker-compose --version
```

#### 5. Konfigurasi Docker Desktop
- Buka Docker Desktop
- Pergi ke **Settings > General**
- Pastikan "Start Docker Desktop when you log in" dicentang
- Pergi ke **Settings > Resources > WSL Integration**
- Enable integration dengan distro WSL yang diinginkan

#### 6. Troubleshooting Windows
- **Error: WSL 2 installation is incomplete**
  ```cmd
  wsl --update
  wsl --shutdown
  ```
- **Error: Hardware assisted virtualization**
  - Restart komputer dan masuk BIOS
  - Enable VT-x (Intel) atau AMD-V (AMD)
- **Port sudah digunakan**
  - Ganti port di docker-compose.yml
  - Atau hentikan aplikasi yang menggunakan port 3000

#### 7. Menggunakan Git Bash di Windows
Jika menggunakan Git Bash (dari Git for Windows):
```bash
# Script akan bekerja sama seperti di Linux/macOS
./update-ip.sh

# Atau manual
export HOST_IP="192.168.1.100"
docker-compose up -d
```

#### 8. Windows Firewall
Pastikan Windows Firewall mengizinkan Docker:
- Buka **Windows Defender Firewall > Allow an app or feature**
- Pastikan "Docker Desktop" dicentang untuk Private dan Public network

### Masalah yang Diselesaikan
- ✅ **Sebelumnya**: URL akses jaringan menampilkan IP container Docker (172.x.x.x) yang tidak dapat diakses dari luar
- ✅ **Sekarang**: URL akses jaringan menampilkan IP host machine yang benar (192.168.x.x)

### Cara Menggunakan di Jaringan Berbeda

#### Opsi 1: Menggunakan Script Otomatis (Direkomendasikan)

**Linux/macOS/Git Bash:**
```bash
# Jalankan script untuk mendeteksi dan update IP secara otomatis
./update-ip.sh

# Kemudian restart container
docker-compose down && docker-compose up --build -d
```

**Windows (Command Prompt):**
```cmd
# Jalankan script batch untuk Windows
update-ip.bat

# Kemudian restart container
docker-compose down && docker-compose up --build -d
```

#### Opsi 2: Update Manual

**1. Cari IP address host machine Anda**:

**Windows (Command Prompt):**
```cmd
ipconfig
```
Cari bagian "IPv4 Address" di adapter jaringan yang aktif.

**Windows (PowerShell):**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' }
```

**macOS/Linux:**
```bash
ifconfig | grep -E "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
```

**2. Update file docker-compose.yml**:
Ganti bagian `HOST_IP: "${HOST_IP:-192.168.100.7}"` dengan IP address Anda

**3. Restart container**:
```bash
# Windows/Linux/macOS
docker-compose down && docker-compose up --build -d
```

#### Opsi 3: Environment Variable
```bash
# Set environment variable sebelum menjalankan docker-compose
export HOST_IP="192.168.1.100"
docker-compose up -d
```

### Verifikasi
Setelah update, verifikasi dengan mengunjungi:
- **http://localhost:3000** (untuk akses lokal)
- **http://[IP_HOST]:3000** (untuk akses dari device lain di jaringan yang sama)

Atau cek API endpoint:
```bash
curl http://localhost:3000/api/network-ip
```

### Troubleshooting

#### Jika masih menampilkan IP container Docker (172.x.x.x):
1. Pastikan environment variable `HOST_IP` sudah diset dengan benar
2. Restart container: `docker-compose down && docker-compose up --build -d`
3. Cek logs: `docker-compose logs app`

#### Jika tidak bisa mengakses dari device lain:
1. Pastikan firewall mengizinkan port 3000
2. Pastikan device lain berada di jaringan yang sama
3. Gunakan IP address yang benar (bukan localhost)

#### Masalah Khusus Windows:
- **Docker Desktop tidak start otomatis**
  - Buka Docker Desktop > Settings > General
  - Centang "Start Docker Desktop when you log in"

- **Error: A firewall is blocking file sharing**
  - Buka Windows Defender Firewall > Allow an app or feature
  - Pastikan Docker dan file sharing diizinkan

- **WSL 2 network issues**
  ```cmd
  # Reset WSL network
  wsl --shutdown
  netsh winsock reset
  netsh int ip reset all
  shutdown -r now
  ```

- **Cannot reach container from Windows**
  - Pastikan Docker Desktop > Settings > General > "Expose daemon on tcp://localhost:2375" TIDAK dicentang
  - Gunakan `localhost` atau `127.0.0.1` untuk akses lokal
  - Gunakan IP Windows (dari `ipconfig`) untuk akses dari device lain

- **Git Bash encoding issues**
  ```bash
  # Set encoding di Git Bash
  export LANG=C.UTF-8
  export LC_ALL=C.UTF-8
  ```

### Contoh Skenario

**Skenario 1: Pindah ke WiFi berbeda**
```bash
# Di WiFi baru
./update-ip.sh  # Script akan mendeteksi IP baru otomatis
docker-compose down && docker-compose up --build -d
```

**Skenario 2: Development di berbagai lokasi**
```bash
# Set IP manual untuk lokasi kantor
export HOST_IP="192.168.1.50"
docker-compose up -d

# Set IP manual untuk lokasi rumah
export HOST_IP="192.168.0.100"
docker-compose up -d
```

### File yang Dimodifikasi
- `app/api/network-ip/route.ts` - API endpoint untuk mendapatkan IP jaringan
- `docker-compose.yml` - Konfigurasi Docker dengan environment variable
- `update-ip.sh` - Script helper untuk update IP otomatis (Linux/macOS/Git Bash)
- `update-ip.bat` - Script helper untuk update IP otomatis (Windows Command Prompt)
