import React, { useState } from 'react';

import { add } from '../utils/mathUtils';

export default function Optimizations() {
  const [result, setResult] = useState(null);
  const [a, setA] = useState('2');
  const [b, setB] = useState('3');

  const handleCalc = () => {
    setResult(add(Number(a), Number(b)));
  };

  const techniques = [
    {
      name: 'Code Splitting',
      desc: 'Бандл делится на чанки, которые загружаются по мере необходимости. Уменьшает Time to Interactive.',
      example: "import('./heavyModule')",
    },
    {
      name: 'Tree-shaking',
      desc: 'Неиспользуемый экспортированный код автоматически удаляется из бандла. Работает только с ES-модулями.',
      example: '// subtract и multiply не попадут в бандл',
    },
    {
      name: 'Lazy Loading',
      desc: 'Компоненты загружаются только при первом рендере. В React реализуется через React.lazy + Suspense.',
      example: 'const Page = lazy(() => import("./Page"))',
    },
    {
      name: 'Минификация',
      desc: 'Webpack использует Terser, Vite — esbuild. Удаляют пробелы, комментарии, укорачивают переменные.',
      example: 'mode: "production"',
    },
    {
      name: 'Хэширование',
      desc: 'Имя файла содержит хэш содержимого. Позволяет настроить агрессивный кэш: изменился код — изменилось имя.',
      example: '"[name].[contenthash:8].js"',
    },
    {
      name: 'Анализ бандла',
      desc: 'rollup-plugin-visualizer (Vite) и webpack-bundle-analyzer строят интерактивную карту зависимостей.',
      example: 'npm run build → bundle-report.html',
    },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Техники оптимизации</h1>
      <p className="page-subtitle">Этот модуль тоже загружен лениво</p>

      <div className="opt-grid">
        {techniques.map((t) => (
          <div key={t.name} className="opt-card">
            <div className="opt-icon">{t.icon}</div>
            <h3>{t.name}</h3>
            <p>{t.desc}</p>
            <code className="opt-code">{t.example}</code>
          </div>
        ))}
      </div>

      <div className="demo-box">
        <h2>🌳 Демо tree-shaking</h2>
        <p>
          Файл <code>mathUtils.js</code> экспортирует <code>add</code>, <code>subtract</code> и{' '}
          <code>multiply</code>. Здесь импортирована только <code>add</code> — остальные две
          функции не попадут в production-бандл.
        </p>
        <div className="calc">
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="calc-input"
          />
          <span className="calc-op">+</span>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="calc-input"
          />
          <button onClick={handleCalc} className="calc-btn">
            Вычислить
          </button>
          {result !== null && (
            <span className="calc-result">= {result}</span>
          )}
        </div>
      </div>
    </div>
  );
}
