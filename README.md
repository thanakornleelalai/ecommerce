# 🛒 E-commerce Admin

แอปแอดมินจัดการ **ลูกค้า / สินค้า / คำสั่งซื้อ** แบบ full-stack
สร้างด้วย **Next.js 15 (App Router) + React 19 + TypeScript + MySQL**

🌐 Demo: [ecommerce-nr9o.vercel.app](https://ecommerce-nr9o.vercel.app)

---

## ⚡ Quick Start (5 นาที)

ทำตาม 5 ขั้นนี้แล้วใช้งานได้เลย:

### 1️⃣ Clone และติดตั้ง

```powershell
git clone https://github.com/thanakornleelalai/ecommerce.git
cd ecommerce
npm install
```

### 2️⃣ เตรียมฐานข้อมูล MySQL

ต้องมี MySQL (local หรือ cloud เช่น TiDB Cloud) — รัน 2 ไฟล์ตามลำดับ:

```powershell
# สร้าง table ทั้งหมด
mysql -u root -P 3307 -p < schema.sql

# ใส่ข้อมูลตัวอย่าง
mysql -u root -P 3307 -p ecommerce < seed.sql
```

> 💡 ถ้าใช้ MySQL Workbench / DBeaver: เปิดไฟล์ `schema.sql` → Execute → จากนั้น `seed.sql` → Execute

### 3️⃣ สร้างไฟล์ `.env.local`

ที่ root ของโปรเจกต์ (ระดับเดียวกับ `package.json`):

```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce
DB_SSL=false
```

> ⚠️ ถ้าใช้ **TiDB Cloud / PlanetScale / Aiven** ให้ตั้ง `DB_SSL=true` และใช้ host/port/user/password ที่ผู้ให้บริการให้มา

### 4️⃣ รันเซิร์ฟเวอร์

```powershell
npm run dev
```

### 5️⃣ เปิดเบราว์เซอร์

👉 [http://localhost:3000](http://localhost:3000)

---

## 📋 สิ่งที่ต้องเตรียม

| สิ่งที่ต้องมี | เวอร์ชัน | ลิงก์ |
|---|---|---|
| Node.js | 20+ | [ดาวน์โหลด](https://nodejs.org) |
| MySQL | 8+ | [ดาวน์โหลด](https://dev.mysql.com/downloads/) หรือ [TiDB Cloud (ฟรี)](https://tidbcloud.com/) |
| Git | ล่าสุด | [ดาวน์โหลด](https://git-scm.com/) |

ตรวจเวอร์ชัน:
```powershell
node -v   # ต้องเป็น v20.x ขึ้นไป
npm -v
```

---

## ✨ ฟีเจอร์

- 👤 **ลูกค้า** — เพิ่ม/แก้ไข/ลบ พร้อมอัปโหลดรูปโปรไฟล์
- 📦 **สินค้า** — เพิ่ม/แก้ไข/ลบ พร้อมราคา, stock, รูปสินค้า
- 🛍️ **คำสั่งซื้อ** — สร้างแบบ **transactional** (ตรวจสต็อก → ตัดสต็อก → rollback ถ้าผิดพลาด)
- 📸 **อัปโหลดรูป** — รับเฉพาะ image, ≤ 5MB
- 🎨 **UI** — Tailwind CSS v4, light theme

---

## 🗂️ โครงสร้างโปรเจกต์

```
ecommerce/
├── app/
│   ├── api/                  # API routes (backend)
│   │   ├── customers/
│   │   ├── products/
│   │   └── orders/
│   ├── customers/            # หน้า UI ลูกค้า
│   ├── products/             # หน้า UI สินค้า
│   ├── orders/               # หน้า UI คำสั่งซื้อ
│   └── page.tsx              # หน้าแรก
├── lib/
│   ├── db.ts                 # MySQL pool + helpers
│   └── upload.ts             # จัดการอัปโหลดรูป
├── public/uploads/           # โฟลเดอร์เก็บรูป (สร้างอัตโนมัติ)
├── schema.sql                # สร้าง table
├── seed.sql                  # ข้อมูลตัวอย่าง
└── package.json
```

---

## 🔧 คำสั่งที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
|---|---|
| `npm run dev` | รัน dev server ที่ port 3000 (Turbopack + hot reload) |
| `npm run build` | Build production |
| `npm start` | รัน production build |
| `npx tsc --noEmit` | ตรวจ TypeScript type |

---

## 🌐 API Endpoints

### Customers — `/api/customers`
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/customers` | ดูทั้งหมด |
| POST | `/api/customers` | เพิ่ม (form-data: `name`, `email`, `image?`) |
| GET | `/api/customers/[id]` | ดูรายเดียว |
| PATCH | `/api/customers/[id]` | แก้ไข |
| DELETE | `/api/customers/[id]` | ลบ |

### Products — `/api/products`
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/products` | ดูทั้งหมด |
| POST | `/api/products` | เพิ่ม (form-data: `name`, `price`, `stock`, `image?`) |
| GET | `/api/products/[id]` | ดูรายเดียว |
| PATCH | `/api/products/[id]` | แก้ไข (เปลี่ยนรูปจะลบรูปเก่าให้) |
| DELETE | `/api/products/[id]` | ลบ |

### Orders — `/api/orders`
| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/orders` | ดูทั้งหมด |
| POST | `/api/orders` | สร้าง (transactional) |
| GET | `/api/orders/[id]` | ดูรายเดียว + รายการสินค้า |
| PATCH | `/api/orders/[id]` | อัปเดต status (`pending` / `paid` / `shipped` / `cancelled`) |
| DELETE | `/api/orders/[id]` | ลบ |

---

## 🗄️ Schema ฐานข้อมูล

```
customers          products          orders            order_items
─────────          ─────────         ─────────         ───────────
id (AI)            id (AI)           id (AI)           id (AI)
name               name              customer_id ──┐   order_id ──┐
email (unique)     price             total          │  product_id  │
image_url          stock             status         │  quantity    │
created_at         image_url         created_at     │  price       │
                   created_at                       │              │
                                                    └─ FK ─────────┘
```

---

## 🚀 Deploy ขึ้น Vercel

### 1. Push โค้ดขึ้น GitHub
```powershell
git push
```

### 2. Import โปรเจกต์เข้า Vercel
ไปที่ [vercel.com/new](https://vercel.com/new) แล้วเลือก repo

### 3. ตั้ง Environment Variables บน Vercel
**Project Settings → Environment Variables** เพิ่มค่าเดียวกับ `.env.local`:

```
DB_HOST=<host จาก cloud DB>
DB_PORT=<port>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=ecommerce
DB_SSL=true
```

> ⚠️ Vercel เป็น serverless — ต้องใช้ **cloud DB** เท่านั้น (เช่น TiDB Cloud) เข้า `localhost` ของเครื่องคุณไม่ได้

> ⚠️ Cloud DB ต้อง allow IP `0.0.0.0/0` เพราะ Vercel ไม่มี fixed IP

> ⚠️ การอัปโหลดรูปแบบ filesystem **ไม่ทำงานบน Vercel** (read-only fs) ถ้าจะใช้บน Vercel ต้องเปลี่ยนไปใช้ Vercel Blob / Cloudinary / S3

---

## 🐛 แก้ปัญหาที่พบบ่อย

<details>
<summary><b>เชื่อม MySQL ไม่ได้ — <code>ECONNREFUSED</code> / <code>Access denied</code></b></summary>

- ตรวจว่า MySQL กำลังรัน: `Get-Service *mysql*`
- เช็ค port ใน `.env.local` ตรงกับของจริง (default = 3306, โปรเจกต์ใช้ 3307)
- ลองเชื่อมด้วย MySQL Workbench ก่อนเพื่อยืนยัน credential
</details>

<details>
<summary><b><code>Table 'ecommerce.customers' doesn't exist</code></b></summary>

ยังไม่ได้รัน `schema.sql` — กลับไปทำ [ขั้นตอนที่ 2](#2️⃣-เตรียมฐานข้อมูล-mysql)
</details>

<details>
<summary><b><code>Field 'id' doesn't have a default value</code> (TiDB Cloud)</b></summary>

Table ถูกสร้างโดยไม่มี `AUTO_INCREMENT` — ต้อง drop และรัน `schema.sql` ใหม่ทั้งหมด
(TiDB ไม่อนุญาตให้แก้ AUTO_INCREMENT ด้วย `ALTER TABLE`)
</details>

<details>
<summary><b>อัปโหลดรูปไม่ขึ้น</b></summary>

- ต้องเป็นไฟล์ภาพและขนาด ≤ 5MB
- ดู error ใน terminal ที่รัน `npm run dev`
- ตรวจสิทธิ์เขียนโฟลเดอร์ `public/uploads/`
- **บน Vercel**: ฟีเจอร์นี้ไม่ทำงาน (อ่าน [Deploy ขึ้น Vercel](#-deploy-ขึ้น-vercel))
</details>

<details>
<summary><b>Port 3000 ถูกใช้แล้ว</b></summary>

แก้ `package.json`:
```json
"dev": "next dev --turbopack -p 3001"
```
</details>

<details>
<summary><b>ใช้ TiDB Cloud / PlanetScale / Aiven</b></summary>

ตั้งใน `.env.local`:
```env
DB_SSL=true
```
แล้วใช้ host / port / user / password ตามที่ผู้ให้บริการให้มา
</details>

---

## 📜 License

ใช้สำหรับการเรียนรู้และพัฒนา — ปรับใช้ได้ตามต้องการ
