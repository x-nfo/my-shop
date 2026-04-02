# Product Requirements Document (PRD)
**Project Name:** Shopify-like Starter Framework (Single-Store)
**Tech Stack:** Vendure (Backend), PostgreSQL, React Router v7 (Frontend Storefront), TailwindCSS, Midtrans (Payment).

## 1. Project Overview
Proyek ini bertujuan untuk membangun sebuah *starter framework e-commerce* yang sangat mudah digunakan, meniru pengalaman instalasi dan manajemen *single-store* dari Shopify. Backend berjalan secara *headless* menggunakan Vendure + PostgreSQL, dan Frontend Storefront menggunakan React Router v7 untuk *routing* berbasis data yang cepat dan dinamis.

## 2. Arsitektur & Teknologi
- **Backend:** Node.js, TypeScript, NestJS, `@vendure/core`
- **Database:** PostgreSQL (dengan migrasi otomatis TypeORM)
- **Storefront:** React Router v7 (Data Mode), TailwindCSS
- **Payment Gateway:** Midtrans (melalui Vendure Plugin kustom)

### 2.1. Standar Struktur Folder (Keterpisahan Penuh / Multi-Repo)
Karena *Storefront* akan di-*hosting* ke platform peladen *Edge* (khususnya **Cloudflare Pages / Workers**), kita akan menggunakan model repositori terpisah secara fisik (**Multi-Repo Architecture**). Artinya, kode Backend Vendure dan Frontend React Router tidak boleh berada di repositori Git yang sama.

**Repository A: Backend Vendure (`my-shop-backend/`)**
```text
my-shop-backend/
├── src/                    # Direktori utama Backend Vendure
│   ├── plugins/            # Plugin kustom (Midtrans, Review, Manual Transfer, RajaOngkir)
│   ├── populate.ts         # Skrip seeder/initial data ala Shopify
│   ├── vendure-config.ts   # Core config Vendure (Registrasi plugin & koneksi DB)
│   └── index.ts            # Entry point backend node server
├── static/                 # Aset statis backend (image produk, pdf, template email)
├── .env                    # Variabel konfigurasi lingkungan Backend
├── docker-compose.yml      # Orkestrasi lokal untuk base infrastructure (Postges Database)
└── package.json            # Master dependencies untuk vendure backend
```

**Repository B: Frontend Storefront (`my-shop-storefront/`)**
```text
my-shop-storefront/
├── app/                
│   └── routes/             # Routing URL untuk katalog dan checkout berbasis React Router v7
├── package.json            # Dependencies React Router v7 & Tailwind
├── wrangler.toml           # (Disiapkan nanti) Konfigurasi Cloudflare
└── vite.config.ts          # Build config untuk Cloudflare
```

**Alasan Keterpisahan Penuh:**
1. **Aturan Platform Deployment:** Cloudflare Pages sangat optimal jika dihubungkan langsung dengan sebuah repositori Git *Front-end* murni agar CI/CD-nya membaca spesifikasi `vite` atau `wrangler` tanpa terganggu *file* server Node.js.
2. Keamanan: Terlindungnya variabel dan aset infrastruktur backend agar tidak tercampur dengan repositori kode publik/frontend.

---

## 3. Vendure Backend Best Practices

Berdasarkan standarisasi *skill* Vendure, semua *developer* **WAJIB** mematuhi aturan berikut dalam membangun *plugin* maupun Modul API.

### 3.1. Plugin Writing Patterns
**Diharuskan (REQUIRED):**
- Menggunakan dekorator `@VendurePlugin()` dengan metadata yang tepat (`imports: [PluginCommonModule]`).
- Menggunakan metode konfigurasi statis `static init(options: MyPluginOptions)` dengan nilai *default* (sensible defaults).
- Menggunakan injeksi dependensi via *constructor* untuk servis (Dekorator `@Injectable()`).
- Memanfaatkan *Lifecycle hooks* NestJS (seperti `OnApplicationBootstrap`) untuk inisialisasi strategi atau proses *background task*.

**Dilarang (FORBIDDEN):**
- Menulis nilai *hardcoded* (gunakan variabel konfigurasi plugin).
- Melakukan akses *query database* secara langsung melewati/tanpa Service Controller.
- Membuat instansiasi *class* strategi di dalam *constructor* (gunakan *Injector* pada saat `OnApplicationBootstrap`).
- Menghilangkan `async/await` di dalam eksekusi *lifecycle hooks*.

### 3.2. GraphQL API Patterns
**Diharuskan (REQUIRED):**
- Selalu pisahkan *schema* menjadi dua file/variabel: `graphqlAdminSchema` (Full Access) dan `graphqlShopSchema` (Customer-facing/Terbatas).
- **RequestContext:** Menggunakan parameter `@Ctx() ctx: RequestContext` pada argumen PERTAMA di semua fungsi `Resolver`. Konteks ini wajib dioper (*threaded*) ke setiap panggilan servis (*service calls*).
- **Mutations:** Tambahkan dekorator `@Transaction()` pada operasi mutasi (*create/update/delete*) agar aman dari *race conditioning*.
- **InputMaybe Handling:** GraphQL mengenerate `InputMaybe<T>`. Karena sebuah input bisa bernilai null atau dibiarkan kosong, maka **WAJIB** mengecek keduanya:
  ```typescript
  if (input.name !== undefined && input.name !== null) { ... }
  ```
- Selalu gunakan perlindungan dekorator `@Allow(Permission.NAMA_PERMISSION)` pada kueri dan mutasi.

**Dilarang (FORBIDDEN):**
- Mengirimkan atau me-*return* entitas mentah tanpa pengetikan `Resolver` yang tepat.
- Mencampur tipe data Shop dan Admin dalam file *Schema* yang sama.
- Lupa menangani kondisi eksepsi (seperti pemanggilan `throw new UserInputError()`).

---

## 4. Frontend Storefront Best Practices (React Router v7)

Untuk Front-End React, proyek ini akan menggunakan konsep **Data-driven Routing** dari React Router v7.

### 4.1 Route Configuration (Data Mode)
- **Instansiasi Router:** Gunakan `<RouterProvider>` bersama fungsi `createBrowserRouter` di level akar proyek.
- **Nested Outlet:** Tata letak antarmuka (Layout UI) yang digunakan berulang seperti `Header` & `Footer` diekstraksi ke root dan perenderan halaman akan disuntikkan ke `<Outlet />`.

### 4.2 Manajemen Data & Interaksi
- **Loader vs useEffect:**
  - **Loader (`loader: productLoader`):** Gunakan fungsi *Loader* bawaan *Router* saat membutuhkan data *sebelum* halaman dirender, *server-side fetch*, atau untuk validasi awal.
  - **`useEffect`:** HANYA gunakan untuk mengambil data yang bergantung eksklusif pada *state client-side* setelah halaman dirender, atau proses *subscription* (misalnya mendengarkan *event webhook* Midtrans via Socket).
- **Mutasi Data:**
  - Fungsi perpindahan URL saat data berubah (seperti pendaftaran, hapus item cart besar-besaran) WAJIB menggunakan `<Form>`.
  - Fungsi mutasi ringan dalam satu porsi UI tanpa merubah URL/History (seperti *update quantity item cart* / interaksi *popover* *add-to-cart*) HANYA BOLEH menggunakan hook `useFetcher()`.

---

## 5. Alur Kerja (Workflow) Implementasi

1. **Sinkronisasi Database**: Jalankan container PostgreSQL, sinkronisasi *schema* entitas Vendure standar.
2. **Pembuatan Skrip Populate**: Tulis `src/populate.ts` meniru Shopify dengan *dummy data*.
3. **Konfigurasi Plugin Kustom**: Pembuatan integrasi *MidtransPlugin* mengacu pada "Plugin Writing Patterns" (tanpa variabel *hardcoded* dan harus menggunakan *Injector* NestJS).
4. **Scaffolding React Router v7**: Instalasi proyek Front-end React Router 7 lengkap dengan konfigurasi *Tailwind CSS*.
5. **Integrasi GraphQL ke Storefront**: Implementasi GraphQL Client (Apollo/URQL) menggunakan *loader* dari React Router untuk me-*request* data katalog publik ke `http://localhost:3000/shop-api` dengan mematuhi metode "InputMaybe Handling".

---

## 6. Daftar Plugin Shopify-like (Target Eksekusi Junior Dev / AI Agent)

Untuk mengejar fungsionalitas yang setara dengan platform *single-store* Shopify, serahkan pengerjaan *plugin-plugin* modular berikut kepada *Junior Developer* atau *AI Agent*. Masing-masing plugin harus dibangun dengan standar ketat yang telah dijelaskan di Bab 3.

### 6.1. SEO & Metadata Plugin
- **Fungsi (Shopify Analogue):** Kemampuan untuk menspesifikasi *Custom Page Title*, *Meta Description*, dan *OpenGraph (OG) Images* di setiap entitas Produk dan Koleksi (Collection).
- **Implementasi Vendure:**
  - Ekstensi *Custom Fields* pada `Product` dan `Collection`.
  - Modifikasi GraphQL Shop API agar *Frontend* bisa menarik data meta SEO pada saat proses `loader` React Router.

### 6.2. Product Reviews & Ratings Plugin
- **Fungsi (Shopify Analogue):** Memungkinkan pelanggan memberikan *rating* bintang 1-5 dan ulasan berbentuk teks yang menempel kuat pada katalog produk.
- **Implementasi Vendure:**
  - Membuat entitas baru `ProductReviewEntity`.
  - Membuat mutasi Shop API `submitProductReview`.
  - Menghitung agregat *average rating* secara komputasional (*Field Resolver* atau *Subscriber*) pada entitas Produk agar respons GraphQL tetap ringan.
  - Halaman Admin UI (React extension) khusus untuk menyetujui (Approve) atau menolak ulasan yang masuk.

### 6.3. Midtrans Local Payment Gateway Plugin
- **Fungsi (Shopify Analogue):** Pengganti *Shopify Payments* untuk lokalisasi transaksi e-commerce secara instan (Virtual Account, Mandiri Bill, GoPay).
- **Implementasi Vendure:**
  - Pembuatan `PaymentMethodHandler` resmi yang bisa diverifikasi status bayarnya via Webhook.
  - Implementasi *controller* standar NestJS (`@Controller('midtrans')`) untuk *listening incoming webhook* dari server Midtrans tanpa *auth*.

### 6.4. Manual Bank Transfer Verification Plugin
- **Fungsi (Shopify Analogue):** Pilihan pembayaran manual (Manual Payment Methods) di mana pelanggan mengunggah bukti transfer, dan Admin menyetujui (Settle) pesanan secara manual dari Dashboard.
- **Implementasi Vendure:**
  - Pembuatan `PaymentMethodHandler` kustom untuk *Manual Bank Transfer*.
  - Menambahkan *custom field* pada pesanan atau mutasi khusus agar pelanggan dapat mengunggah URL/foto bukti bayar.
  - Penambahan komponen Admin UI Vendure untuk memverifikasi bukti dan mengubah status pembayaran menjadi `PaymentSettled` secara manual.

### 6.5. RajaOngkir (by Kommerce) Shipping Integration
- **Fungsi (Shopify Analogue):** Integrasi API pengecekan tarif ongkos kirim ke seluruh area Indonesia secara instan (real-time couriers) layaknya Shopify Shipping, memanfaatkan layanan **RajaOngkir by Kommerce**.
- **Implementasi Vendure:**
  - Pembuatan kustom `ShippingCalculator` *(asynchronous)* yang akan memanggil API RajaOngkir saat kalkulasi order atau saat metode pengiriman (*ShippingMethod*) dipilih oleh pelanggan.
  - Implementasi strategi *caching* ringan agar tarif untuk rute kodepos/kecamatan yang sama tidak perlu memanggil API berulang-ulang ketika pelanggan menambah/mengurangi keranjang.
  - Akumulasi secara dinamis menggunakan atribut berat atau dimensi barang dari `CustomFields` di data Produk.

### 6.6. Abandoned Cart Recovery Plugin
- **Fungsi (Shopify Analogue):** Sistem *email automation* (pengingat otomatis) kepada pelanggan yang sudah sampai tahap *checkout* namun tidak melunasi pembayaran dalam X jam.
- **Implementasi Vendure:**
  - Menggunakan *Cron Job / Scheduler* bawaan plugin: `DefaultJobQueuePlugin`.
  - Mencari *Order Object* yang nyangkut di state `AddingItems` atau `ArrangingPayment` dan *timeout* sudah melebihi 24 jam.
  - Memicu *Email Event* agar pelanggan menerima link pemulihan *cart*.

> **Instruksi untuk Eksekusi:** Saat *Junior Dev/AI* mengambil antrean pengerjaan daftar di atas, **selalu** rujuk pada dokumen pedoman "Vendure Plugin Writing" untuk mencegah kebocoran koneksi manipulasi `Repository` dan men-standarkan penggunaan `RequestContext` pada semua operasi *Database*.
