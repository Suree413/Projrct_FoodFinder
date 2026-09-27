let allMeals = [];
let currentMeals = [];
let searchBaseMeals = [];
let sortOrder = 'az';

class Stack {
  constructor() {
    this.items = [];
  }

  push(meal) {
    this.items.push(meal);
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

  size() {
    return this.items.length;
  }
}

const navigationStack = new Stack();

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
  const displayMessage = /[\u0e00-\u0e7f]/.test(String(message || ''))
    ? 'The request could not be completed. Please try again.'
    : message;
  errorBox.textContent = displayMessage ? `Something went wrong: ${displayMessage}` : '';
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
  fillFilter('categoryFilter', 'All categories', categories);
  fillFilter('areaFilter', 'All areas', areas);
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
    if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load categories');
    fillFilter('categoryFilter', 'All categories', result.data);
  } catch (error) {
    console.error(error);
    if (!allMeals.length) showError('Unable to load categories');
  }
}

async function loadAreas() {
  try {
    const response = await fetch('/api/areas');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load areas');
    fillFilter('areaFilter', 'All areas', result.data);
  } catch (error) {
    console.error(error);
    if (!allMeals.length) showError('Unable to load areas');
  }
}

async function loadDashboard() {
  const mealsContainer = document.getElementById('meals');
  mealsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Setting the table...</p></div>';
  showError('');

  try {
    const response = await fetch('/api/meals');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Failed to load data');

    allMeals = Array.isArray(result.data) ? result.data : [];
    searchBaseMeals = [...allMeals];
    currentMeals = [...allMeals];
    if (document.getElementById('resultInfo')) {
      document.getElementById('resultInfo').textContent = `Found ${allMeals.length} meals`;
    }
    sortAndRender();
    await updateWatchlist();
  } catch (error) {
    mealsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">🥣</div><h3>We could not load the menu</h3><p>Please try again in a moment.</p><button class="button button-coral" type="button" onclick="loadDashboard()">Try again</button></div>';
    showError('Unable to load meals. Please try again.');
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
    if (!response.ok || !result.success) throw new Error(result.message || 'Search failed');
    searchBaseMeals = Array.isArray(result.data) ? result.data : [];
    applyCurrentFilters();
    document.getElementById('resultInfo').textContent =
      `Found ${currentMeals.length} meals for "${result.keyword}"`;
  } catch (error) {
    console.error(error);
    showError(error.message || 'An error occurred while searching');
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
    if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load data');
    searchBaseMeals = Array.isArray(result.data) ? result.data : [];
    currentMeals = [...searchBaseMeals];
    document.getElementById('resultInfo').textContent = result.count === 0
      ? 'No meals found for these filters.'
      : `Found ${result.count} meals`;
    sortAndRender();
  } catch (error) {
    console.error(error);
    showError(error.message || 'An error occurred while loading data');
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
    document.getElementById('resultInfo').textContent = `Found ${currentMeals.length} meals`;
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

function sortAndRender(meals = currentMeals) {
  const descending = sortOrder === 'za';
  const start = performance.now();
  currentMeals = selectionSort(meals, descending);
  const elapsed = (performance.now() - start).toFixed(3);
  document.getElementById('sortInfo').textContent =
    `Selection Sort · ${sortOrder.toUpperCase()} · ${elapsed} ms`;
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
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><h3>No meals found</h3><p>Try another search or choose different filters.</p></div>';
    updateSortInfo();
    return;
  }

  container.innerHTML = currentMeals.map(meal => `
    <article class="meal-card" role="link" tabindex="0" aria-label="Open ${escapeHtml(meal.name)} details" onclick="openDetail(${Number(meal.id)})" onkeydown="if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openDetail(${Number(meal.id)}); }">
      <div class="meal-image-wrapper">
        <img src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}" class="meal-image" loading="lazy">
      </div>
      <div class="meal-content">
        <h3 class="meal-name">${escapeHtml(meal.name)}</h3>
        <div class="meal-meta">
          <span class="tag">${escapeHtml(meal.category || 'Uncategorized')}</span>
          <span class="tag area-tag">${escapeHtml(meal.area || 'Area unavailable')}</span>
        </div>
        <div class="meal-actions">
          <button class="button button-coral" type="button" onclick="event.stopPropagation(); addToQueue(${Number(meal.id)})">+ Add to Queue</button>
        </div>
      </div>
    </article>
  `).join('');
  updateSortInfo();
}

function updateSortInfo() {
  const orderLabel = sortOrder === 'az' ? 'A-Z' : 'Z-A';
  document.getElementById('sortInfo').textContent =
    `Selection Sort · ${orderLabel}`;
}

async function openDetail(mealId, addToStack = true) {
  const id = Number(mealId);
  const meal = await fetchMealDetail(id);
  if (!meal) return;
  if (addToStack && navigationStack.peek()?.id !== meal.id) {
    navigationStack.push(meal);
  }
  renderDetail(meal);
}

async function showMealDetail(mealId) {
  await openDetail(mealId);
}

async function fetchMealDetail(mealId) {
  try {
    const response = await fetch(`/api/meals/${encodeURIComponent(mealId)}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to load meal details');
    }
    return result.data;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

function renderDetail(meal) {
    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    document.getElementById('recipeDetailContent').innerHTML = `
      <img class="detail-img" src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name)}">
      <h2 class="detail-title">${escapeHtml(meal.name)}</h2>
      <span class="detail-id">Meal ID: ${escapeHtml(meal.id)}</span>
      <div class="detail-badge-group">
        <span class="detail-badge">Category: ${escapeHtml(meal.category || 'Not specified')}</span>
        <span class="detail-badge area-badge">Area: ${escapeHtml(meal.area || 'Not specified')}</span>
      </div>
      <section class="detail-section">
        <h3>Ingredients</h3>
        <ul class="ingredients-list">
          ${ingredients.map(item => `<li><strong>${escapeHtml(item.ingredient)}</strong>${item.measure ? ` - ${escapeHtml(item.measure)}` : ''}</li>`).join('')}
        </ul>
      </section>
      <section class="detail-section">
        <h3>Instructions</h3>
        <div class="instructions-text">${escapeHtml(meal.instructions || 'No instructions are available for this meal.')}</div>
      </section>
      <div class="detail-actions">
        <button class="button button-coral" type="button" onclick="addToQueue(${Number(meal.id)})">+ Add to Queue</button>
      </div>
    `;
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
}

async function randomMeal() {
  try {
    const response = await fetch('/api/random');
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to get a random meal');
    }
    if (navigationStack.peek()?.id !== result.data.id) {
      navigationStack.push(result.data);
    }
    renderDetail(result.data);
    showError('');
  } catch (error) {
    showError(error.message);
  }
}

function goBack() {
  if (navigationStack.isEmpty()) {
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    return;
  }

  if (navigationStack.size() > 1) {
    navigationStack.pop();
    const previousMeal = navigationStack.peek();
    renderDetail(previousMeal);
    return;
  }

  navigationStack.pop();
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
    if (!response.ok) throw new Error(result.error || 'Failed to add meal to queue');
    showError('');
    await updateWatchlist();
  } catch (error) {
    showError(error.message);
  }
}

async function processQueue() {
  try {
    const response = await fetch('/watchlist/process', { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to select the next meal');
    showError('');
    await updateWatchlist();
    await openDetail(result.meal.id);
  } catch (error) {
    showError(error.message);
  }
}

async function updateWatchlist() {
  const response = await fetch('/watchlist');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to load queue');
  document.getElementById('queueSize').textContent = data.size;
  document.getElementById('processQueueButton').disabled = data.size === 0;
  const list = document.getElementById('watchlist');
  list.innerHTML = data.items.length
    ? data.items.map((item, index) => `
      <li class="queue-item">
        <span class="queue-number">${String(index + 1).padStart(2, '0')}</span>
        <img class="queue-image" src="${escapeHtml(item.image)}" alt="" loading="lazy">
        <span class="queue-meal">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="queue-meta">${escapeHtml(item.category || 'Uncategorized')} · ${escapeHtml(item.area || 'Area unavailable')}</span>
        </span>
      </li>`).join('')
    : '<li class="queue-empty"><span>🍽️</span>Your queue is waiting for a meal.</li>';
}

async function loadQueue() {
  await updateWatchlist();
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
  while (!navigationStack.isEmpty()) navigationStack.pop();
  sortAndRender();
  document.getElementById('resultInfo').textContent = `Found ${allMeals.length} meals`;
}

async function clearSearch() {
  resetFilter();
}

async function startDashboard() {
  await Promise.all([loadCategories(), loadAreas()]);
  await loadDashboard();
}

document.addEventListener('DOMContentLoaded', startDashboard);