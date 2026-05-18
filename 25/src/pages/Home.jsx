import React from 'react';

export default function Home() {
  return (
    <div className="page">
      <h1 className="page-title">Инструменты сборки</h1>
      <p className="page-subtitle">Практическое занятие 25 — Webpack и Vite</p>

      <div className="cards">
        <div className="card card--webpack">
          <h2>Webpack</h2>
          <p>Зрелый бандлер с 2012 года. Строит граф зависимостей и собирает бандл при старте dev-сервера. Идеален для enterprise-проектов.</p>
          <ul>
            <li>Entry / Output / Loaders / Plugins</li>
            <li>Холодный старт: секунды–минуты</li>
            <li>Production: Webpack + Terser</li>
          </ul>
        </div>

        <div className="card card--vite">
          <h2>Vite</h2>
          <p>Инструмент нового поколения с 2020 года. В dev-режиме не собирает бандл — браузер загружает ES-модули напрямую.</p>
          <ul>
            <li>Нативные ES-модули в dev</li>
            <li>Холодный старт: &lt; 1 секунды</li>
            <li>Production: Rollup + esbuild</li>
          </ul>
        </div>
      </div>

      <div className="info-box">
        Страницы «О нас» и «Оптимизации» загружаются через <code>React.lazy</code> + <code>Suspense</code> — откройте DevTools → Network и смотрите на подгружаемые чанки при переходе.
      </div>
    </div>
  );
}
