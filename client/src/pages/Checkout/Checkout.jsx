
import { useState } from "react";
import { useNavigate } from "react-router";

const API_URL = "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not place your order.");
      }

      localStorage.removeItem("cart");
      setCart([]);

      navigate("/order-confirmation", 
        {
          state: { orderId: data.orderId },
        });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Checkout</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <h2>Order summary</h2>

          {cart.map((item) => (
            <p key={item.id}>
              {item.name} × {item.quantity} — $
              {(Number(item.price) * item.quantity).toFixed(2)}
            </p>
          ))}

          <h3>Total: ${total.toFixed(2)}</h3>

          <form onSubmit={handleSubmit}>
            <label htmlFor="customer-name">Full name</label>
            <input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label htmlFor="customer-email">Email</label>
            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p role="alert">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Placing order..." : "Place order"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
