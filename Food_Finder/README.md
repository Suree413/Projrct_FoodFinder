# Food Finder

เว็บค้นหาเมนูอาหารจาก TheMealDB พร้อม Search, Category/Area Filter, สุ่มเมนู, รายละเอียดสูตร, เรียงชื่อ A-Z/Z-A ด้วย Selection Sort, รายการบันทึกแบบ Queue (FIFO), ย้อนกลับด้วย Stack (LIFO) และ cache รายละเอียดด้วย Hash Table (Meal ID เป็น Key)

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

- `GET /api/meals` โหลดหรือค้นหา/กรองเมนู
- `GET /api/search?q=chicken` ค้นหาเมนู
- `GET /api/categories` และ `GET /api/areas` โหลดตัวเลือกตัวกรอง
- `GET /api/meals/:id` โหลดรายละเอียดเมนู (cache ตาม Meal ID)
- `GET /api/random` สุ่มเมนูจาก TheMealDB
- `GET /watchlist`, `POST /watchlist`, `DELETE /watchlist/process` จัดการคิว

หน้าเว็บใช้ relative API paths จึงเรียก backend ของ deployment เดียวกันได้ทั้ง localhost และ Vercel ข้อมูลอาหารมาจาก TheMealDB และโหลดเมนูเริ่มต้นเมื่อมี request แรก หาก API ภายนอกไม่ตอบสนอง server ยังเริ่มทำงานได้และ API ส่ง error กลับ

## โครงสร้าง

ชุดแอปที่ใช้งานคือ `server.js`, `public/index.html` และ `public/dashboard.js` ภายในโฟลเดอร์นี้ ไฟล์ชื่อเดียวกันที่ระดับ workspace root เป็นสำเนาเดิมและไม่ได้ถูกใช้เมื่อเริ่มแอปจากโฟลเดอร์ `Food_Finder`.
