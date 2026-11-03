
import { useState } from "react";
import { useNavigate } from "react-router";

function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "0",
  });

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add product");
      }

      setMessage("Product added successfully!");

      setTimeout(() => {
        navigate("/products");
      }, 800);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Add Product</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Product name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </label>

        <label>
          Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Stock quantity
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Product"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </section>
  );
}

export default AddProduct;
