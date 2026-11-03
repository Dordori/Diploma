
import { useState } from "react";
import { Link } from "react-router";

const API_URL = "http://localhost:5000";

export default function GuestOrderLookup() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/orders/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not find your order.");
      }

      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Track Your Guest Order</h1>

      <p>Enter your order number and the email address used at checkout.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="orderId">Order number</label>
          <input
            id="orderId"
            type="number"
            min="1"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Find Order"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {order && (
        <section>
          <h2>Order #{order.id}</h2>
          <p>Status: <strong>{order.status}</strong></p>
          <p>
            Date: {new Date(order.created_at).toLocaleString()}
          </p>

          <h3>Products</h3>
          <ul>
            {order.items.map((item, index) => (
              <li key={`${order.id}-${index}`}>
                {item.product_name} × {item.quantity} —{" "}
                {(Number(item.unit_price) * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>

          <p>
            <strong>
              Total: {Number(order.total).toFixed(2)}
            </strong>
          </p>
        </section>
      )}

      <p><Link to="/products">Continue shopping</Link></p>
    </main>
  );
}
