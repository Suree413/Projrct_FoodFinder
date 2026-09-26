let allMeals = [];
let currentMeals = [];
let searchBaseMeals = [];
let sortOrder = 'az';

class NavigationStack {
  constructor() {
    this.items = [];
  }

  push(id) {
    this.items.push(id);
  }

  pop() {
    return this.items.pop() ?? null;
  }

  peek() {
    return this.items[this.items.length - 1] ?? null;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

const navStack = new NavigationStack();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeHTML(value) {
  return escapeHtml(value);
}

function showError(message) {
  const errorBox = document.getElementById('error');
  window.clearTimeout(showError.timeoutId);
  errorBox.textContent = message ? `เกิดข้อผิดพลาด: ${message}` : '';
  errorBox.style.display = message ? 'block' : 'none';
  if (message) {
    showError.timeoutId = window.setTimeout(() => {
      errorBox.style.display = 'none';
    }, 4000);
  }
}

function containsValue(values, value) {
  for (let index = 0; index < values.length; index++) {
    if (values[index] === value) return true;
  }
  return false;
}

function createFilters(meals) {
  const categories = [];
  const areas = [];
  for (const meal of meals) {
    if (meal.category && !containsValue(categories, meal.category)) categories.push(meal.category);
    if (meal.area && !containsValue(areas, meal.area)) areas.push(meal.area);
  }
  fillFilter('categoryFilter', 'ทุก Category', categories);
  fillFilter('areaFilter', 'ทุก Area', areas);
}

function fillFilter(id, label, values) {
  const select = document.getElementById(id);
  const selectedValue = select.value;
  select.replaceChildren(new Option(label, ''));
  for (const value of values || []) select.add(new Option(value, value));
  if ([...select.options].some(option => option.value === selectedValue)) {
    select.value = selectedValue;
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'โหลด Category ไม่สำเร็จ');
    fillFilter('categoryFilter', 'ทุก Category', result.data);
  } catch (error) {
    console.error(error);
    if (!allMeals.length) showError('ไม่สามารถโหลด Category ได้');
  }
}

async function loadAreas() {
  try {
    const response = await fetch('/api/areas');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'โหลด Area ไม่สำเร็จ');
    fillFilter('areaFilter', 'ทุก Area', result.data);
  } catch (error) {
    console.error(error);
    if (!allMeals.length) showError('ไม่สามารถโหลด Area ได้');
  }
}

async function loadDashboard() {
  const mealsContainer = document.getElementById('meals');
  mealsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>กำลังโหลดเมนูอาหาร...</p></div>';
  showError('');

  try {
    const response = await fetch('/meals?sort=selection');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'โหลดข้อมูลไม่สำเร็จ');

    allMeals = Array.isArray(result.data) ? result.data : [];
    searchBaseMeals = [...allMeals];
    currentMeals = [...allMeals];
    if (document.getElementById('resultInfo')) {
      document.getElementById('resultInfo').textContent = `พบ ${allMeals.length} เมนู`;
    }
    sortAndRender();
    await Promise.all([updateWatchlist(), updateHistory()]);
  } catch (error) {
    mealsContainer.innerHTML = `<div class="empty-state"><h3>โหลดข้อมูลไม่สำเร็จ</h3><p>${escapeHtml(error.message)}</p><button onclick="loadDashboard()">ลองใหม่</button></div>`;
    showError(error.message);
  }
}

async function searchMeals() {
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) {
    await loadSearchResults();
    return;
  }

  showError('');
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'ค้นหาไม่สำเร็จ');
    searchBaseMeals = Array.isArray(result.data) ? result.data : [];
    applyCurrentFilters();
    document.getElementById('resultInfo').textContent =
      `พบ ${currentMeals.length} เมนู จากคำค้น "${result.keyword}"`;
  } catch (error) {
    console.error(error);
    showError(error.message || 'เกิดข้อผิดพลาดในการค้นหา');
  }
}

function searchMealsLocally() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  searchBaseMeals = allMeals.filter(meal =>
    String(meal.name || '').toLowerCase().includes(keyword)
  );
  applyCurrentFilters();
}

async function loadSearchResults() {
  const params = new URLSearchParams();
  const search = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const area = document.getElementById('areaFilter').value;
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (area) params.set('area', area);

  showError('');
  try {
    const response = await fetch(`/api/meals?${params.toString()}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
    searchBaseMeals = Array.isArray(result.data) ? result.data : [];
    currentMeals = [...searchBaseMeals];
    document.getElementById('resultInfo').textContent = result.count === 0
      ? (result.message || 'ไม่พบเมนูอาหารตามเงื่อนไขที่ค้นหา')
      : `พบ ${result.count} เมนู`;
    sortAndRender();
  } catch (error) {
    console.error(error);
    showError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
  }
}

function applyFilter() {
  const category = document.getElementById('categoryFilter').value;
  const area = document.getElementById('areaFilter').value;
  searchBaseMeals = allMeals.filter(meal =>
    (!category || meal.category === category) &&
    (!area || meal.area === area)
  );
  applyCurrentFilters();
}

function applyCurrentFilters() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const area = document.getElementById('areaFilter').value;
  currentMeals = searchBaseMeals.filter(meal => {
    const name = String(meal.name || '').toLowerCase();
    return (!keyword || name.includes(keyword)) &&
      (!category || meal.category === category) &&
      (!area || meal.area === area);
  });
  if (document.getElementById('resultInfo')) {
    document.getElementById('resultInfo').textContent = `พบ ${currentMeals.length} เมนู`;
  }
  sortAndRender();
}

function compareMeals(first, second, descending = false) {
  const comparison = String(first.name || '').localeCompare(
    String(second.name || ''), undefined, { sensitivity: 'base' }
  );
  return descending ? -comparison : comparison;
}

function selectionSort(meals, descending = false) {
  const sortedMeals = [...meals];
  for (let index = 0; index < sortedMeals.length - 1; index++) {
    let selectedIndex = index;
    for (let nextIndex = index + 1; nextIndex < sortedMeals.length; nextIndex++) {
      if (compareMeals(sortedMeals[nextIndex], sortedMeals[selectedIndex], descending) < 0) {
        selectedIndex = nextIndex;
      }
    }
    if (selectedIndex !== index) {
      [sortedMeals[index], sortedMeals[selectedIndex]] = [sortedMeals[selectedIndex], sortedMeals[index]];
    }
  }
  return sortedMeals;
}

function insertionSort(meals, descending = false) {
  const sortedMeals = [...meals];
  for (let index = 1; index < sortedMeals.length; index++) {
    const key = sortedMeals[index];
    let cursor = index - 1;
    while (cursor >= 0 && compareMeals(sortedMeals[cursor], key, descending) > 0) {
      sortedMeals[cursor + 1] = sortedMeals[cursor];
      cursor--;
    }
    sortedMeals[cursor + 1] = key;
  }
  return sortedMeals;
}

function bubbleSort(meals, descending = false) {
  const sortedMeals = [...meals];
  for (let index = 0; index < sortedMeals.length - 1; index++) {
    for (let cursor = 0; cursor < sortedMeals.length - 1 - index; cursor++) {
      if (compareMeals(sortedMeals[cursor], sortedMeals[cursor + 1], descending) > 0) {
        [sortedMeals[cursor], sortedMeals[cursor + 1]] = [sortedMeals[cursor + 1], sortedMeals[cursor]];
      }
    }
  }
  return sortedMeals;
}

function sortAndRender(meals = currentMeals) {
  const algorithmSelect = document.getElementById('algo');
  const algorithm = algorithmSelect ? algorithmSelect.value : 'selection';
  const descending = sortOrder === 'za';
  const start = performance.now();
  if (algorithm === 'insertion') currentMeals = insertionSort(meals, descending);
  else if (algorithm === 'bubble') currentMeals = bubbleSort(meals, descending);
  else currentMeals = selectionSort(meals, descending);
  const elapsed = (performance.now() - start).toFixed(3);
  document.getElementById('sortInfo').textContent =
    `${currentMeals.length} เมนู · ${sortOrder.toUpperCase()} · ${algorithm} · ${elapsed} ms`;
  renderMeals();
}

function sortAZ() {
  sortOrder = 'az';
  sortAndRender();
}

function sortZA() {
  sortOrder = 'za';
  sortAndRender();
}

function renderMeals() {
  const container = document.getElementById('meals');
  if (currentMeals.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><h3>ไม่พบเมนูอาหาร</h3><p>ลองเปลี่ยนคำค้นหา หรือเลือก Filter ใหม่</p></div>';
    updateSortInfo();
    return;
  }

  container.innerHTML = currentMeals.map(meal => `
    <article class="meal-card">
      <div class="meal-image-wrapper">
        <img src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}" class="meal-image" loading="lazy">
      </div>
      <div class="meal-content">
        <h3 class="meal-name">${escapeHtml(meal.name)}</h3>
        <div class="meal-meta">
          <span class="tag">${escapeHtml(meal.category || 'ไม่ระบุ Category')}</span>
          <span class="tag">${escapeHtml(meal.area || 'ไม่ระบุ Area')}</span>
        </div>
        <div class="meal-actions">
          <button class="primary" onclick="addToQueue(${Number(meal.id)})">+ เพิ่มเข้าคิว</button>
          <button onclick="openDetail(${Number(meal.id)})">รายละเอียด</button>
        </div>
      </div>
    </article>
  `).join('');
  updateSortInfo();
}

function updateSortInfo() {
  const orderLabel = sortOrder === 'az' ? 'A–Z' : 'Z–A';
  const algorithm = document.getElementById('algo')?.value || 'selection';
  document.getElementById('sortInfo').textContent =
    `${currentMeals.length} เมนู · เรียง ${orderLabel} · ${algorithm}`;
}

async function openDetail(mealId) {
  const id = Number(mealId);
  if (navStack.peek() !== id) navStack.push(id);
  await fetchAndRenderDetail(id);
}

async function showMealDetail(mealId) {
  await openDetail(mealId);
}

async function fetchAndRenderDetail(mealId) {
  try {
    const response = await fetch(`/meal/${encodeURIComponent(mealId)}`);
    const meal = await response.json();
    if (!response.ok) throw new Error(meal.error || 'ไม่สามารถดึงข้อมูลรายละเอียดได้');

    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    document.getElementById('recipeDetailContent').innerHTML = `
      <img class="detail-img" src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}">
      <h2 class="detail-title">${escapeHtml(meal.name)}</h2>
      <div class="detail-badge-group">
        <span class="detail-badge">Category: ${escapeHtml(meal.category || 'ไม่ระบุ')}</span>
        <span class="detail-badge">Area: ${escapeHtml(meal.area || 'ไม่ระบุ')}</span>
      </div>
      <section class="ingredients-section">
        <h3 class="ingredients-heading">Ingredients (ส่วนผสม)</h3>
        <ul class="ingredients-list">
          ${ingredients.map(item => `<li><strong>${escapeHtml(item.ingredient)}</strong>${item.measure ? ` - ${escapeHtml(item.measure)}` : ''}</li>`).join('')}
        </ul>
      </section>
      <h3>Instructions (วิธีทำ)</h3>
      <div class="instructions-text">${escapeHtml(meal.instructions || '')}</div>
    `;
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
  } catch (error) {
    showError(error.message);
  }
}

function goBack() {
  navStack.pop();
  if (!navStack.isEmpty()) {
    fetchAndRenderDetail(navStack.peek());
    return;
  }
  document.getElementById('detailView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
}

async function addToQueue(id) {
  try {
    const response = await fetch('/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'เพิ่มเมนูเข้าคิวไม่สำเร็จ');
    showError('');
    await Promise.all([updateWatchlist(), updateHistory()]);
  } catch (error) {
    showError(error.message);
  }
}

async function processQueue() {
  try {
    const response = await fetch('/watchlist/process', { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'เลือกเมนูถัดไปไม่สำเร็จ');
    showError('');
    await Promise.all([updateWatchlist(), updateHistory()]);
  } catch (error) {
    showError(error.message);
  }
}

async function undo() {
  try {
    const response = await fetch('/undo', { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'ย้อนรายการไม่สำเร็จ');
    showError('');
    await Promise.all([updateWatchlist(), updateHistory()]);
  } catch (error) {
    showError(error.message);
  }
}

async function updateWatchlist() {
  const response = await fetch('/watchlist');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'โหลดคิวไม่สำเร็จ');
  document.getElementById('queueSize').textContent = data.size;
  const list = document.getElementById('watchlist');
  list.innerHTML = data.items.length
    ? data.items.map((item, index) => `<li>${index + 1}. ${escapeHtml(item.name)}<span>${escapeHtml(item.area || '')}</span></li>`).join('')
    : '<li class="empty">ไม่มีคิวอาหารในขณะนี้</li>';
}

async function updateHistory() {
  const response = await fetch('/history');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'โหลดประวัติไม่สำเร็จ');
  const list = document.getElementById('history');
  list.innerHTML = data.history.length
    ? data.history.map(item => `<li>[${escapeHtml(item.action)}] ${escapeHtml(item.meal.name)} <span>${escapeHtml(item.time)}</span></li>`).join('')
    : '<li class="empty">ยังไม่มีประวัติการทำรายการ</li>';
}

async function loadQueue() {
  await updateWatchlist();
}

async function loadHistory() {
  await updateHistory();
}

function resetFilter() {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('areaFilter').value = '';
  searchBaseMeals = [...allMeals];
  currentMeals = [...allMeals];
  showError('');
  document.getElementById('detailView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
  navStack.items = [];
  sortAndRender();
  document.getElementById('resultInfo').textContent = `พบ ${allMeals.length} เมนู`;
}

async function clearSearch() {
  resetFilter();
}

async function startDashboard() {
  await Promise.all([loadCategories(), loadAreas()]);
  await loadDashboard();
}

document.addEventListener('DOMContentLoaded', startDashboard);