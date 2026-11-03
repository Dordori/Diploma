
import { useEffect, useState } from "react";
import { Link } from "react-router";

const API_URL = "http://localhost:5000";

const STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

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

  async function updateStatus(orderId, status) {
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update order.");
      }

      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <main>
      <h1>Manage Orders</h1>

      {error && <p role="alert">{error}</p>}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Date</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    {order.customer_name}
                    {order.user_id == null && " (Guest)"}
                  </td>
                  <td>{order.customer_email}</td>
                  <td>{Number(order.total).toFixed(2)}</td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                    <td>
                        <Link to={`/admin/orders/${order.id}`}>
                            View details
                        </Link>
                    </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value)
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
