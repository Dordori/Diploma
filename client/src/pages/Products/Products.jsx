
import { useEffect, useState } from "react";

function addToCart(product) {
  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    cart = [];
  }

  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      alert("No more stock available.");
      return;
    }

    existingItem.quantity += 1;
  } else {
    if (product.stock < 1) {
      alert("This product is out of stock.");
      return;
    }

    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Product added to cart!");
}
const API_URL = "http://localhost:5000/api/products";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [message, setMessage] = useState("");

  async function fetchProducts() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load products");
      }

      const data = await response.json();
      setProducts(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function startEditing(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
    });
    setMessage("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: 
          { 
          "Content-Type": "application/json",
           Authorization: `Bearer ${localStorage.getItem("token")}`, 
          },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update product");
      }

      setEditingId(null);
      setMessage("Product updated successfully!");
      await fetchProducts();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: 
          {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete product");
      }

      setMessage("Product deleted successfully!");

      if (editingId === id) {
        setEditingId(null);
      }

      await fetchProducts();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (loading) return <p>Loading products...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <section>
      <h2>Our Products</h2>

      {message && <p role="status">{message}</p>}

      {editingId !== null && (
        <form onSubmit={handleUpdate}>
          <h3>Edit Product</h3>

          <label>
            Name
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
            Stock
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

          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setEditingId(null)}>
            Cancel
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Price: ${Number(product.price).toFixed(2)}</p>
              <p>In stock: {product.stock}</p>

              <button onClick={() => addToCart(product)}>
                Add to Cart
              </button>

              <button onClick={() => startEditing(product)}>
                Edit
              </button>

              <button onClick={() => handleDelete(product.id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Products;
