// =====================================================================
// 801201 Week 8
// Sort (W5) + Queue (W6) + Stack (W8)
// TheMealDB API
// =====================================================================

const express = require('express');
const path = require('path');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

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

  size() {
    return this.items.length;
  }
}


// =====================================================================
// MIDDLEWARE
// =====================================================================

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


// =====================================================================
// THEMEALDB API
// =====================================================================

// API สำหรับค้นหาเมนูอาหารไทย
const AREA_API =
  'https://www.themealdb.com/api/json/v1/1/filter.php?a=Thai';


// =====================================================================
// ตัวแปรเก็บข้อมูล
// =====================================================================

let meals = [];
let mealsLoaded = false;
let mealsLoadPromise = null;
const mealDetails = new Map();


// =====================================================================
// ฟังก์ชันเรียก API แบบปลอดภัย
// =====================================================================

async function fetchJSON(url) {

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),

    headers: {

      'Accept': 'application/json',

      'User-Agent':
        'Meal-Dashboard-Student-Project'

    }

  });


  // อ่านข้อมูลเป็น text ก่อน
  // เพื่อป้องกัน error
  // Unexpected token '<'

  const text =
    await response.text();


  // ตรวจสอบ HTTP Status

  if (!response.ok) {

    throw new Error(
      `API Error ${response.status}`
    );

  }


  // ตรวจสอบว่าเป็น JSON หรือไม่

  try {

    return JSON.parse(text);

  }

  catch (error) {

    console.error(
      'API ส่งข้อมูลที่ไม่ใช่ JSON:'
    );

    console.error(
      text.substring(0, 300)
    );

    throw new Error(
      'TheMealDB ไม่ได้ส่งข้อมูล JSON กลับมา'
    );

  }

}


// =====================================================================
// LOAD MEALS
// =====================================================================

function normalizeMeal(meal) {
  const ingredients = [];
  for (let index = 1; index <= 20; index++) {
    const ingredient = meal[`strIngredient${index}`];
    const measure = meal[`strMeasure${index}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }

  return {
    id: Number(meal.idMeal ?? meal.id),
    name: meal.strMeal ?? meal.name ?? '',
    category: meal.strCategory ?? meal.category ?? '',
    area: meal.strArea ?? meal.area ?? '',
    instructions: meal.strInstructions ?? meal.instructions ?? '',
    image: meal.strMealThumb ?? meal.image ?? '',
    ingredients
  };
}


async function fetchFilterMeals(kind, value) {
  const key = kind === 'category' ? 'c' : 'a';
  const data = await fetchJSON(
    `${THEMEALDB_BASE}/filter.php?${key}=${encodeURIComponent(value)}`
  );
  return (data.meals || []).map(meal => ({
    ...meal,
    strCategory: kind === 'category' ? value : '',
    strArea: kind === 'area' ? value : ''
  }));
}


async function getMealById(id) {
  const mealId = Number(id);
  const cachedMeal = mealDetails.get(mealId);
  if (cachedMeal) return cachedMeal;

  const data = await fetchJSON(
    `${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(mealId)}`
  );
  if (!data.meals || !data.meals[0]) return null;

  const meal = normalizeMeal(data.meals[0]);
  mealDetails.set(mealId, meal);
  return meal;
}


async function loadMeals() {

  try {

    console.log('');
    console.log('====================================');
    console.log('กำลังโหลดเมนูอาหารไทยจาก TheMealDB');
    console.log('====================================');


    // ---------------------------------------------------------------
    // 1. เรียก API
    // ---------------------------------------------------------------

    const data =
      await fetchJSON(AREA_API);


    // ---------------------------------------------------------------
    // 2. ตรวจสอบข้อมูล
    // ---------------------------------------------------------------

    if (!data || !data.meals) {

      throw new Error(
        'ไม่พบข้อมูลเมนูอาหารไทยจาก API'
      );

    }


    // ---------------------------------------------------------------
    // 3. เอาข้อมูลสูงสุด 50 เมนู
    // ---------------------------------------------------------------

    const thaiMeals =
      data.meals.slice(0, 50);


    console.log(
      `พบข้อมูลทั้งหมด ${data.meals.length} เมนู`
    );

    console.log(
      `นำมาใช้ในโปรเจกต์ ${thaiMeals.length} เมนู`
    );


    // ---------------------------------------------------------------
    // 4. แปลงข้อมูลให้อยู่ในรูปแบบที่หน้าเว็บใช้
    // ---------------------------------------------------------------

    meals =
      thaiMeals.map((meal) => {

        return {

          id:
            Number(meal.idMeal),

          name:
            meal.strMeal,

          category:
            'Thai Food',

          area:
            'Thai',

          instructions:
            '',

          image:
            meal.strMealThumb

        };

      });

    mealsLoaded = true;


    console.log(
      `โหลดข้อมูลสำเร็จ ${meals.length} เมนู`
    );

    console.log('====================================');
    console.log('');


  }

  catch (error) {

    console.error('');
    console.error(
      'เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร'
    );

    console.error(
      error.message
    );

    console.error('');

    meals = [];
    throw error;

  }

}


async function ensureMealsLoaded() {
  if (mealsLoaded) return meals;
  if (!mealsLoadPromise) {
    mealsLoadPromise = loadMeals().finally(() => {
      mealsLoadPromise = null;
    });
  }
  return mealsLoadPromise;
}


// =====================================================================
// SORT
// เรียงชื่อเมนู A → Z
// =====================================================================


// =====================================================================
// 1. SELECTION SORT
// =====================================================================

function selectionSort(arr, descending = false) {

  const a =
    [...arr];


  for (
    let i = 0;
    i < a.length - 1;
    i++
  ) {

    let minIndex =
      i;


    for (
      let j = i + 1;
      j < a.length;
      j++
    ) {

      const comparison = String(a[j].name || '').localeCompare(
        String(a[minIndex].name || ''),
        undefined,
        { sensitivity: 'base' }
      );

      if (descending ? comparison > 0 : comparison < 0) {

        minIndex =
          j;

      }

    }


    // สลับข้อมูล

    [
      a[i],
      a[minIndex]

    ] = [

      a[minIndex],
      a[i]

    ];

  }


  return a;

}


// =====================================================================
// API /meals
// =====================================================================

app.get(
  '/meals',
  async (req, res) => {

    try {

      await ensureMealsLoaded();

      const sortOrder = String(req.query.sort || req.query.order || '').toLowerCase();
      const descending = sortOrder === 'za' || sortOrder === 'desc';
      const start =
        performance.now();

      const sortedMeals = selectionSort(meals, descending);

      const end =
        performance.now();


      const time =
        (end - start).toFixed(3);


      // ---------------------------------------------------------------
      // ส่ง JSON กลับไปหน้าเว็บ
      // ---------------------------------------------------------------

      res.json({

        algorithm:
          'selection',

        count:
          sortedMeals.length,

        ms:
          time,

        data:
          sortedMeals

      });

    }

    catch (error) {

      res.status(502).json({

        error:
          error.message

      });

    }

  }
);


// =====================================================================
// SEARCH, FILTER, CATEGORY, AND AREA API
// =====================================================================

app.get('/api/search', async (req, res) => {
  const keyword = String(req.query.q || '').trim();
  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุคำค้นหา'
    });
  }

  try {
    const data = await fetchJSON(
      `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(keyword)}`
    );
    const result = (data.meals || []).map(normalizeMeal);
    res.json({
      success: true,
      count: result.length,
      keyword,
      message: result.length ? undefined : `ไม่พบเมนูอาหารที่ค้นหา "${keyword}"`,
      data: result
    });
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(502).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการค้นหาอาหาร'
    });
  }
});


app.get('/api/categories', async (req, res) => {
  try {
    const data = await fetchJSON(`${THEMEALDB_BASE}/list.php?c=list`);
    const categories = (data.meals || []).map(item => item.strCategory);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Category Error:', error.message);
    res.status(502).json({ success: false, message: 'ไม่สามารถโหลด Category จาก TheMealDB ได้' });
  }
});


app.get('/api/areas', async (req, res) => {
  try {
    const data = await fetchJSON(`${THEMEALDB_BASE}/list.php?a=list`);
    const areas = (data.meals || []).map(item => item.strArea);
    res.json({ success: true, count: areas.length, data: areas });
  } catch (error) {
    console.error('Area Error:', error.message);
    res.status(502).json({ success: false, message: 'ไม่สามารถโหลด Area จาก TheMealDB ได้' });
  }
});


app.get('/api/meals', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const area = String(req.query.area || '').trim();

  try {
    let result;
    if (search) {
      const data = await fetchJSON(
        `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(search)}`
      );
      result = data.meals || [];
    } else if (category && area) {
      const [categoryMeals, areaMeals] = await Promise.all([
        fetchFilterMeals('category', category),
        fetchFilterMeals('area', area)
      ]);
      const areaIds = new Set(areaMeals.map(meal => String(meal.idMeal)));
      result = categoryMeals.filter(meal => areaIds.has(String(meal.idMeal)));
      result = result.map(meal => ({ ...meal, strArea: area }));
    } else if (category) {
      result = await fetchFilterMeals('category', category);
    } else if (area) {
      result = await fetchFilterMeals('area', area);
    } else {
      await ensureMealsLoaded();
      result = meals.map(meal => ({
        idMeal: meal.id,
        strMeal: meal.name,
        strCategory: meal.category,
        strArea: meal.area,
        strInstructions: meal.instructions,
        strMealThumb: meal.image
      }));
    }

    if (search && category) {
      result = result.filter(meal => meal.strCategory === category);
    }
    if (search && area) {
      result = result.filter(meal => meal.strArea === area);
    }

    const sortOrder = String(req.query.sort || req.query.order || '').toLowerCase();
    const descending = sortOrder === 'za' || sortOrder === 'desc';
    const normalized = selectionSort(result.map(normalizeMeal), descending);
    res.json({
      success: true,
      count: normalized.length,
      message: normalized.length ? undefined : 'ไม่พบเมนูอาหารตามเงื่อนไขที่ค้นหา',
      data: normalized
    });
  } catch (error) {
    console.error('Meals API Error:', error.message);
    res.status(502).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลอาหาร'
    });
  }
});


app.get('/api/meals/:id', async (req, res) => {
  try {
    const meal = await getMealById(req.params.id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเมนูนี้'
      });
    }
    res.json({ success: true, data: meal });
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'ไม่สามารถโหลดรายละเอียดเมนูได้'
    });
  }
});


app.get('/api/random', async (req, res) => {
  try {
    const data = await fetchJSON(`${THEMEALDB_BASE}/random.php`);
    if (!data.meals || !data.meals[0]) {
      return res.status(502).json({
        success: false,
        message: 'TheMealDB ไม่พบเมนูสำหรับสุ่ม'
      });
    }

    const meal = normalizeMeal(data.meals[0]);
    mealDetails.set(meal.id, meal);
    res.json({ success: true, data: meal });
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'ไม่สามารถสุ่มเมนูจาก TheMealDB ได้'
    });
  }
});


// =====================================================================
// QUEUE
// คิวเมนูอาหาร
// =====================================================================

class Queue {

  constructor() {

    this.items =
      [];

  }


  // ---------------------------------------------------------------
  // เพิ่มข้อมูลเข้าท้าย Queue
  // ---------------------------------------------------------------

  enqueue(item) {

    this.items.push(item);

  }


  // ---------------------------------------------------------------
  // นำข้อมูลออกจากหัว Queue
  // ---------------------------------------------------------------

  dequeue() {

    return this.items.shift();

  }


  // ---------------------------------------------------------------
  // ดูข้อมูลตัวแรก
  // ---------------------------------------------------------------

  peek() {

    return this.items[0];

  }


  // ---------------------------------------------------------------
  // จำนวนข้อมูล
  // ---------------------------------------------------------------

  size() {

    return this.items.length;

  }

}


// สร้าง Queue

const watchlist =
  new Queue();


// =====================================================================
// GET /watchlist
// =====================================================================

app.get(
  '/watchlist',
  (req, res) => {

    res.json({

      items:
        watchlist.items,

      size:
        watchlist.size(),

      next:
        watchlist.peek() || null

    });

  }
);


// =====================================================================
// POST /watchlist
// เพิ่มเมนูเข้า Queue
// =====================================================================

app.post(
  '/watchlist',
  async (req, res) => {

    try {

      const id =
        Number(req.body.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'รหัสเมนูไม่ถูกต้อง'
        });
      }

      const meal = await getMealById(id);


      if (!meal) {

        return res.status(404).json({

          error:
            'ไม่พบเมนูอาหารนี้'

        });

      }


      // เพิ่มเข้า Queue

      watchlist.enqueue(meal);


      res.status(201).json({

        message:
          `เพิ่ม ${meal.name} เข้าคิวแล้ว`,

        size:
          watchlist.size()

      });

    }

    catch (error) {

      res.status(502).json({

        error:
          error.message

      });

    }

  }
);


// =====================================================================
// DELETE /watchlist/process
// นำเมนูออกจาก Queue
// =====================================================================

app.delete(
  '/watchlist/process',
  (req, res) => {

    try {

      // ตรวจสอบว่าคิวว่างหรือไม่

      if (
        watchlist.size() === 0
      ) {

        return res.status(400).json({

          error:
            'คิวว่าง ไม่มีเมนูให้เลือก'

        });

      }


      // -------------------------------------------------------------
      // นำเมนูตัวแรกออกจาก Queue
      // -------------------------------------------------------------

      const meal =
        watchlist.dequeue();


      res.json({

        message:
          `เลือก ${meal.name} เรียบร้อย`,

        meal:
          meal,

        size:
          watchlist.size()

      });

    }

    catch (error) {

      res.status(500).json({

        error:
          error.message

      });

    }

  }
);


// =====================================================================
// START SERVER
// =====================================================================

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


if (require.main === module) {
  startServer();
}

module.exports = app;