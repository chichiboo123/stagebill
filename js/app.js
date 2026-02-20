/* ========================================
   STAGEBILL - Main Application
   ======================================== */

let musicals = [];
let currentFilter = 'all';
let currentHeroMusical = null;

// ==========================================
// Data Loading
// ==========================================
async function loadData() {
  try {
    const response = await fetch('data/musicals.json');
    musicals = await response.json();
    initApp();
  } catch (err) {
    console.error('데이터 로딩 실패:', err);
  }
}

// ==========================================
// App Initialization
// ==========================================
function initApp() {
  setupNavbar();
  setupSearch();
  setRandomHero();
  renderContentRows('all');
  setupModal();
}

// ==========================================
// Navbar Scroll Effect
// ==========================================
function setupNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Category filter links
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;
      document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentFilter = filter;

      // Close search results
      document.getElementById('searchResults').style.display = 'none';
      document.getElementById('searchInput').value = '';
      document.getElementById('heroBanner').style.display = '';
      document.getElementById('contentArea').style.display = '';

      renderContentRows(filter);
    });
  });
}

// ==========================================
// Search Functionality
// ==========================================
function setupSearch() {
  const container = document.getElementById('searchContainer');
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');

  btn.addEventListener('click', () => {
    container.classList.toggle('active');
    if (container.classList.contains('active')) {
      input.focus();
    } else {
      input.value = '';
      hideSearchResults();
    }
  });

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim();
      if (query.length > 0) {
        performSearch(query);
      } else {
        hideSearchResults();
      }
    }, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      container.classList.remove('active');
      hideSearchResults();
    }
  });
}

function performSearch(query) {
  const q = query.toLowerCase();
  const results = musicals.filter(m => {
    const titleMatch = m.title.toLowerCase().includes(q);
    const descMatch = m.description.toLowerCase().includes(q);
    const categoryMatch = m.category.toLowerCase().includes(q);
    const curatorMatch = m.curator.toLowerCase().includes(q);
    const hashtagMatch = m.hashtags.some(h => h.toLowerCase().includes(q));
    const ideaMatch = m.ideaNotes.toLowerCase().includes(q);
    const numberMatch = m.recommendedNumbers.some(n =>
      n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    );
    return titleMatch || descMatch || categoryMatch || curatorMatch || hashtagMatch || ideaMatch || numberMatch;
  });

  showSearchResults(results, query);
}

function showSearchResults(results, query) {
  const section = document.getElementById('searchResults');
  const grid = document.getElementById('searchResultGrid');
  const title = document.getElementById('searchResultTitle');

  document.getElementById('heroBanner').style.display = 'none';
  document.getElementById('contentArea').style.display = 'none';
  section.style.display = 'block';

  title.textContent = `"${query}" 검색 결과 (${results.length}건)`;

  if (results.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <h3>검색 결과가 없습니다</h3>
        <p>다른 키워드나 해시태그로 검색해보세요.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = results.map(m => createCardHTML(m)).join('');
  attachCardEvents(grid);
}

function hideSearchResults() {
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('heroBanner').style.display = '';
  document.getElementById('contentArea').style.display = '';
}

// ==========================================
// Hero Banner
// ==========================================
function setRandomHero() {
  const idx = Math.floor(Math.random() * musicals.length);
  const m = musicals[idx];
  currentHeroMusical = m;

  const hero = document.getElementById('heroBanner');
  hero.style.background = `
    radial-gradient(ellipse at 70% 40%, ${m.color}44 0%, transparent 70%),
    linear-gradient(135deg, ${m.color}22 0%, var(--bg-primary) 100%)
  `;

  document.getElementById('heroTitle').textContent = m.title;
  document.getElementById('heroDescription').textContent = m.description;

  const hashtagsEl = document.getElementById('heroHashtags');
  hashtagsEl.innerHTML = m.hashtags.slice(0, 5).map(h =>
    `<span class="hashtag" onclick="searchByHashtag('${h}')">${h}</span>`
  ).join('');

  document.getElementById('heroDetailBtn').onclick = () => openModal(m);
  document.getElementById('heroRandomBtn').onclick = () => {
    setRandomHero();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

function searchByHashtag(tag) {
  const input = document.getElementById('searchInput');
  const container = document.getElementById('searchContainer');
  container.classList.add('active');
  input.value = tag;
  performSearch(tag);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetView() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchContainer').classList.remove('active');
  hideSearchResults();
  currentFilter = 'all';
  document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
  document.querySelector('.nav-links a[data-filter="all"]').classList.add('active');
  setRandomHero();
  renderContentRows('all');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Content Rows
// ==========================================
function renderContentRows(filter) {
  const area = document.getElementById('contentArea');
  area.innerHTML = '';

  let filtered = filter === 'all' ? musicals : musicals.filter(m => m.category === filter);

  if (filter === 'all') {
    // Group by category
    const categories = [...new Set(musicals.map(m => m.category))];

    // "Today's Pick" row with random shuffle
    const shuffled = [...musicals].sort(() => Math.random() - 0.5);
    area.appendChild(createRow("오늘의 PICK", shuffled));

    // Category rows
    categories.forEach(cat => {
      const items = musicals.filter(m => m.category === cat);
      area.appendChild(createRow(`${getCategoryEmoji(cat)} ${cat}`, items));
    });

    // "Curator's Choice" row
    const curators = [...new Set(musicals.map(m => m.curator))];
    curators.forEach(cur => {
      const items = musicals.filter(m => m.curator === cur);
      if (items.length > 0) {
        area.appendChild(createRow(`${cur} 추천`, items));
      }
    });
  } else {
    area.appendChild(createRow(`${getCategoryEmoji(filter)} ${filter} 작품`, filtered));

    // Also show random recommendations from other categories
    const others = musicals.filter(m => m.category !== filter).sort(() => Math.random() - 0.5).slice(0, 6);
    if (others.length > 0) {
      area.appendChild(createRow("다른 카테고리도 둘러보세요", others));
    }
  }
}

function getCategoryEmoji(cat) {
  const map = { '일상': '🎭', '컬러': '🎨', '진로': '🧭' };
  return map[cat] || '🎵';
}

function createRow(title, items) {
  const row = document.createElement('div');
  row.className = 'content-row fade-in';
  row.innerHTML = `
    <h2 class="row-title">${title}</h2>
    <div class="row-slider">
      ${items.map(m => createCardHTML(m)).join('')}
    </div>
  `;
  attachCardEvents(row);
  return row;
}

// ==========================================
// Card Component
// ==========================================
function createCardHTML(m) {
  const categoryClass = `category-${m.category}`;
  const hashtags = m.hashtags.slice(0, 3).map(h =>
    `<span class="hashtag-sm" onclick="event.stopPropagation(); searchByHashtag('${h}')">${h}</span>`
  ).join('');

  return `
    <div class="card" data-id="${m.id}">
      <div class="card-thumbnail" style="background: linear-gradient(135deg, ${m.color}cc, ${m.color}44);">
        <div class="card-pattern"></div>
        <span class="card-title-display">${m.title}</span>
      </div>
      <div class="card-info">
        <div class="card-info-title">${m.title}</div>
        <div class="card-info-meta">
          <span class="card-category-badge ${categoryClass}">${m.category}</span>
          <span>${m.year}</span>
        </div>
        <div class="card-hashtags">${hashtags}</div>
      </div>
    </div>
  `;
}

function attachCardEvents(container) {
  container.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const musical = musicals.find(m => m.id === id);
      if (musical) openModal(musical);
    });
  });
}

// ==========================================
// Modal (Detail View)
// ==========================================
function setupModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(m) {
  const overlay = document.getElementById('modalOverlay');
  const categoryClass = `category-${m.category}`;

  // Hero background
  const modalHero = document.getElementById('modalHero');
  modalHero.style.background = `
    radial-gradient(ellipse at 50% 30%, ${m.color}66 0%, transparent 70%),
    linear-gradient(135deg, ${m.color}33 0%, var(--bg-secondary) 100%)
  `;

  document.getElementById('modalTitle').textContent = m.title;

  const catEl = document.getElementById('modalCategory');
  catEl.textContent = m.category;
  catEl.className = `modal-category ${categoryClass}`;

  document.getElementById('modalCurator').textContent = `큐레이터: ${m.curator}`;
  document.getElementById('modalYear').textContent = m.year;
  document.getElementById('modalDescription').textContent = m.description;

  // Recommended Numbers
  const numbersEl = document.getElementById('modalNumbers');
  numbersEl.innerHTML = m.recommendedNumbers.map((n, i) => `
    <div class="number-item">
      <span class="number-index">${i + 1}</span>
      <div class="number-info">
        <div class="number-title">${n.title}</div>
        <div class="number-desc">${n.description}</div>
      </div>
    </div>
  `).join('');

  // Idea Notes
  document.getElementById('modalIdeaNotes').textContent = m.ideaNotes;

  // Playlist
  const playlistEl = document.getElementById('modalPlaylist');
  playlistEl.href = m.playlistLink;

  // Hashtags
  const hashtagsEl = document.getElementById('modalHashtags');
  hashtagsEl.innerHTML = m.hashtags.map(h =>
    `<span class="hashtag" onclick="closeModal(); searchByHashtag('${h}')">${h}</span>`
  ).join('');

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', loadData);
