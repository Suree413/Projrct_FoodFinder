// =====================================================================
// dashboard.js
// Search + Filter + Sort + Queue + Stack
// =====================================================================

let currentMeals = [];

// =====================================================================
// Helper
// =====================================================================

function showError(message) {
  const box = document.getElementById('error');

  if (!message) {
    box.style.display = 'none';
    box.textContent = '';
    return;
  }

  box.textContent = message;
  box.style.display = 'block';
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// =====================================================================
// LOAD CATEGORY
// =====================================================================

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'โหลด Category ไม่สำเร็จ');
    }

    const select = document.getElementById('categoryFilter');

    select.innerHTML = '<option value="">ทุก Category</option>';

    result.data.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    showError('ไม่สามารถโหลด Category ได้');
  }
}

// =====================================================================
// LOAD AREA
// =====================================================================

async function loadAreas() {
  try {
    const response = await fetch('/api/areas');
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'โหลด Area ไม่สำเร็จ');
    }

    const select = document.getElementById('areaFilter');

    select.innerHTML = '<option value="">ทุก Area</option>';

    result.data.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      select.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    showError('ไม่สามารถโหลด Area ได้');
  }
}

// =====================================================================
// SEARCH
// =====================================================================

async function searchMeals() {
  const keyword = document
    .getElementById('searchInput')
    .value
    .trim();

  if (!keyword) {
    await loadDashboard();
    return;
  }

  showError('');

  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(keyword)}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'ค้นหาไม่สำเร็จ');
    }

    if (result.count === 0) {
      currentMeals = [];
      renderMeals([]);
      document.getElementById('sortInfo').textContent = '';
      document.getElementById('resultInfo').textContent = result.message;
      return;
    }

    currentMeals = result.data;
    sortAndRender(currentMeals);

    document.getElementById('resultInfo').textContent =
      `พบ ${result.count} เมนู จากคำค้น "${result.keyword}"`;

  } catch (error) {
    console.error(error);
    showError(error.message || 'เกิดข้อผิดพลาดในการค้นหา');
  }
}

// =====================================================================
// SEARCH + FILTER
// =====================================================================

async function loadSearchResults() {
  const search = document
    .getElementById('searchInput')
    .value
    .trim();

  const category = document
    .getElementById('categoryFilter')
    .value;

  const area = document
    .getElementById('areaFilter')
    .value;

  showError('');

  try {
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (area) params.append('area', area);

    const response = await fetch(`/api/meals?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
    }

    if (result.count === 0) {
      currentMeals = [];
      renderMeals([]);
      document.getElementById('sortInfo').textContent = '';
      document.getElementById('resultInfo').textContent = result.message;
      return;
    }

    currentMeals = result.data;
    sortAndRender(currentMeals);

    document.getElementById('resultInfo').textContent =
      `พบ ${result.count} เมนู`;

  } catch (error) {
    console.error(error);
    showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
  }
}

// =====================================================================
// CLEAR SEARCH
// =====================================================================

async function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('areaFilter').value = '';

  showError('');
  await loadDashboard();
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

function sortAndRender(meals) {
  const algorithm = document.getElementById('algo').value;

  const start = performance.now();

  let sorted;

  if (algorithm === 'insertion') {
    sorted = insertionSort(meals);
  } else if (algorithm === 'bubble') {
    sorted = bubbleSort(meals);
  } else {
    sorted = selectionSort(meals);
  }

  const end = performance.now();

  document.getElementById('sortInfo').textContent =
    `${algorithm} · ${(end - start).toFixed(3)} ms`;

  renderMeals(sorted);
}

function loadDashboard() {
  loadSearchResults();
}

// =====================================================================
// DISPLAY MEALS
// =====================================================================

function renderMeals(meals) {
  const container = document.getElementById('meals');

  container.innerHTML = '';

  if (!meals || meals.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        ไม่พบเมนูอาหาร
      </div>
    `;
    return;
  }

  meals.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img
        src="${escapeHTML(meal.image)}"
        alt="${escapeHTML(meal.name)}"
      >

      <div class="info">
        <strong>${escapeHTML(meal.name)}</strong>

        <div class="meta">
          Category: ${escapeHTML(meal.category || '-')}
        </div>

        <div class="meta">
          Area: ${escapeHTML(meal.area || '-')}
        </div>
      </div>

      <button onclick="addToQueue(${Number(meal.id)})">
        + เพิ่มคิว
      </button>
    `;

    container.appendChild(card);
  });
}

// =====================================================================
// QUEUE
// =====================================================================

async function addToQueue(id) {
  try {
    const response = await fetch('/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'เพิ่มคิวไม่สำเร็จ');
    }

    await loadQueue();
    await loadHistory();

  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

async function processQueue() {
  try {
    const response = await fetch('/watchlist/process', {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'เลือกเมนูไม่สำเร็จ');
    }

    await loadQueue();
    await loadHistory();

  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

async function loadQueue() {
  try {
    const response = await fetch('/watchlist');
    const result = await response.json();

    const list = document.getElementById('watchlist');
    const size = document.getElementById('queueSize');

    size.textContent = result.size;

    list.innerHTML = '';

    if (result.items.length === 0) {
      list.innerHTML = `
        <li class="empty">
          ยังไม่มีเมนูในคิว
        </li>
      `;
      return;
    }

    result.items.forEach((item, index) => {
      const li = document.createElement('li');

      li.innerHTML = `
        ${index + 1}. ${escapeHTML(item.name)}
        <span>${escapeHTML(item.area || '')}</span>
      `;

      list.appendChild(li);
    });

  } catch (error) {
    console.error(error);
  }
}

// =====================================================================
// STACK / HISTORY
// =====================================================================

async function loadHistory() {
  try {
    const response = await fetch('/history');
    const result = await response.json();

    const list = document.getElementById('history');

    list.innerHTML = '';

    if (result.history.length === 0) {
      list.innerHTML = `
        <li class="empty">
          ยังไม่มีประวัติ
        </li>
      `;
      return;
    }

    result.history.forEach(item => {
      const li = document.createElement('li');

      li.innerHTML = `
        ${escapeHTML(item.action)} -
        ${escapeHTML(item.meal.name)}
        <span>${escapeHTML(item.time)}</span>
      `;

      list.appendChild(li);
    });

  } catch (error) {
    console.error(error);
  }
}

async function undo() {
  try {
    const response = await fetch('/undo', {
      method: 'POST'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Undo ไม่สำเร็จ');
    }

    await loadQueue();
    await loadHistory();

  } catch (error) {
    console.error(error);
    showError(error.message);
  }
}

// =====================================================================
// START
// =====================================================================

async function startDashboard() {
  await Promise.all([
    loadCategories(),
    loadAreas()
  ]);

  await loadDashboard();
  await loadQueue();
  await loadHistory();
}

startDashboard();
