let allMeals = [];
let currentMeals = [];
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

async function loadDashboard() {
  const mealsContainer = document.getElementById('meals');
  mealsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>กำลังโหลดเมนูอาหาร...</p></div>';
  document.getElementById('error').style.display = 'none';

  try {
    const response = await fetch('/meals?sort=selection');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'โหลดข้อมูลไม่สำเร็จ');

    allMeals = Array.isArray(result.data) ? result.data : [];
    currentMeals = [...allMeals];
    createFilters(allMeals);
    renderMeals();
    await Promise.all([updateWatchlist(), updateHistory()]);
  } catch (error) {
    mealsContainer.innerHTML = `<div class="empty-state"><h3>โหลดข้อมูลไม่สำเร็จ</h3><p>${escapeHtml(error.message)}</p><button onclick="loadDashboard()">ลองใหม่</button></div>`;
    showError(error.message);
  }
}

function createFilters(meals) {
  const categories = [...new Set(meals.map((meal) => meal.category).filter(Boolean))];
  const areas = [...new Set(meals.map((meal) => meal.area).filter(Boolean))];
  const categorySelect = document.getElementById('categoryFilter');
  const areaSelect = document.getElementById('areaFilter');

  categorySelect.innerHTML = '<option value="">ทุก Category</option>' + categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join('');
  areaSelect.innerHTML = '<option value="">ทุก Area</option>' + areas
    .map((area) => `<option value="${escapeHtml(area)}">${escapeHtml(area)}</option>`)
    .join('');
}

function searchMeals() {
  applyCurrentFilters();
}

function applyCurrentFilters() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const area = document.getElementById('areaFilter').value;

  currentMeals = allMeals.filter((meal) => {
    const nameMatches = String(meal.name).toLowerCase().includes(keyword);
    return nameMatches && (!category || meal.category === category) && (!area || meal.area === area);
  });

  currentMeals = selectionSort(currentMeals, sortOrder === 'za');
  renderMeals();
}

function sortAZ() {
  sortOrder = 'az';
  applyCurrentFilters();
}

function sortZA() {
  sortOrder = 'za';
  applyCurrentFilters();
}

function selectionSort(meals, descending) {
  const sortedMeals = [...meals];

  for (let index = 0; index < sortedMeals.length - 1; index++) {
    let selectedIndex = index;
    for (let nextIndex = index + 1; nextIndex < sortedMeals.length; nextIndex++) {
      const currentName = String(sortedMeals[nextIndex].name).toLowerCase();
      const selectedName = String(sortedMeals[selectedIndex].name).toLowerCase();
      if (descending ? currentName > selectedName : currentName < selectedName) {
        selectedIndex = nextIndex;
      }
    }

    if (selectedIndex !== index) {
      [sortedMeals[index], sortedMeals[selectedIndex]] = [sortedMeals[selectedIndex], sortedMeals[index]];
    }
  }

  return sortedMeals;
}

function renderMeals() {
  const container = document.getElementById('meals');
  if (currentMeals.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><h3>ไม่พบเมนูอาหาร</h3><p>ลองเปลี่ยนคำค้นหา หรือเลือก Filter ใหม่</p></div>';
    updateSortInfo();
    return;
  }

  container.innerHTML = currentMeals.map((meal) => `
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
  document.getElementById('sortInfo').textContent = `${currentMeals.length} เมนู · เรียง ${orderLabel}`;
}

async function openDetail(mealId) {
  const id = Number(mealId);
  if (navStack.peek() !== id) navStack.push(id);
  await fetchAndRenderDetail(id);
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
          ${ingredients.map((item) => `<li><strong>${escapeHtml(item.ingredient)}</strong>${item.measure ? ` - ${escapeHtml(item.measure)}` : ''}</li>`).join('')}
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
  if (!data.items.length) {
    list.innerHTML = '<li class="empty">ไม่มีคิวอาหารในขณะนี้</li>';
    return;
  }

  list.innerHTML = data.items.map((item, index) => `<li>${index + 1}. ${escapeHtml(item.name)}</li>`).join('');
}

async function updateHistory() {
  const response = await fetch('/history');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'โหลดประวัติไม่สำเร็จ');

  const list = document.getElementById('history');
  if (!data.history.length) {
    list.innerHTML = '<li class="empty">ยังไม่มีประวัติการทำรายการ</li>';
    return;
  }

  list.innerHTML = data.history.map((item) => `<li>[${escapeHtml(item.action)}] ${escapeHtml(item.meal.name)} <span>${escapeHtml(item.time)}</span></li>`).join('');
}

function showError(message) {
  const errorBox = document.getElementById('error');
  errorBox.textContent = `เกิดข้อผิดพลาด: ${message}`;
  errorBox.style.display = 'block';
  window.clearTimeout(showError.timeoutId);
  showError.timeoutId = window.setTimeout(() => {
    errorBox.style.display = 'none';
  }, 4000);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resetFilter() {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('areaFilter').value = '';
  applyCurrentFilters();
}

loadDashboard();