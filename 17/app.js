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

const escapeHTML = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let tasks  = loadTasks();
let filter = 'all';

// Socket.IO
const socket = io();

socket.on('taskAdded', (task) => {
  console.log('[WS] Получена задача:', task.text);
  showWsNotification('Новая задача: ' + task.text, null);
});

socket.on('reminderFired', (reminder) => {
  console.log('[WS] Напоминание сработало:', reminder.text);
  showWsNotification('⏰ ' + reminder.text, reminder.id);
});

socket.on('connect',    () => console.log('[WS] Подключён:', socket.id));
socket.on('disconnect', () => console.log('[WS] Отключён'));

// SPA-навигация
let currentView = 'home';

function showView(view) {
  currentView = view;
  const navLink = $('nav-link');
  if (view === 'about') {
    $('view-home').style.display  = 'none';
    $('view-about').style.display = 'block';
    navLink.textContent = 'Домой';
  } else {
    $('view-about').style.display = 'none';
    $('view-home').style.display  = 'block';
    navLink.textContent = 'О нас';
  }
}

$('nav-link').addEventListener('click', e => {
  e.preventDefault();
  showView(currentView === 'home' ? 'about' : 'home');
});

// Рендер
function render() {
  const list    = $('task-list');
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
  $('left-count').textContent  = 'Активных: ' + active;

  if (visible.length === 0) {
    const msgs = {
      all:    { icon: '📋', title: 'Список пуст',   sub: 'Добавьте первую задачу выше' },
      active: { icon: '🎉', title: 'Всё выполнено!', sub: 'Активных задач нет' },
      done:   { icon: '⏳', title: 'Пока ничего',    sub: 'Выполненных задач нет' },
    };
    const m = msgs[filter];
    list.innerHTML =
      '<div class="empty">' +
        '<div class="empty-icon">' + m.icon + '</div>' +
        '<div class="empty-title">' + m.title + '</div>' +
        '<div class="empty-sub">' + m.sub + '</div>' +
      '</div>';
    return;
  }

  list.innerHTML = visible.map(t => {
    const reminderBadge = t.reminder
      ? '<span class="task-date" style="color:#f59e0b;">⏰ ' + formatDate(t.reminder) + '</span>'
      : '';

    return '<li class="task-item ' + (t.done ? 'done' : '') + '" data-id="' + t.id + '">' +
      '<div class="task-checkbox" data-action="toggle">' +
        '<svg width="12" height="10" viewBox="0 0 12 10" fill="none">' +
          '<path d="M1 5l3.5 3.5L11 1" stroke="#0d0d0d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
      '<span class="task-text">' + escapeHTML(t.text) + '</span>' +
      '<span class="task-date">' + formatDate(t.createdAt) + '</span>' +
      reminderBadge +
      '<button class="task-delete" data-action="delete" title="Удалить">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
          '<path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
    '</li>';
  }).join('');
}

// CRUD
function addTask(text) {
  if (!text.trim()) return;
  const task = { id: Date.now(), text: text.trim(), done: false, createdAt: Date.now() };
  tasks.unshift(task);
  saveTasks(tasks);
  render();
  socket.emit('newTask', { text: task.text, timestamp: task.createdAt });
}

function addTaskWithReminder(text, reminderTimestamp) {
  if (!text.trim()) return;
  const task = {
    id: Date.now(),
    text: text.trim(),
    done: false,
    createdAt: Date.now(),
    reminder: reminderTimestamp  // timestamp напоминания
  };
  tasks.unshift(task);
  saveTasks(tasks);
  render();
  socket.emit('newReminder', {
    id: task.id,
    text: task.text,
    reminderTime: reminderTimestamp
  });
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

// UI-обработчики
$('add-btn').addEventListener('click', () => {
  const input = $('task-input');
  addTask(input.value);
  input.value = '';
  input.focus();
});

$('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { addTask(e.target.value); e.target.value = ''; }
});

$('task-list').addEventListener('click', e => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id     = Number(item.dataset.id);
  const action = e.target.closest('[data-action]') && e.target.closest('[data-action]').dataset.action;
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

$('reminder-btn').addEventListener('click', () => {
  const text     = $('reminder-text').value.trim();
  const datetime = $('reminder-time').value;

  if (!text) {
    alert('Введите текст напоминания');
    return;
  }
  if (!datetime) {
    alert('Выберите дату и время напоминания');
    return;
  }

  const timestamp = new Date(datetime).getTime();
  if (timestamp <= Date.now()) {
    alert('Дата напоминания должна быть в будущем');
    return;
  }

  addTaskWithReminder(text, timestamp);
  $('reminder-text').value = '';
  $('reminder-time').value = '';
  $('reminder-text').focus();
});

// Статус сети
function updateStatus() {
  const badge = $('status-badge');
  const text  = $('status-text');
  if (navigator.onLine) {
    badge.className  = 'online';
    text.textContent = 'Онлайн';
  } else {
    badge.className  = 'offline';
    text.textContent = 'Офлайн';
  }
}
window.addEventListener('online',  updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// Push-уведомления
var VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var output  = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    var registration = await navigator.serviceWorker.ready;
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(subscription)
    });
    console.log('[Push] Подписка оформлена');
  } catch (err) {
    console.error('[Push] Ошибка подписки:', err);
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  var registration = await navigator.serviceWorker.ready;
  var subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch('/unsubscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
    console.log('[Push] Подписка отменена');
  }
}

// Service Worker + кнопки уведомлений
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      var reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Зарегистрирован');

      reg.addEventListener('updatefound', () => {
        var nw = reg.installing;
        if (nw) nw.addEventListener('statechange', function () {
          if (this.state === 'activated') showToast('Service Worker обновлён');
        });
      });

      var enableBtn  = $('enable-push');
      var disableBtn = $('disable-push');

      if (enableBtn && disableBtn) {
        var existing = await reg.pushManager.getSubscription();
        if (existing) {
          enableBtn.style.display  = 'none';
          disableBtn.style.display = 'inline-block';
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            var perm = await Notification.requestPermission();
            if (perm !== 'granted') { alert('Необходимо разрешить уведомления.'); return; }
          }
          await subscribeToPush();
          enableBtn.style.display  = 'none';
          disableBtn.style.display = 'inline-block';
          showToast('Уведомления включены');
        });

        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display  = 'inline-block';
          showToast('Уведомления отключены');
        });
      }

      if (reg.active) showToast('Офлайн-режим активен');
    } catch (err) {
      console.error('[SW] Ошибка:', err);
    }
  });
}

// Toast
function showToast(msg) {
  var toast      = $('sw-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function showWsNotification(text, reminderId) {
  var note = document.createElement('div');
  note.style.cssText =
    'position:fixed;top:16px;right:16px;' +
    'background:var(--accent);color:#fff;' +
    'padding:14px 18px;border-radius:var(--radius);' +
    'font-size:14px;font-weight:500;' +
    'box-shadow:var(--shadow-hover);z-index:200;max-width:300px;' +
    'display:flex;flex-direction:column;gap:10px;';

  var msg = document.createElement('span');
  msg.textContent = text;
  note.appendChild(msg);

  // кнопку «Отложить» показываем только для напоминаний
  if (reminderId) {
    var btn = document.createElement('button');
    btn.textContent = '⏸ Отложить на 5 минут';
    btn.style.cssText =
      'background:#fff;color:var(--accent);border:none;' +
      'border-radius:6px;padding:7px 12px;font-size:13px;' +
      'font-weight:600;cursor:pointer;';
    btn.addEventListener('click', function() {
      fetch('/snooze?reminderId=' + reminderId, { method: 'POST' })
        .then(() => { note.remove(); showToast('Напоминание отложено на 5 минут'); })
        .catch(err => console.error('[Snooze] Ошибка:', err));
    });
    note.appendChild(btn);
  }

  document.body.appendChild(note);
  // ИЗМЕНЕНИЕ: для напоминаний даём больше времени на реакцию (10 сек)
  setTimeout(() => { if (note.parentNode) note.remove(); }, reminderId ? 10000 : 3500);
}

// Запуск
render();