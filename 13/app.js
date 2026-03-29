const $ = id => document.getElementById(id);

const saveTasks = tasks => localStorage.setItem('sw_tasks', JSON.stringify(tasks));
const loadTasks = () => {
  try { return JSON.parse(localStorage.getItem('sw_tasks') || '[]'); }
  catch { return []; }
};

const formatDate = ts => {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

let tasks = loadTasks();
let filter = 'all';

function render() {
  const list = $('task-list');
  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const active = total - done;

  $('stat-total').textContent = total;
  $('stat-active').textContent = active;
  $('stat-done').textContent = done;
  $('left-count').textContent = `Активных: ${active}`;

  if (visible.length === 0) {
    const msgs = {
      all: { icon: '📋', title: 'Список пуст', sub: 'Добавьте первую задачу выше' },
      active: { icon: '🎉', title: 'Всё выполнено!', sub: 'Активных задач нет' },
      done: { icon: '⏳', title: 'Пока ничего', sub: 'Выполненных задач нет' },
    };
    const m = msgs[filter];
    list.innerHTML = `
      <div class="empty">
        <div class="empty-icon">${m.icon}</div>
        <div class="empty-title">${m.title}</div>
        <div class="empty-sub">${m.sub}</div>
      </div>`;
    return;
  }

  list.innerHTML = visible.map(t => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="task-checkbox" data-action="toggle">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="#0d0d0d" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="task-text">${escapeHTML(t.text)}</span>
      <span class="task-date">${formatDate(t.createdAt)}</span>
      <button class="task-delete" data-action="delete" title="Удалить">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round"/>
        </svg>
      </button>
    </li>
  `).join('');
}

const escapeHTML = str => str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function addTask(text) {
  if (!text.trim()) return;
  tasks.unshift({ id: Date.now(), text: text.trim(), done: false, createdAt: Date.now() });
  saveTasks(tasks);
  render();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(tasks); render(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  render();
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  saveTasks(tasks);
  render();
}

// Обработчики событий
$('add-btn').addEventListener('click', () => {
  const input = $('task-input');
  addTask(input.value);
  input.value = '';
  input.focus();
});

$('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addTask(e.target.value);
    e.target.value = '';
  }
});

$('task-list').addEventListener('click', e => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = Number(item.dataset.id);
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'toggle') toggleTask(id);
  if (action === 'delete') deleteTask(id);
});

$('clear-done').addEventListener('click', clearDone);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
  });
});

// Статус сети
function updateStatus() {
  const badge = $('status-badge');
  const text = $('status-text');
  if (navigator.onLine) {
    badge.className = 'online';
    text.textContent = 'Онлайн';
  } else {
    badge.className = 'offline';
    text.textContent = 'Офлайн';
  }
}
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            showToast('✓ Service Worker обновлён');
          }
        });
      });
      if (reg.active) showToast('✓ Офлайн-режим активен');
    } catch (err) {
      console.error('[SW] Ошибка:', err);
    }
  });
}

function showToast(msg) {
  const toast = $('sw-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

render();