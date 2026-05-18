// Демонстрация tree-shaking:
// Этот файл экспортирует три функции.
// В Optimizations.jsx импортируется только `add`.
// При production-сборке `subtract` и `multiply` будут удалены из бандла,
// так как используются ES-модули (import/export), статически анализируемые бандлером.

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}
