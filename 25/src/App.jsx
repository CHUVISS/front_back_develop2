import React, { Suspense, lazy } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';

// Маршрут 1: главная страница — статический импорт (загружается сразу)
import Home from './pages/Home';

// Маршрут 2: страница «О нас» — lazy loading (загружается только при переходе)
// Бандлер вынесет AboutPage и все её зависимости в отдельный чанк
const About = lazy(() => import('./pages/About'));

// Маршрут 3: страница «Оптимизации» — тоже lazy
const Optimizations = lazy(() => import('./pages/Optimizations'));

function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="spinner" />
      <p>Загрузка модуля...</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <span className="logo">Практика 25</span>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Главная</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>О нас</NavLink>
            <NavLink to="/optimizations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Оптимизации</NavLink>
          </nav>
      </header>

      <main className="main">
        {/* Suspense оборачивает все lazy-маршруты и показывает fallback во время загрузки */}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/optimizations" element={<Optimizations />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="footer">
        <p>Фронтенд и бэкенд разработка · 4 семестр 2025/2026 · ИПТИП</p>
      </footer>
    </div>
  );
}
