// =====================================================================
// 801201 Week 8
// Sort (W5) + Queue (W6) + Stack (W8)
// Search + API + TheMealDB
// =====================================================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// =====================================================================
// MIDDLEWARE
// =====================================================================

app.use(express.json());

// หน้าเว็บอยู่ใน public
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
// THEMEALDB API
// =====================================================================

const THEMEALDB_BASE =
  'https://www.themealdb.com/api/json/v1/1';

// =====================================================================
// ตัวแปรเก็บข้อมูล
// =====================================================================

let meals = [];

// =====================================================================
// ฟังก์ชันเรียก API แบบปลอดภัย
// =====================================================================

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Meal-Dashboard-Student-Project'
    }
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('API ส่งข้อมูลที่ไม่ใช่ JSON:');
    console.error(text.substring(0, 300));
    throw new Error('TheMealDB ไม่ได้ส่งข้อมูล JSON กลับมา');
  }
}

// =====================================================================
// LOAD MEALS
// โหลดเมนูไทยสำหรับหน้าแรก
// =====================================================================

async function loadMeals() {
  try {
    console.log('');
    console.log('====================================');
    console.log('กำลังโหลดเมนูอาหารไทยจาก TheMealDB');
    console.log('====================================');

    const data = await fetchJSON(
      `${THEMEALDB_BASE}/filter.php?a=Thai`
    );

    if (!data || !data.meals) {
      throw new Error('ไม่พบข้อมูลเมนูอาหารไทยจาก API');
    }

    const thaiMeals = data.meals.slice(0, 50);

    console.log(`พบข้อมูลทั้งหมด ${data.meals.length} เมนู`);
    console.log(`นำมาใช้ในโปรเจกต์ ${thaiMeals.length} เมนู`);

    meals = thaiMeals.map(meal => ({
      id: Number(meal.idMeal),
      name: meal.strMeal,
      category: 'Thai Food',
      area: 'Thai',
      instructions: '',
      image: meal.strMealThumb
    }));

    console.log(`โหลดข้อมูลสำเร็จ ${meals.length} เมนู`);
    console.log('====================================');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร');
    console.error(error.message);
    console.error('');
    meals = [];
  }
}

// =====================================================================
// SORT
// =====================================================================

function selectionSort(arr) {
  const a = [...arr];

  for (let i = 0; i < a.length - 1; i++) {
    let minIndex = i;

    for (let j = i + 1; j < a.length; j++) {
      if (
        a[j].name.toLowerCase() <
        a[minIndex].name.toLowerCase()
      ) {
        minIndex = j;
      }
    }

    [a[i], a[minIndex]] = [a[minIndex], a[i]];
  }

  return a;
}

function insertionSort(arr) {
  const a = [...arr];

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;

    while (
      j >= 0 &&
      a[j].name.toLowerCase() > key.name.toLowerCase()
    ) {
      a[j + 1] = a[j];
      j--;
    }

    a[j + 1] = key;
  }

  return a;
}

function bubbleSort(arr) {
  const a = [...arr];

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (
        a[j].name.toLowerCase() >
        a[j + 1].name.toLowerCase()
      ) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  }

  return a;
}

// =====================================================================
// Helper: แปลงข้อมูล TheMealDB
// =====================================================================

function normalizeMeal(meal) {
  return {
    id: Number(meal.idMeal),
    name: meal.strMeal,
    category: meal.strCategory || '',
    area: meal.strArea || '',
    instructions: meal.strInstructions || '',
    image: meal.strMealThumb || ''
  };
}

// =====================================================================
// API /meals
// Sort เดิมของโปรเจกต์
// =====================================================================

app.get('/meals', (req, res) => {
  try {
    const algorithm = req.query.sort || 'selection';

    const start = performance.now();

    let sortedMeals;

    if (algorithm === 'insertion') {
      sortedMeals = insertionSort(meals);
    } else if (algorithm === 'bubble') {
      sortedMeals = bubbleSort(meals);
    } else {
      sortedMeals = selectionSort(meals);
    }

    const end = performance.now();
    const time = (end - start).toFixed(3);

    res.json({
      algorithm,
      count: sortedMeals.length,
      ms: time,
      data: sortedMeals
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// =====================================================================
// SEARCH API
// GET /api/search?q=chicken
// =====================================================================

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุคำค้นหา'
      });
    }

    const url =
      `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`;

    const data = await fetchJSON(url);

    if (!data.meals) {
      return res.json({
        success: true,
        count: 0,
        keyword: q,
        message: `ไม่พบเมนูอาหารที่ค้นหา "${q}"`,
        data: []
      });
    }

    const result = data.meals.map(normalizeMeal);

    res.json({
      success: true,
      count: result.length,
      keyword: q,
      data: result
    });

  } catch (error) {
    console.error('Search Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาอาหาร'
    });
  }
});

// =====================================================================
// CATEGORY API
// GET /api/categories
// =====================================================================

app.get('/api/categories', async (req, res) => {
  try {
    const data = await fetchJSON(
      `${THEMEALDB_BASE}/list.php?c=list`
    );

    const categories =
      (data.meals || []).map(item => item.strCategory);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Category Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลด Category ได้'
    });
  }
});

// =====================================================================
// AREA API
// GET /api/areas
// =====================================================================

app.get('/api/areas', async (req, res) => {
  try {
    const data = await fetchJSON(
      `${THEMEALDB_BASE}/list.php?a=list`
    );

    const areas =
      (data.meals || []).map(item => item.strArea);

    res.json({
      success: true,
      count: areas.length,
      data: areas
    });

  } catch (error) {
    console.error('Area Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลด Area ได้'
    });
  }
});

// =====================================================================
// SEARCH + FILTER API
// GET /api/meals
// ตัวอย่าง:
// /api/meals
// /api/meals?search=chicken
// /api/meals?category=Chicken
// /api/meals?area=Thai
// /api/meals?search=chicken&category=Chicken&area=Thai
// =====================================================================

app.get('/api/meals', async (req, res) => {
  try {
    const search =
      String(req.query.search || '').trim();

    const category =
      String(req.query.category || '').trim();

    const area =
      String(req.query.area || '').trim();

    let result = [];

    // ---------------------------------------------------------------
    // 1. ถ้ามีคำค้น ให้ค้นหาด้วย search.php
    // ---------------------------------------------------------------

    if (search) {
      const url =
        `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(search)}`;

      const data = await fetchJSON(url);

      result = data.meals || [];
    }

    // ---------------------------------------------------------------
    // 2. ถ้าไม่มีคำค้น
    //    ใช้ Category / Area API เพื่อดึงรายการ
    // ---------------------------------------------------------------

    else if (category) {
      const url =
        `${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`;

      const data = await fetchJSON(url);

      result = (data.meals || []).map(meal => ({
        ...meal,
        strCategory: category,
        strArea: ''
      }));
    }

    else if (area) {
      const url =
        `${THEMEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`;

      const data = await fetchJSON(url);

      result = (data.meals || []).map(meal => ({
        ...meal,
        strCategory: '',
        strArea: area
      }));
    }

    else {
      // ค่าเริ่มต้น: เมนูไทย
      const url =
        `${THEMEALDB_BASE}/filter.php?a=Thai`;

      const data = await fetchJSON(url);

      result = (data.meals || []).slice(0, 50).map(meal => ({
        ...meal,
        strCategory: 'Thai Food',
        strArea: 'Thai'
      }));
    }

    // ---------------------------------------------------------------
    // 3. Filter เพิ่มเมื่อมี search + category/area
    // ---------------------------------------------------------------

    if (category && search) {
      result = result.filter(
        meal => meal.strCategory === category
      );
    }

    if (area && search) {
      result = result.filter(
        meal => meal.strArea === area
      );
    }

    const normalized = result.map(normalizeMeal);

    // ---------------------------------------------------------------
    // 4. ไม่พบข้อมูล
    // ---------------------------------------------------------------

    if (normalized.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'ไม่พบเมนูอาหารตามเงื่อนไขที่ค้นหา',
        data: []
      });
    }

    res.json({
      success: true,
      count: normalized.length,
      data: normalized
    });

  } catch (error) {
    console.error('Meals API Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร'
    });
  }
});

// =====================================================================
// QUEUE
// =====================================================================

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.items.shift();
  }

  peek() {
    return this.items[0];
  }

  size() {
    return this.items.length;
  }
}

const watchlist = new Queue();

// =====================================================================
// GET /watchlist
// =====================================================================

app.get('/watchlist', (req, res) => {
  res.json({
    items: watchlist.items,
    size: watchlist.size(),
    next: watchlist.peek() || null
  });
});

// =====================================================================
// POST /watchlist
// =====================================================================

app.post('/watchlist', (req, res) => {
  try {
    const id = Number(req.body.id);

    const meal =
      meals.find(item => item.id === id);

    if (!meal) {
      return res.status(404).json({
        error: 'ไม่พบเมนูอาหารนี้ในรายการเริ่มต้น'
      });
    }

    watchlist.enqueue(meal);

    history.push({
      action: 'ADD',
      meal,
      time: new Date().toLocaleTimeString('th-TH')
    });

    res.status(201).json({
      message: `เพิ่ม ${meal.name} เข้าคิวแล้ว`,
      size: watchlist.size()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// =====================================================================
// DELETE /watchlist/process
// =====================================================================

app.delete('/watchlist/process', (req, res) => {
  try {
    if (watchlist.size() === 0) {
      return res.status(400).json({
        error: 'คิวว่าง ไม่มีเมนูให้เลือก'
      });
    }

    const meal = watchlist.dequeue();

    history.push({
      action: 'COOK',
      meal,
      time: new Date().toLocaleTimeString('th-TH')
    });

    res.json({
      message: `เลือก ${meal.name} เรียบร้อย`,
      size: watchlist.size()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// =====================================================================
// STACK
// =====================================================================

class Stack {
  constructor() {
    this.items = [];
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    return this.items.pop();
  }

  peek() {
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  display() {
    return [...this.items].reverse();
  }
}

const history = new Stack();

// =====================================================================
// GET /history
// =====================================================================

app.get('/history', (req, res) => {
  res.json({
    history: history.display(),
    size: history.items.length
  });
});

// =====================================================================
// POST /undo
// =====================================================================

app.post('/undo', (req, res) => {
  try {
    if (history.isEmpty()) {
      return res.status(400).json({
        error: 'ไม่มีอะไรให้ย้อนกลับ'
      });
    }

    const last = history.pop();

    if (last.action === 'ADD') {
      const index = watchlist.items.findIndex(
        item => item.id === last.meal.id
      );

      if (index !== -1) {
        watchlist.items.splice(index, 1);
      }
    }

    else if (last.action === 'COOK') {
      watchlist.items.unshift(last.meal);
    }

    res.json({
      message:
        `ย้อน ${last.action} ของ ${last.meal.name} แล้ว`,
      size: watchlist.size()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// =====================================================================
// START SERVER
// =====================================================================

async function startServer() {
  await loadMeals();

  app.listen(PORT, () => {
    console.log('');
    console.log('====================================');
    console.log(
      `Server running at http://localhost:${PORT}`
    );
    console.log(
      `จำนวนเมนูที่โหลดได้: ${meals.length}`
    );
    console.log('====================================');
    console.log('');
  });
}

startServer();
