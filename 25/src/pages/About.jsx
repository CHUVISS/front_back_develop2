import React from 'react';

export default function About() {
  return (
    <div className="page">
      <h1 className="page-title">О нас</h1>
      <p className="page-subtitle">Этот модуль загружен лениво (lazy loading)</p>

      <div className="about-grid">
        <div className="about-section">
          <h2>Дисциплина</h2>
          <p>Фронтенд и бэкенд разработка</p>
        </div>
        <div className="about-section">
          <h2>Институт</h2>
          <p>ИПТИП · Кафедра индустриального программирования</p>
        </div>
        <div className="about-section">
          <h2>Преподаватели</h2>
          <p>Загородних Николай Анатольевич</p>
          <p>Краснослободцева Дарья Борисовна</p>
        </div>
        <div className="about-section">
          <h2>Семестр</h2>
          <p>4 семестр, 2025/2026 уч. год</p>
        </div>
      </div>

      <div className="lazy-badge">
        <code>const About = lazy(() =&gt; import('./pages/About'))</code>
        <span>↑ именно так этот модуль подключён в App.jsx</span>
      </div>
    </div>
  );
}
