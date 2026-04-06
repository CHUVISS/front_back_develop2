const $ = id => document.getElementById(id);
const saveTasks = tasks => localStorage.setItem('sw_tasks', JSON.stringify(tasks));
const loadTasks = () => { try { return JSON.parse(localStorage.getItem('sw_tasks') || '[]'); } catch { return []; } };
const formatDate = ts => {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit' }) + ' ' +
         d.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
};
const escapeHTML = str => str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

let tasks = loadTasks();
let filter = 'all';
let currentView = 'home';

// 🌐 SPA-навигация
function showView(view) {
  currentView = view;
  const nav = $('nav-link');
  $('view-home').style.display  = view === 'home'  ? 'block' : 'none';
  $('view-about').style.display = view === 'about' ? 'block' : 'none';
  nav.textContent = view === 'home' ? 'О нас' : 'Домой';
}
$('nav-link').addEventListener('click', e => { e.preventDefault(); showView(currentView === 'home' ? 'about' : 'home'); });

// 🎨 Рендер
function render() {
  const list = $('task-list');
  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return  t.done;
    return true;
  });
  const total  = tasks.length;
  const done   = tasks.filter(t => t.done).length;
  const active = total - done;

  $('stat-total').textContent  = total;
  $('stat-active').textContent = active;
  $('stat-done').textContent   = done;
  $('left-count').textContent  = `Активных: ${active}`;

  if (visible.length === 0) {
    const msgs = {
      all:    { icon:'📋', title:'Список пуст',    sub:'Добавьте первую задачу выше' },
      active: { icon:'🎉', title:'Всё выполнено!', sub:'Активных задач нет' },
      done:   { icon:'⏳', title:'Пока ничего',     sub:'Выполненных задач нет' }
    };
    const m = msgs[filter];
    list.innerHTML = `<div class="empty"><div class="empty-icon">${m.icon}</div><div class="empty-title">${m.title}</div><div class="empty-sub">${m.sub}</div></div>`;
    return;
  }
  list.innerHTML = visible.map(t => `
    <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="task-checkbox" data-action="toggle">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="task-text">${escapeHTML(t.text)}</span>
      <span class="task-date">${formatDate(t.createdAt)}</span>
      <button class="task-delete" data-action="delete" title="Удалить">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </li>`).join('');
}

// ➕ CRUD
function addTask(text) {
  if (!text.trim()) return;
  const task = { id: Date.now(), text: text.trim(), done: false, createdAt: Date.now() };
  tasks.unshift(task); saveTasks(tasks); render();
  // Отправляем на сервер для рассылки
  if (socket.connected) socket.emit('newTask', task);
}
function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(tasks); render(); }
}
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id); saveTasks(tasks); render();
}
function clearDone() {
  tasks = tasks.filter(t => !t.done); saveTasks(tasks); render();
}

// 🎛 Обработчики
$('add-btn').addEventListener('click', () => { const inp = $('task-input'); addTask(inp.value); inp.value = ''; inp.focus(); });
$('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') { addTask(e.target.value); e.target.value = ''; } });
$('task-list').addEventListener('click', e => {
  const item = e.target.closest('.task-item'); if (!item) return;
  const id = Number(item.dataset.id);
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (act === 'toggle') toggleTask(id);
  if (act === 'delete') deleteTask(id);
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

// 📡 Статус сети
function updateStatus() {
  const badge = $('status-badge'), txt = $('status-text');
  badge.className = navigator.onLine ? 'online' : 'offline';
  txt.textContent = navigator.onLine ? 'Онлайн' : 'Офлайн';
}
window.addEventListener('online', updateStatus); window.addEventListener('offline', updateStatus); updateStatus();

// 🔄 Socket.IO
const socket = io();
socket.on('taskAdded', task => {
  const exists = tasks.some(t => t.id === task.id || (t.text === task.text && Math.abs(t.createdAt - task.timestamp) < 2000));
  if (!exists) {
    tasks.unshift({ id: task.id || Date.now(), text: task.text, done: false, createdAt: task.timestamp || Date.now() });
    saveTasks(tasks); render();
  }
  showToast('🔔 Новая задача: ' + task.text);
});

// 🔔 Push-подписка
const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
function b64ToUint8(str) {
  const pad = '='.repeat((4 - str.length % 4) % 4);
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64); const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID_KEY) });
    await fetch('/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
    $('enable-push').style.display  = 'none';
    $('disable-push').style.display = 'inline-block';
    showToast('✅ Уведомления включены');
  } catch (e) { console.error('[Push] Ошибка:', e); }
}
async function unsubscribePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await fetch('/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
    $('enable-push').style.display  = 'inline-block';
    $('disable-push').style.display = 'none';
    showToast('🔕 Уведомления отключены');
  }
}

// 🚀 Инициализация
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'activated') showToast('🔄 Service Worker обновлён'); });
      });
      // Проверка существующей подписки
      const sub = await reg.pushManager.getSubscription();
      if (sub) { $('enable-push').style.display = 'none'; $('disable-push').style.display = 'inline-block'; }
    } catch (e) { console.error('[SW] Ошибка:', e); }
  });
}
$('enable-push').addEventListener('click', async () => {
  if (Notification.permission === 'denied') return alert('Разрешите уведомления в настройках браузера.');
  if (Notification.permission === 'default') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return alert('Необходимо разрешить уведомления.');
  }
  await subscribePush();
});
$('disable-push').addEventListener('click', unsubscribePush);

function showToast(msg) {
  const t = $('sw-toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

render();