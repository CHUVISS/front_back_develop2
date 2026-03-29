import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    rating: "",
    image: ""
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialProduct?.title ?? "",
      category: initialProduct?.category ?? "",
      description: initialProduct?.description ?? "",
      price: initialProduct?.price != null ? String(initialProduct.price) : "",
      quantity: initialProduct?.quantity != null ? String(initialProduct.quantity) : "",
      rating: initialProduct?.rating != null ? String(initialProduct.rating) : "",
      image: initialProduct?.image ?? ""
    });
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Новый товар";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { title, price, quantity } = form;

    if (!title.trim()) { alert("Введите название"); return; }
    if (price === "" || Number(price) < 0) { alert("Некорректная цена"); return; }
    if (quantity === "" || Number(quantity) < 0) { alert("Некорректное количество"); return; }

    onSubmit({
      id: initialProduct?.id,
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      rating: form.rating ? Number(form.rating) : 0
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Название
            <input className="input" name="title" value={form.title} onChange={handleChange} required />
          </label>
          <div className="row">
            <label className="label">Категория
              <input className="input" name="category" value={form.category} onChange={handleChange} />
            </label>
            <label className="label">Цена (₽)
              <input className="input" name="price" type="number" value={form.price} onChange={handleChange} required />
            </label>
          </div>
          <div className="row">
            <label className="label">Количество
              <input className="input" name="quantity" type="number" value={form.quantity} onChange={handleChange} required />
            </label>
            <label className="label">Рейтинг (0-5)
              <input className="input" name="rating" type="number" step="0.1" max="5" value={form.rating} onChange={handleChange} />
            </label>
          </div>
          <label className="label">Ссылка на фото
            <input className="input" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
          </label>
          <label className="label">Описание
            <textarea className="input textarea" name="description" value={form.description} onChange={handleChange} rows="3" />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">{mode === "edit" ? "Сохранить" : "Добавить"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}