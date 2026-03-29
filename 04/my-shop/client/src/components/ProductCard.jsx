import React from "react";

export default function ProductCard({ product, onEdit, onDelete }) {
  const priceFormatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="card">
      <div className="card__image">
        <img src={product.image} alt={product.title} />
      </div>
      <div className="card__body">
        <div className="card__category">{product.category}</div>
        <h3 className="card__title">{product.title}</h3>
        <div className="card__desc">{product.description}</div>
        <div className="card__meta">
          <span className="card__price">{priceFormatted}</span>
          <span className="card__rating">★ {product.rating}</span>
        </div>
        <div className="card__stock">На складе: {product.quantity} шт.</div>
      </div>
      <div className="card__actions">
        <button className="btn btn--small" onClick={() => onEdit(product)}>
          ✎
        </button>
        <button className="btn btn--small btn--danger" onClick={() => onDelete(product.id)}>
          🗑
        </button>
      </div>
    </div>
  );
}