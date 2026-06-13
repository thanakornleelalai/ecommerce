# E-commerce Admin App

แอปพลิเคชันแอดมินสำหรับร้านค้าออนไลน์ (E-commerce) แบบ full-stack สร้างด้วย **Next.js 15 (App Router)** + **React 19** + **TypeScript** เชื่อมต่อฐานข้อมูล **MySQL** ผ่าน `mysql2`
รองรับการจัดการ **ลูกค้า (Customers)**, **สินค้า (Products)** และ **คำสั่งซื้อ (Orders)** แบบ CRUD พร้อมระบบอัปโหลดรูปภาพ และอัปเดตสถานะคำสั่งซื้อ

---

## สารบัญ

1. [คุณสมบัติของระบบ](#คุณสมบัติของระบบ)
2. [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
3. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
4. [สิ่งที่ต้องเตรียมก่อนเริ่มต้น](#สิ่งที่ต้องเตรียมก่อนเริ่มต้น)
5. [ขั้นตอนการติดตั้งแบบละเอียด](#ขั้นตอนการติดตั้งแบบละเอียด)
6. [การตั้งค่าฐานข้อมูล MySQL](#การตั้งค่าฐานข้อมูล-mysql)
7. [การตั้งค่าไฟล์ Environment (.env.local)](#การตั้งค่าไฟล์-environment-envlocal)
8. [การรันโปรเจกต์](#การรันโปรเจกต์)
9. [คำสั่ง npm ที่ใช้บ่อย](#คำสั่ง-npm-ที่ใช้บ่อย)
10. [API Endpoints ทั้งหมด](#api-endpoints-ทั้งหมด)
11. [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
12. [การอัปโหลดรูปภาพ](#การอัปโหลดรูปภาพ)
13. [การแก้ปัญหาที่พบบ่อย (Troubleshooting)](#การแก้ปัญหาที่พบบ่อย-troubleshooting)

---

## คุณสมบัติของระบบ

- **จัดการลูกค้า**: เพิ่ม / ดู / แก้ไข / ลบ ลูกค้า พร้อมอัปโหลดรูปโปรไฟล์
- **จัดการสินค้า**: เพิ่ม / ดู / แก้ไข / ลบ สินค้า พร้อมราคา จำนวนคงเหลือ (stock) และรูปสินค้า
- **จัดการคำสั่งซื้อ**:
  - สร้างคำสั่งซื้อแบบ **Transactional** (ตรวจสต็อก → ตัดสต็อก → บันทึก ถ้าผิดพลาดจะ rollback อัตโนมัติ)
  - อัปเดตสถานะคำสั่งซื้อ (`pending` → `paid` → `shipped` / `cancelled`)
- **อัปโหลดรูปภาพ** ลงโฟลเดอร์ `public/uploads/` พร้อมตรวจสอบประเภทไฟล์และขนาด (≤ 5MB)
- **Light theme เท่านั้น** (ยังไม่มี dark mode)

---

## เทคโนโลยีที่ใช้

| หมวด | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (config-less) |
| Database | MySQL 8 (รองรับ TiDB Cloud / Managed MySQL ผ่าน SSL) |
| Bundler | Turbopack (ทั้ง `dev` และ `build`) |
| ไลบรารีหลัก | `mysql2/promise` |

---

## โครงสร้างโปรเจกต์

```
ecommerce/
├── app/                        # Next.js App Router
│   ├── api/                    # API Route Handlers (Backend)
│   │   ├── customers/          # CRUD ลูกค้า
│   │   ├── products/           # CRUD สินค้า
│   │   └── orders/             # CRUD คำสั่งซื้อ (transactional)
│   ├── customers/              # หน้า UI จัดการลูกค้า
│   ├── products/               # หน้า UI จัดการสินค้า
│   ├── orders/                 # หน้า UI จัดการคำสั่งซื้อ
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # หน้าแรก
│   └── globals.css             # Tailwind v4 imports
├── lib/
│   ├── db.ts                   # Singleton MySQL pool + query helpers + types
│   └── upload.ts               # ตัวจัดการอัปโหลด/ลบไฟล์รูปภาพ
├── public/
│   └── uploads/                # โฟลเดอร์เก็บรูปที่ผู้ใช้อัปโหลด (สร้างอัตโนมัติ)
├── schema.sql                  # สคริปต์สร้างตาราง
├── seed.sql                    # สคริปต์ใส่ข้อมูลตัวอย่าง
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs          # Tailwind v4 plugin
└── package.json
```

---

## สิ่งที่ต้องเตรียมก่อนเริ่มต้น

ก่อนเริ่มติดตั้ง โปรดเตรียม:

1. **Node.js เวอร์ชัน 20 ขึ้นไป** ([ดาวน์โหลด](https://nodejs.org))
   - ตรวจสอบด้วยคำสั่ง:
     ```powershell
     node -v
     npm -v
     ```
2. **MySQL 8** ติดตั้งบนเครื่อง หรือใช้บริการ Cloud (เช่น TiDB Cloud)
   - ค่าเริ่มต้นของโปรเจกต์ใช้ port **3307** (เพราะมักจะติดตั้ง MySQL ตัวที่สองคู่กับตัวเดิม) — สามารถเปลี่ยนได้ใน `.env.local`
3. **Git** (ถ้าจะ clone โปรเจกต์)
4. **เครื่องมือจัดการ MySQL** เช่น MySQL Workbench, DBeaver, หรือ HeidiSQL (จะใช้ command line ก็ได้)

---

## ขั้นตอนการติดตั้งแบบละเอียด

### ขั้นตอนที่ 1 — Clone หรือดาวน์โหลดโปรเจกต์

```powershell
git clone <your-repo-url> ecommerce
cd ecommerce
```

### ขั้นตอนที่ 2 — ติดตั้ง dependencies

```powershell
npm install
```

คำสั่งนี้จะติดตั้งทุกอย่างที่ระบุไว้ใน `package.json` (Next.js, React, mysql2, Tailwind ฯลฯ)

### ขั้นตอนที่ 3 — เตรียมฐานข้อมูล MySQL

ดู [การตั้งค่าฐานข้อมูล MySQL](#การตั้งค่าฐานข้อมูล-mysql) ด้านล่าง

### ขั้นตอนที่ 4 — สร้างไฟล์ `.env.local`

ดู [การตั้งค่าไฟล์ Environment](#การตั้งค่าไฟล์-environment-envlocal) ด้านล่าง

### ขั้นตอนที่ 5 — รันเซิร์ฟเวอร์

```powershell
npm run dev
```

แล้วเปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## การตั้งค่าฐานข้อมูล MySQL

โปรเจกต์มาพร้อมสคริปต์ 2 ไฟล์:

- `schema.sql` — สร้างฐานข้อมูล `ecommerce` และตารางทั้งหมด (customers, products, orders, order_items)
- `seed.sql` — ใส่ข้อมูลตัวอย่างไว้ทดสอบ

### วิธีรันสคริปต์ผ่าน command line

```powershell
# สร้างโครงสร้างตาราง
mysql -u root -P 3307 -p < schema.sql

# ใส่ข้อมูลตัวอย่าง
mysql -u root -P 3307 -p < seed.sql
```

> เปลี่ยน `-P 3307` ให้ตรงกับ port ของ MySQL ของคุณ (ค่าเริ่มต้น MySQL คือ 3306)

### วิธีรันผ่าน MySQL Workbench / DBeaver

1. เปิดไฟล์ `schema.sql` → Execute (รันทั้งไฟล์)
2. เปิดไฟล์ `seed.sql` → Execute

### ตรวจสอบว่าสำเร็จ

```sql
USE ecommerce;
SHOW TABLES;
-- ควรเห็น: customers, order_items, orders, products

SELECT * FROM customers LIMIT 5;
```

---

## การตั้งค่าไฟล์ Environment (.env.local)

สร้างไฟล์ชื่อ **`.env.local`** ไว้ที่ราก (root) ของโปรเจกต์ (ระดับเดียวกับ `package.json`) แล้วใส่ค่าตามนี้:

```env
# ---- การเชื่อมต่อ MySQL ----
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ecommerce

# ---- ถ้าใช้ TiDB Cloud หรือ Managed MySQL ที่บังคับ SSL ----
# DB_SSL=true
```

### คำอธิบายแต่ละตัวแปร

| ตัวแปร | ค่าเริ่มต้นในโค้ด | คำอธิบาย |
|--------|------------------|----------|
| `DB_HOST` | `localhost` | ที่อยู่เซิร์ฟเวอร์ MySQL |
| `DB_PORT` | `3306` | พอร์ตของ MySQL (โปรเจกต์ตั้งเป็น 3307) |
| `DB_USER` | `root` | ชื่อผู้ใช้ |
| `DB_PASSWORD` | `""` | รหัสผ่าน |
| `DB_NAME` | `ecommerce` | ชื่อฐานข้อมูล |
| `DB_SSL` | `false` | ตั้งเป็น `true` ถ้าต้องเชื่อมแบบ SSL |

> **สำคัญ**: อย่า commit ไฟล์ `.env.local` ขึ้น git (ปกติจะถูก ignore ใน `.gitignore` อยู่แล้ว)

---

## การรันโปรเจกต์

### โหมดพัฒนา (Development)

```powershell
npm run dev
```

- เปิดเซิร์ฟเวอร์ที่ [http://localhost:3000](http://localhost:3000)
- ใช้ **Turbopack** + Hot Reload (แก้โค้ดแล้วเบราว์เซอร์อัปเดตเอง)

### โหมด Production

```powershell
npm run build   # สร้าง production build
npm start       # รัน build ที่สร้างไว้
```

---

## คำสั่ง npm ที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
|-------|--------|
| `npm run dev` | รันเซิร์ฟเวอร์โหมดพัฒนา (Turbopack) ที่ port 3000 |
| `npm run build` | Build โปรเจกต์เพื่อขึ้น production |
| `npm start` | รันเวอร์ชัน production (ต้อง build ก่อน) |
| `npx tsc --noEmit` | ตรวจ type โดยไม่สร้างไฟล์ (ไม่มี script ใน package.json) |

> โปรเจกต์นี้ **ไม่มี** lint / test script

---

## API Endpoints ทั้งหมด

ทุก endpoint คืนค่าเป็น JSON ผ่าน `NextResponse` และตั้งเป็น `force-dynamic`

### Customers — `/api/customers`

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/customers` | ดูรายการลูกค้าทั้งหมด |
| POST | `/api/customers` | เพิ่มลูกค้าใหม่ (รับ `multipart/form-data`: `name`, `email`, `image?`) |
| GET | `/api/customers/[id]` | ดูลูกค้ารายเดียว |
| PATCH | `/api/customers/[id]` | แก้ไขลูกค้า (รับ `multipart/form-data`) |
| DELETE | `/api/customers/[id]` | ลบลูกค้า |

### Products — `/api/products`

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/products` | ดูรายการสินค้าทั้งหมด |
| POST | `/api/products` | เพิ่มสินค้า (รับ `multipart/form-data`: `name`, `price`, `stock`, `image?`) |
| GET | `/api/products/[id]` | ดูสินค้ารายเดียว |
| PATCH | `/api/products/[id]` | แก้ไขสินค้า (เปลี่ยนรูปจะลบรูปเก่าให้อัตโนมัติ) |
| DELETE | `/api/products/[id]` | ลบสินค้า |

### Orders — `/api/orders`

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/api/orders` | ดูรายการคำสั่งซื้อ |
| POST | `/api/orders` | สร้างคำสั่งซื้อใหม่ (Transactional: ตรวจสต็อก/ตัดสต็อก/rollback ถ้าผิดพลาด) |
| GET | `/api/orders/[id]` | ดูคำสั่งซื้อรายเดียวพร้อมรายการสินค้า |
| PATCH | `/api/orders/[id]` | อัปเดตสถานะ (`pending` / `paid` / `shipped` / `cancelled`) |
| DELETE | `/api/orders/[id]` | ลบคำสั่งซื้อ |

---

## โครงสร้างฐานข้อมูล

มี 4 ตารางหลัก:

### `customers`
| Field | Type | หมายเหตุ |
|-------|------|---------|
| id | INT (PK, AUTO_INCREMENT) | |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| image_url | VARCHAR(500) | nullable |
| created_at | TIMESTAMP | default NOW() |

### `products`
| Field | Type | หมายเหตุ |
|-------|------|---------|
| id | INT (PK) | |
| name | VARCHAR(255) | NOT NULL |
| price | DECIMAL(10,2) | default 0.00 |
| stock | INT | default 0 |
| image_url | VARCHAR(500) | nullable |
| created_at | TIMESTAMP | default NOW() |

### `orders`
| Field | Type | หมายเหตุ |
|-------|------|---------|
| id | INT (PK) | |
| customer_id | INT (FK → customers.id) | ON DELETE CASCADE |
| total | DECIMAL(10,2) | |
| status | VARCHAR(50) | default `'pending'` |
| created_at | TIMESTAMP | |

### `order_items`
| Field | Type | หมายเหตุ |
|-------|------|---------|
| id | INT (PK) | |
| order_id | INT (FK → orders.id) | ON DELETE CASCADE |
| product_id | INT (FK → products.id) | ON DELETE RESTRICT |
| quantity | INT | |
| price | DECIMAL(10,2) | ราคา ณ เวลาสั่งซื้อ |

---

## การอัปโหลดรูปภาพ

- ตัวจัดการอยู่ที่ [lib/upload.ts](lib/upload.ts)
- ไฟล์ที่อัปโหลดจะถูกบันทึกลงโฟลเดอร์ **`public/uploads/`** (สร้างให้อัตโนมัติเมื่อรันครั้งแรก)
- ตั้งชื่อไฟล์เป็น hex แบบสุ่ม เพื่อกันชื่อซ้ำ
- เข้าถึงรูปจากเว็บได้ทาง `/uploads/<filename>`
- **ข้อจำกัด**:
  - ต้องเป็นไฟล์ภาพ (`image/*`) เท่านั้น
  - ขนาดไม่เกิน **5 MB**
- หน้า UI ของ customers และ products ส่งข้อมูลแบบ `FormData` (ไม่ใช่ JSON) และโชว์ thumbnail ในตาราง

---

## การแก้ปัญหาที่พบบ่อย (Troubleshooting)

### 1. เชื่อมต่อ MySQL ไม่ได้ — `ECONNREFUSED` หรือ `Access denied`
- ตรวจว่า MySQL กำลังรันอยู่: `Get-Service *mysql*` (PowerShell)
- ตรวจ port ใน `.env.local` ตรงกับ MySQL ของจริง (3306 หรือ 3307)
- ลองเชื่อมด้วย MySQL client ก่อนเพื่อยืนยัน user/password

### 2. หน้าเว็บโชว์ error `Table 'ecommerce.customers' doesn't exist`
- ยังไม่ได้รัน `schema.sql` → กลับไปดู [การตั้งค่าฐานข้อมูล MySQL](#การตั้งค่าฐานข้อมูล-mysql)

### 3. อัปโหลดรูปไม่ขึ้น
- เช็คว่าไฟล์เป็นภาพและขนาดไม่เกิน 5MB
- ดู error ใน console ของเซิร์ฟเวอร์ (terminal ที่รัน `npm run dev`)
- ตรวจว่า process มีสิทธิ์เขียนโฟลเดอร์ `public/uploads/`

### 4. Port 3000 ถูกใช้แล้ว
แก้ไข script ใน `package.json`:
```json
"dev": "next dev --turbopack -p 3001"
```

### 5. ใช้ TiDB Cloud / Aiven / PlanetScale
ตั้งใน `.env.local`:
```env
DB_SSL=true
```
แล้วใช้ host/port/user/password ที่ผู้ให้บริการให้มา

### 6. การ typecheck
```powershell
npx tsc --noEmit
```

---

## License

โปรเจกต์นี้ใช้สำหรับการเรียนรู้และพัฒนาภายใน — ปรับใช้ได้ตามต้องการ
