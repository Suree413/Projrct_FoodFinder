// =====================================================================
// 801201 Week 8
// Sort (W5) + Queue (W6) + Stack (W8)
// TheMealDB API
// =====================================================================

const express = require('express');

const app = express();

const PORT = 3000;


// =====================================================================
// MIDDLEWARE
// =====================================================================

app.use(express.json());

app.use(express.static('public'));


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


// =====================================================================
// ฟังก์ชันเรียก API แบบปลอดภัย
// =====================================================================

async function fetchJSON(url) {

  const response = await fetch(url, {

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

  }

}


// =====================================================================
// SORT
// เรียงชื่อเมนู A → Z
// =====================================================================


// =====================================================================
// 1. SELECTION SORT
// =====================================================================

function selectionSort(arr) {

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

      if (
        a[j].name.toLowerCase() <
        a[minIndex].name.toLowerCase()
      ) {

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
// 2. INSERTION SORT
// =====================================================================

function insertionSort(arr) {

  const a =
    [...arr];


  for (
    let i = 1;
    i < a.length;
    i++
  ) {

    const key =
      a[i];


    let j =
      i - 1;


    while (

      j >= 0 &&

      a[j].name.toLowerCase() >
      key.name.toLowerCase()

    ) {

      a[j + 1] =
        a[j];

      j--;

    }


    a[j + 1] =
      key;

  }


  return a;

}


// =====================================================================
// 3. BUBBLE SORT
// =====================================================================

function bubbleSort(arr) {

  const a =
    [...arr];


  for (
    let i = 0;
    i < a.length - 1;
    i++
  ) {

    for (
      let j = 0;
      j < a.length - 1 - i;
      j++
    ) {

      if (

        a[j].name.toLowerCase() >
        a[j + 1].name.toLowerCase()

      ) {

        [
          a[j],
          a[j + 1]

        ] = [

          a[j + 1],
          a[j]

        ];

      }

    }

  }


  return a;

}


// =====================================================================
// API /meals
// =====================================================================

app.get(
  '/meals',
  (req, res) => {

    try {

      const algorithm =
        req.query.sort || 'selection';


      const start =
        performance.now();


      let sortedMeals;


      // ---------------------------------------------------------------
      // เลือก Algorithm
      // ---------------------------------------------------------------

      if (
        algorithm === 'insertion'
      ) {

        sortedMeals =
          insertionSort(meals);

      }

      else if (
        algorithm === 'bubble'
      ) {

        sortedMeals =
          bubbleSort(meals);

      }

      else {

        sortedMeals =
          selectionSort(meals);

      }


      const end =
        performance.now();


      const time =
        (end - start).toFixed(3);


      // ---------------------------------------------------------------
      // ส่ง JSON กลับไปหน้าเว็บ
      // ---------------------------------------------------------------

      res.json({

        algorithm:
          algorithm,

        count:
          sortedMeals.length,

        ms:
          time,

        data:
          sortedMeals

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
  (req, res) => {

    try {

      const id =
        Number(req.body.id);


      // ค้นหาเมนูจาก ID

      const meal =
        meals.find(
          item =>
            item.id === id
        );


      if (!meal) {

        return res.status(404).json({

          error:
            'ไม่พบเมนูอาหารนี้'

        });

      }


      // เพิ่มเข้า Queue

      watchlist.enqueue(meal);


      // -------------------------------------------------------------
      // บันทึกประวัติลง Stack
      // -------------------------------------------------------------

      history.push({

        action:
          'ADD',

        meal:
          meal,

        time:
          new Date()
            .toLocaleTimeString('th-TH')

      });


      res.status(201).json({

        message:
          `เพิ่ม ${meal.name} เข้าคิวแล้ว`,

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


      // -------------------------------------------------------------
      // บันทึกลง Stack
      // -------------------------------------------------------------

      history.push({

        action:
          'COOK',

        meal:
          meal,

        time:
          new Date()
            .toLocaleTimeString('th-TH')

      });


      res.json({

        message:
          `เลือก ${meal.name} เรียบร้อย`,

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
// STACK
// เก็บประวัติการทำงาน
// =====================================================================

class Stack {

  constructor() {

    this.items =
      [];

  }


  // ---------------------------------------------------------------
  // เพิ่มข้อมูลด้านบน Stack
  // ---------------------------------------------------------------

  push(item) {

    this.items.push(item);

  }


  // ---------------------------------------------------------------
  // นำข้อมูลด้านบนออก
  // ---------------------------------------------------------------

  pop() {

    return this.items.pop();

  }


  // ---------------------------------------------------------------
  // ดูข้อมูลด้านบน
  // ---------------------------------------------------------------

  peek() {

    return this.items[
      this.items.length - 1
    ];

  }


  // ---------------------------------------------------------------
  // ตรวจสอบว่า Stack ว่างหรือไม่
  // ---------------------------------------------------------------

  isEmpty() {

    return (
      this.items.length === 0
    );

  }


  // ---------------------------------------------------------------
  // แสดงประวัติ
  // ล่าสุดอยู่ด้านบน
  // ---------------------------------------------------------------

  display() {

    return [
      ...this.items
    ].reverse();

  }

}


// สร้าง Stack

const history =
  new Stack();


// =====================================================================
// GET /history
// =====================================================================

app.get(
  '/history',
  (req, res) => {

    res.json({

      history:
        history.display(),

      size:
        history.items.length

    });

  }
);


// =====================================================================
// POST /undo
// Undo ด้วย Stack
// =====================================================================

app.post(
  '/undo',
  (req, res) => {

    try {

      // ตรวจสอบ Stack

      if (
        history.isEmpty()
      ) {

        return res.status(400).json({

          error:
            'ไม่มีอะไรให้ย้อนกลับ'

        });

      }


      // -------------------------------------------------------------
      // POP ข้อมูลล่าสุดออกจาก Stack
      // -------------------------------------------------------------

      const last =
        history.pop();


      // -------------------------------------------------------------
      // ถ้า Action เป็น ADD
      // เอารายการล่าสุดออกจาก Queue
      // -------------------------------------------------------------

      if (
        last.action === 'ADD'
      ) {

        watchlist.items.pop();

      }


      // -------------------------------------------------------------
      // ถ้า Action เป็น COOK
      // นำเมนูกลับไปหน้าคิว
      // -------------------------------------------------------------

      else if (
        last.action === 'COOK'
      ) {

        watchlist.items.unshift(
          last.meal
        );

      }


      res.json({

        message:
          `ย้อน ${last.action} ของ ${last.meal.name} แล้ว`,

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
// GET /meal/:id
// ดึงรายละเอียดเมนูอาหารรายรายการจาก TheMealDB (lookup.php?i=MealID)
// =====================================================================
app.get('/meal/:id', async (req, res) => {
  try {
    const mealId = req.params.id;
    const LOOKUP_API = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`;
    
    const data = await fetchJSON(LOOKUP_API);

    if (!data || !data.meals || data.meals.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายละเอียดเมนูอาหารนี้' });
    }

    const detail = data.meals[0];

    // แกะส่วนผสม Ingredients และ Measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = detail[`strIngredient${i}`];
      const measure = detail[`strMeasure${i}`];

      if (ingredient && ingredient.trim() !== '') {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : ''
        });
      }
    }

    res.json({
      id: detail.idMeal,
      name: detail.strMeal,
      category: detail.strCategory,
      area: detail.strArea,
      instructions: detail.strInstructions,
      image: detail.strMealThumb,
      ingredients: ingredients
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================================================
// START SERVER
// =====================================================================

async function startServer() {

  // โหลดข้อมูลก่อน

  await loadMeals();


  // เปิด Server

  app.listen(
    PORT,
    () => {

      console.log('');
      console.log(
        '===================================='
      );

      console.log(
        `Server running at http://localhost:${PORT}`
      );

      console.log(
        `จำนวนเมนูที่โหลดได้: ${meals.length}`
      );

      console.log(
        '===================================='
      );

    }
  );

}


// เริ่มโปรแกรม

startServer();