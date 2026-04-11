// ─── ИЗМЕНЕНИЕ: версия кеша обновлена до v5 — принудительная переустановка SW ───
const CACHE_NAME = 'tasks-app-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-192x192.png',
  '/icons/favicon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Установка
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Не удалось закешировать:', url, e))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Перехват запросов (Cache-first)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  // Не кешируем socket.io и API-эндпоинты
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/socket.io') ||
      url.pathname === '/subscribe' ||
      url.pathname === '/unsubscribe' ||
      url.pathname === '/snooze') return; // ─── ИЗМЕНЕНИЕ: исключаем /snooze из кеша (Шаг 1.3) ───

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response?.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') return caches.match('/index.html');
        return new Response('Офлайн: ресурс недоступен', { status: 503 });
      });
    })
  );
});

// ─── Push-уведомления ────────────────────────────────────────────────────────
// ─── ИЗМЕНЕНИЕ: обновлён обработчик push — добавлен reminderId и кнопка «Отложить» (Шаг 1.3) ───
self.addEventListener('push', event => {
  // ИЗМЕНЕНИЕ: инициализируем reminderId как null по умолчанию
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }

  const options = {
    body:    data.body,
    icon:    '/icons/favicon-192x192.png',
    badge:   '/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    // ИЗМЕНЕНИЕ: передаём reminderId в data уведомления для использования в notificationclick
    data:    { url: '/', reminderId: data.reminderId },
  };

  // ИЗМЕНЕНИЕ: кнопку «Отложить на 5 минут» добавляем только для напоминаний (если есть reminderId)
  if (data.reminderId) {
    options.actions = [
      { action: 'snooze',  title: 'Отложить на 5 минут' },
      { action: 'dismiss', title: 'Закрыть' },
    ];
  } else {
    options.actions = [
      { action: 'open',    title: 'Открыть' },
      { action: 'dismiss', title: 'Закрыть' },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
// ─── КОНЕЦ ИЗМЕНЕНИЯ ───

// ─── ИЗМЕНЕНИЕ: обновлён notificationclick — добавлена обработка действия snooze (Шаг 1.3) ───
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action       = event.action;

  // ИЗМЕНЕНИЕ: обработка кнопки «Отложить на 5 минут»
  if (action === 'snooze') {
    const reminderId = notification.data && notification.data.reminderId;
    event.waitUntil(
      fetch('/snooze?reminderId=' + reminderId, { method: 'POST' })
        .then(() => {
          notification.close();
          console.log('[SW] Напоминание отложено на 5 минут, id:', reminderId);
        })
        .catch(err => console.error('[SW] Snooze failed:', err))
    );
    return;
  }

  // ИЗМЕНЕНИЕ: кнопка «Закрыть» — просто закрываем уведомление
  if (action === 'dismiss') {
    notification.close();
    return;
  }

  // При клике на само уведомление или кнопку «Открыть» — открываем/фокусируем вкладку
  notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});
// ─── КОНЕЦ ИЗМЕНЕНИЯ ───

// Сообщения от клиента
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});