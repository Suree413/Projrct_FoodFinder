# Food Finder

เว็บค้นหาเมนูอาหารจาก TheMealDB พร้อม Search, Category/Area Filter, รายละเอียดสูตร, เรียงชื่อ A-Z/Z-A ด้วย Selection Sort, รายการบันทึกแบบ Queue (FIFO), ประวัติการดู/ย้อนกลับแบบ Stack (LIFO) และ cache รายละเอียดด้วย Hash Table (Meal ID เป็น Key)

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

- `GET /meals?sort=selection|insertion|bubble` โหลดเมนูเริ่มต้น; หน้าเว็บใช้ Selection Sort ภายในเพื่อเรียง A-Z/Z-A
- `GET /api/search?q=chicken` ค้นหาเมนู
- `GET /api/categories` และ `GET /api/areas` โหลดตัวเลือกตัวกรอง
- `GET /api/meals?search=chicken&category=Chicken&area=Thai` ค้นหาและกรอง
- `GET /meal/:id` และ `GET /api/meals/:id` โหลดรายละเอียดเมนู (cache ตาม Meal ID)
- `GET /watchlist`, `POST /watchlist`, `DELETE /watchlist/process` จัดการคิว
- `GET /history`, `POST /history` และ `POST /undo` ดู/บันทึกประวัติการเปิดรายละเอียดและย้อนกลับด้วย Stack

ข้อมูลอาหารและรายการ Category/Area มาจาก TheMealDB โดยตรง การค้นหาและตัวกรองจึงต้องเชื่อมต่ออินเทอร์เน็ต

## โครงสร้าง

ชุดแอปที่ใช้งานคือ `server.js`, `public/index.html` และ `public/dashboard.js` ภายในโฟลเดอร์นี้ ไฟล์ชื่อเดียวกันที่ระดับ workspace root เป็นสำเนาเดิมและไม่ได้ถูกใช้เมื่อเริ่มแอปจากโฟลเดอร์ `Food_Finder`.
