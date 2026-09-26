// ================================================================
// Food Finder
// Meal Card + Sort + Filter + Loading + Empty State
// ================================================================

let allMeals = [];
let currentMeals = [];
let sortOrder = 'az';


// ================================================================
// LOAD MEALS
// ================================================================

async function loadDashboard() {

  const container = document.getElementById('meals');
  const errorBox = document.getElementById('error');

  // Loading State
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>กำลังโหลดเมนูอาหาร...</p>
    </div>
  `;

  errorBox.style.display = 'none';

  try {

    // เรียกข้อมูลจาก Server
    const res = await fetch('/meals');

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.error || 'โหลดข้อมูลไม่สำเร็จ'
      );
    }

    allMeals = result.data || [];

    currentMeals = [...allMeals];

    // สร้าง Filter
    createFilters(allMeals);

    // แสดงข้อมูล
    renderMeals();

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>โหลดข้อมูลไม่สำเร็จ</h3>
        <p>${escapeHtml(error.message)}</p>
        <button onclick="loadDashboard()">
          ลองใหม่
        </button>
      </div>
    `;

    showError(error.message);
  }
}


// ================================================================
// CREATE FILTER
// ================================================================

function createFilters(meals) {

  const categorySelect =
    document.getElementById('categoryFilter');

  const areaSelect =
    document.getElementById('areaFilter');


  // ล้างค่าเดิม
  categorySelect.innerHTML =
    '<option value="">ทุก Category</option>';

  areaSelect.innerHTML =
    '<option value="">ทุก Area</option>';


  // เก็บ Category
  const categories = [];
  const areas = [];


  for (let i = 0; i < meals.length; i++) {

    const category = meals[i].category;
    const area = meals[i].area;


    if (
      category &&
      !containsValue(categories, category)
    ) {
      categories.push(category);
    }


    if (
      area &&
      !containsValue(areas, area)
    ) {
      areas.push(area);
    }

  }


  // เพิ่ม Category
  for (let i = 0; i < categories.length; i++) {

    categorySelect.innerHTML += `
      <option value="${escapeHtml(categories[i])}">
        ${escapeHtml(categories[i])}
      </option>
    `;

  }


  // เพิ่ม Area
  for (let i = 0; i < areas.length; i++) {

    areaSelect.innerHTML += `
      <option value="${escapeHtml(areas[i])}">
        ${escapeHtml(areas[i])}
      </option>
    `;

  }

}


// ================================================================
// CHECK VALUE
// ไม่ใช้ includes()
// ================================================================

function containsValue(arr, value) {

  for (let i = 0; i < arr.length; i++) {

    if (arr[i] === value) {
      return true;
    }

  }

  return false;
}


// ================================================================
// FILTER
// ================================================================

function applyFilter() {

  const category =
    document.getElementById(
      'categoryFilter'
    ).value;


  const area =
    document.getElementById(
      'areaFilter'
    ).value;


  currentMeals = [];


  for (let i = 0; i < allMeals.length; i++) {

    const meal = allMeals[i];


    const categoryMatch =
      category === '' ||
      meal.category === category;


    const areaMatch =
      area === '' ||
      meal.area === area;


    if (
      categoryMatch &&
      areaMatch
    ) {

      currentMeals.push(meal);

    }

  }


  renderMeals();
}


// ================================================================
// SEARCH
// ================================================================

function searchMeals() {

  const keyword =
    document.getElementById(
      'searchInput'
    ).value.trim().toLowerCase();


  currentMeals = [];


  if (keyword === '') {

    currentMeals = [...allMeals];

  } else {

    for (let i = 0; i < allMeals.length; i++) {

      const name =
        String(allMeals[i].name)
          .toLowerCase();


      if (name.indexOf(keyword) !== -1) {

        currentMeals.push(
          allMeals[i]
        );

      }

    }

  }


  // ใช้ Filter ต่อหลัง Search
  applyCurrentFilters();
}


// ================================================================
// FILTER CURRENT DATA
// ================================================================

function applyCurrentFilters() {

  const keyword =
    document.getElementById(
      'searchInput'
    ).value.trim().toLowerCase();


  const category =
    document.getElementById(
      'categoryFilter'
    ).value;


  const area =
    document.getElementById(
      'areaFilter'
    ).value;


  currentMeals = [];


  for (let i = 0; i < allMeals.length; i++) {

    const meal = allMeals[i];

    const name =
      String(meal.name).toLowerCase();


    const searchMatch =
      keyword === '' ||
      name.indexOf(keyword) !== -1;


    const categoryMatch =
      category === '' ||
      meal.category === category;


    const areaMatch =
      area === '' ||
      meal.area === area;


    if (
      searchMatch &&
      categoryMatch &&
      areaMatch
    ) {

      currentMeals.push(meal);

    }

  }


  renderMeals();
}


// ================================================================
// SORT A-Z
// LOGIC เอง - ไม่ใช้ Array.sort()
// ================================================================

function sortAZ() {

  sortOrder = 'az';

  currentMeals =
    selectionSort(
      currentMeals,
      false
    );

  renderMeals();
}


// ================================================================
// SORT Z-A
// LOGIC เอง - ไม่ใช้ Array.sort()
// ================================================================

function sortZA() {

  sortOrder = 'za';

  currentMeals =
    selectionSort(
      currentMeals,
      true
    );

  renderMeals();
}


// ================================================================
// SELECTION SORT
// เขียน Algorithm เอง
// ================================================================

function selectionSort(arr, descending) {

  const result = [];

  // copy ข้อมูลทีละตัว
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i]);
  }


  for (
    let i = 0;
    i < result.length - 1;
    i++
  ) {

    let selectedIndex = i;


    for (
      let j = i + 1;
      j < result.length;
      j++
    ) {

      const currentName =
        String(result[j].name)
          .toLowerCase();


      const selectedName =
        String(result[selectedIndex].name)
          .toLowerCase();


      if (descending) {

        if (
          currentName > selectedName
        ) {

          selectedIndex = j;

        }

      } else {

        if (
          currentName < selectedName
        ) {

          selectedIndex = j;

        }

      }

    }


    // Swap
    if (selectedIndex !== i) {

      const temp =
        result[i];

      result[i] =
        result[selectedIndex];

      result[selectedIndex] =
        temp;

    }

  }


  return result;
}


// ================================================================
// RENDER MEAL CARDS
// ================================================================

function renderMeals() {

  const container =
    document.getElementById('meals');


  // Empty State
  if (
    currentMeals.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>ไม่พบเมนูอาหาร</h3>
        <p>
          ลองเปลี่ยนคำค้นหา หรือเลือก Filter ใหม่
        </p>
      </div>
    `;

    updateSortInfo();

    return;
  }


  // แสดง Meal Card
  let html = '';


  for (
    let i = 0;
    i < currentMeals.length;
    i++
  ) {

    const meal =
      currentMeals[i];


    html += `
      <div class="meal-card">

        <div class="meal-image-wrapper">

          <img
            src="${escapeHtml(meal.image)}"
            alt="${escapeHtml(meal.name)}"
            class="meal-image"
            loading="lazy"
          >

        </div>


        <div class="meal-content">

          <h3 class="meal-name">
            ${escapeHtml(meal.name)}
          </h3>


          <div class="meal-meta">

            <span class="tag">
              ${escapeHtml(
                meal.category ||
                'ไม่ระบุ Category'
              )}
            </span>


            <span class="tag area">
              🌍
              ${escapeHtml(
                meal.area ||
                'ไม่ระบุ Area'
              )}
            </span>

          </div>


          <button
            class="detail-button"
            onclick="showMealDetail(${meal.id})"
          >
            ดูรายละเอียด
          </button>

        </div>

      </div>
    `;

  }


  container.innerHTML = html;

  updateSortInfo();
}


// ================================================================
// SORT INFORMATION
// ================================================================

function updateSortInfo() {

  const sortInfo =
    document.getElementById(
      'sortInfo'
    );


  const orderText =
    sortOrder === 'az'
      ? 'A–Z'
      : 'Z–A';


  sortInfo.textContent =
    `${currentMeals.length} เมนู · เรียง ${orderText}`;
}


// ================================================================
// MEAL DETAIL
// ================================================================

function showMealDetail(id) {

  let meal = null;


  for (
    let i = 0;
    i < allMeals.length;
    i++
  ) {

    if (allMeals[i].id === id) {

      meal = allMeals[i];

      break;

    }

  }


  if (!meal) {

    showError(
      'ไม่พบข้อมูลเมนูนี้'
    );

    return;
  }


  alert(
    `${meal.name}\n\n` +
    `Category: ${meal.category}\n` +
    `Area: ${meal.area}`
  );
}


// ================================================================
// ERROR
// ================================================================

function showError(message) {

  const errorBox =
    document.getElementById(
      'error'
    );


  errorBox.textContent =
    'เกิดข้อผิดพลาด: ' +
    message;


  errorBox.style.display =
    'block';
}


// ================================================================
// ESCAPE HTML
// ================================================================

function escapeHtml(value) {

  return String(
    value ?? ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}


// ================================================================
// RESET
// ================================================================

function resetFilter() {

  document.getElementById(
    'searchInput'
  ).value = '';


  document.getElementById(
    'categoryFilter'
  ).value = '';


  document.getElementById(
    'areaFilter'
  ).value = '';


  currentMeals =
    [...allMeals];


  renderMeals();
}


// ================================================================
// EVENT
// ================================================================

document.addEventListener(
  'DOMContentLoaded',
  function () {

    loadDashboard();

  }
);