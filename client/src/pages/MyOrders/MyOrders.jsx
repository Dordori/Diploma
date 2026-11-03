
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

const API_URL = "http://localhost:5000";

export default function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Could not load orders.");
        }

        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [navigate]);

  if (loading) return <p>Loading your orders...</p>;

  return (
    <main>
      <h1>My Orders</h1>

      {error && <p role="alert">{error}</p>}

      {!error && orders.length === 0 && (
        <p>You haven't placed any orders with this account yet.</p>
      )}

      {orders.map((order) => (
        <section
          key={order.id}
          style={{
            border: "1px solid #ccc",
            padding: "16px",
            marginBottom: "16px",
            borderRadius: "8px",
          }}
        >
          <h2>Order #{order.id}</h2>

          <p>
            Date: {new Date(order.created_at).toLocaleString()}
          </p>

          <p>Status: <strong>{order.status}</strong></p>

          <h3>Products</h3>

          <ul>
            {order.items.map((item, index) => (
              <li key={`${order.id}-${index}`}>
                {item.name} × {item.quantity} —{" "}
                {(Number(item.unit_price) * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>

          <p>
            <strong>Total: {Number(order.total).toFixed(2)}</strong>
          </p>
        </section>
      ))}

      <Link to="/products">Continue shopping</Link>
    </main>
  );
}
