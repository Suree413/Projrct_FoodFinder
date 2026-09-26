# Food Finder

เว็บค้นหาเมนูอาหารจาก TheMealDB พร้อมค้นหาและกรองเมนู, เรียงลำดับด้วย Selection/Insertion/Bubble Sort, คิวเมนูแบบ FIFO และประวัติ/Undo แบบ Stack

## เริ่มต้น

ใช้ Node.js 18 ขึ้นไป จากโฟลเดอร์ `Food_Finder`:

```powershell
cd Food_Finder
npm install
npm start
```

เปิด `http://localhost:3000` หากพอร์ต 3000 ถูกใช้งาน สามารถเลือกพอร์ตอื่นได้:

```powershell
$env:PORT=3001
npm start
```

## API

- `GET /meals?sort=selection|insertion|bubble` โหลดเมนูเริ่มต้นและเรียงลำดับ
- `GET /api/search?q=chicken` ค้นหาเมนู
- `GET /api/categories` และ `GET /api/areas` โหลดตัวเลือกตัวกรอง
- `GET /api/meals?search=chicken&category=Chicken&area=Thai` ค้นหาและกรอง
- `GET /api/meals/:id` โหลดรายละเอียดเมนู
- `GET /watchlist`, `POST /watchlist`, `DELETE /watchlist/process` จัดการคิว
- `GET /history` และ `POST /undo` ดูประวัติและย้อนการกระทำล่าสุด

ข้อมูลอาหารและรายการ Category/Area มาจาก TheMealDB โดยตรง การค้นหาและตัวกรองจึงต้องเชื่อมต่ออินเทอร์เน็ต

## โครงสร้าง

ชุดแอปที่ใช้งานคือ `server.js`, `public/index.html` และ `public/dashboard.js` ภายในโฟลเดอร์นี้ ไฟล์ชื่อเดียวกันที่ระดับ workspace root เป็นสำเนาเดิมและไม่ได้ถูกใช้เมื่อเริ่มแอปจากโฟลเดอร์ `Food_Finder`.
