# 🛠️ Epic: Pembuatan Starter Framework e-Commerce (Shopify-like)

Berikut adalah daftar tugas (*tasks*) untuk membangun *starter framework* e-commerce *single-store* menggunakan **Vendure** (Backend) dan **React Router 7** (Frontend).

Kamu bebas mengambil *issue* ini secara terpisah. Harap baca deskripsi setiap *issue* dengan teliti!

---

## 📝 Issue 1: Persiapan & Sinkronisasi Database Backend (PostgreSQL)
**Label:** `backend`, `database`, `good first issue`

**Deskripsi:**
Kita perlu memastikan bahwa backend Vendure dapat terhubung dengan database PostgreSQL.
1. Pastikan PostgreSQL berjalan di lokal (bisa menggunakan Docker `docker-compose up -d` jika sudah ada *file* `docker-compose.yml`).
2. Jalankan migrasi dan sinkronisasi awal di Vendure (`npm run dev` atau skrip build Vendure) untuk meng-generate tabel-tabel *default* Vendure di skema `public` PostgreSQL.
3. Pastikan tidak ada *error* saat aplikasi berjalan dan *Admin Dashboard* dapat diakses di `http://localhost:3000/admin`.

**Kriteria Penerimaan (Acceptance Criteria):**
- [x] Database Postgres menerima koneksi.
- [x] Tabel-tabel Vendure berhasil terbuat *(generated)* otomatis.
- [x] *Admin UI* bisa dibuka via *browser*.

---

## 📝 Issue 2: Pembuatan Skrip Seeding / Initial Data (Populate)
**Label:** `backend`, `scripting`

**Deskripsi:**
Supaya kerangka awal ini mirip Shopify (langsung ada isian siap pakai), kita perlu *script* untuk *seeding* struktur produk dan katalog.
1. Buat *file* `src/populate.ts`.
2. Gunakan fungsi `populate()` dari `@vendure/core/cli`.
3. Buat *file* CSV data awal produk, atau konfigurasi minimal yang membuat:
   - 1 Channel (Toko *Single-Store*).
   - Beberapa produk dengan gambar (*dummy*).
4. Tambahkan perintah `"populate": "ts-node ./src/populate.ts"` di `package.json`.

**Kriteria Penerimaan:**
- [ ] Menjalankan `npm run populate` berhasil menambah produk *dummy* ke sistem.
- [ ] Login ke *Admin Dashboard* akan menampilkan riwayat produk.

---

## 📝 Issue 3: Inisialisasi Frontend Storefront dengan React Router 7 + TailwindCSS
**Label:** `frontend`, `ui`

**Deskripsi:**
Kita akan membuat aplikasi *front-end* yang bertindak sebagai etalase (*storefront*). Karena *storefront* ini nantinya akan di-host di Cloudflare, proyek ini wajib diinisialisasi secara **terpisah dari repository backend ini**.
1. Di luar proyek Vendure ini, buat folder / repositori baru (misal: `my-shop-storefront`).
2. Inisialisasi proyek React Router 7 di dalamnya (`npx create-react-router@latest`).
3. Setup dan konfigurasi **TailwindCSS** (ikuti dokumentasi Tailwind untuk proyek Vite/React Router).
4. Pastikan bisa berjalan di repositori terpisah tersebut dengan perintah `npm run dev`.

**Kriteria Penerimaan:**
- [ ] Aplikasi React Router 7 bisa berjalan dan dirender dengan modifikasi dasar.
- [ ] *Class* TailwindCSS bisa berhasil di-*compile* (contoh: `<h1 className="text-3xl font-bold">` tampil dengan benar).

---

## 📝 Issue 4: Setup Koneksi GraphQL dari Storefront ke Backend
**Label:** `frontend`, `integration`

**Deskripsi:**
Storefront harus bisa mengambil data produk dari Backend Vendure.
1. Instal *library* GraphQL client di direktori `storefront` (bisa menggunakan `urql` atau `Apollo Client`).
2. Buat koneksi ke `http://localhost:3000/shop-api`.
3. Buat satu *query* GraphQL sederhana di halaman *Home* (misalnya mengambil daftar `products` 5 baris pertama) dan tampilkan nama-nama produk tersebut di layar menggunakan komponen React.

**Kriteria Penerimaan:**
- [ ] Tidak ada eror CORS (Pastikan Vendure Server mengizinkan CORS *request* dari *port* Storefront).
- [ ] Data produk dari *backend* berhasil dirender di halaman utama frontend secara *headless*.

---

## 📝 Issue 5: Integrasi Payment Gateway Midtrans
**Label:** `backend`, `payment`

**Deskripsi:**
Untuk proses *checkout* toko, kita menggunakan **Midtrans**.
1. Cari *plugin* Midtrans untuk Vendure (jika tidak ada *plugin* resmi, buat *plugin* baru `src/plugins/midtrans-plugin.ts` mengikuti *PaymentMethodHandler* Vendure).
2. Daftarkan *plugin* atau konfigurasi Midtrans ke dalam `src/vendure-config.ts`.
3. Tes siklus pembayaran dengan akun *Sandbox* Midtrans memastikan status order berubah menjadi `PaymentSettled`.

**Kriteria Penerimaan:**
- [ ] *Payment method* 'Midtrans' muncul di GraphQL `eligiblePaymentMethods`.
- [ ] Menyelesaikan fasa pembayaran dengan akun *sandbox* (kartu kredit atau e-money dummy).

---

## 📝 Issue 6: Integrasi Kurir RajaOngkir (by Kommerce)
**Label:** `backend`, `shipping`, `integration`

**Deskripsi:**
Sistem perlu mengkalkulasi tarif ongkos kirim real-time se-Indonesia layaknya Shopify Shipping, menggunakan RajaOngkir by Kommerce.
1. Buat plugin baru `RajaOngkirPlugin` yang mengimplementasikan metode `ShippingCalculator` dari Vendure.
2. Saat menghitung biaya, panggil REST API RajaOngkir secara *asynchronous*.
3. Implementasikan *caching* sederhana agar pemanggilan API tidak terjadi berulang-ulang untuk rute kode pos yang sama dalam jeda waktu singkat.

**Kriteria Penerimaan:**
- [ ] Pilihan kurir dan harga (JNE, Sicepat, dll) merespons dinamis di *Checkout* berdasarkan kode pos asal dan tujuan.
- [ ] Log menunjukkan mekanisme *caching* bekerja sehingga API external tidak dipanggil berulang-ulang kali untuk order yang sama setiap detiknya.

---

## 📝 Issue 7: Pembuatan Plugin SEO & Metadata Custom Fields
**Label:** `backend`, `frontend`, `seo`

**Deskripsi:**
Kita membutuhkan custom metadata untuk pengaturan *Title*, *Description*, dan *OG Image* di entitas Product & Collection layaknya Shopify.
1. Buat/Update konfigurasi plugin Vendure untuk menyuntikkan *Custom Fields* (misal: `seoTitle`, `seoDescription`) pada `Product` dan `Collection`.
2. Di Vendure Storefront (React Router 7), tambahkan tag `<meta>` di dalam kompisisi UI yang dinamis, menarik data custom field tersebut via Shop API / loader.

**Kriteria Penerimaan:**
- [ ] Custom field 'SEO Title' dan 'SEO Description' muncul ketika admin mengedit Produk di Vendure Admin UI.
- [ ] Merender `<title>` dan tag OG secara benar pada SSR/CSR Storefront.

---

## 📝 Issue 8: Sistem Review & Rating Produk
**Label:** `backend`, `frontend`, `feature`

**Deskripsi:**
Seperti Shopify, pembeli dapat memberikan komentar dan rating.
1. Buat `ReviewPlugin` baru menggunakan arsitektur bawaan `@VendurePlugin`.
2. Buat entitas `ProductReviewEntity` dengan kolom text dan score (1-5).
3. Buat mutasi `submitReview` di *Shop API* dan berikan pembatasan (*permission*) khusus.
4. Buat komponen Frontend React Router untuk menampilkan bintang ulasan di halaman daftar dan rincian produk.

**Kriteria Penerimaan:**
- [ ] Fitur kirim ulasan dapat diakses dari front-end.
- [ ] Rata-rata bintang (average score) dari produk terefleksi dengan baik.

---

## 📝 Issue 10: Skeduler Recovery Abandoned Cart
**Label:** `backend`, `cron`, `automation`

**Deskripsi:**
Otomatiskan follow-up email ke pembeli yang masuk ke tahapan check-out namun tidak diselesaikan dalam 24 jam.
1. Konfigurasikan *Cron Job* via plugin Vendure untuk mencari order yang statis (abandoned).
2. Tembakkan *Event* email recovery.

**Kriteria Penerimaan:**
- [ ] *Cron task* berjalan sesuai jadwal dan bisa mendeteksi *abandoned orders*.
- [ ] Terlihat log simulasi pengiriman email *Recovery Link* ke customer.

---

## 📝 Issue 10: Plugin Manual Bank Transfer & Verification
**Label:** `backend`, `frontend`, `payment`

**Deskripsi:**
Menyediakan opsi pembayaran manual (transfer bank lokal) beserta fitur unggah bukti bayar.
1. Buat `PaymentMethodHandler` kustom untuk Manual Transfer.
2. Tambahkan *mutation* di Shop API untuk mengunggah URL/lampiran bukti transfer ke data `Order`.
3. Tambahkan halaman ekstensi di Admin UI agar admin bisa menekan tombol `Settle Payment` setelah memverifikasi mutasi rekening.

**Kriteria Penerimaan:**
- [ ] Pembeli bisa memilih opsi 'Manual Transfer' saat checkout dan mengunggah gambar bukti bayar.
- [ ] Admin memiliki antarmuka untuk melihat bukti bayar dan mengubah transaksi menjadi dikonfirmasi (Settled).

---
*Catatan untuk Programmer:* Jika ada kesulitan terkait arsitektur Vendure, pastikan Anda membaca pedoman di `PRD.md` dan menjelajahi skema API di `http://localhost:3000/shop-api` menggunakan Apollo Studio / interface GraphiQL bawaan Vendure.*
