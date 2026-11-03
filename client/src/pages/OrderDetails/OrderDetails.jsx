
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

const API_URL = "http://localhost:5000";

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/orders/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load order details."
          );
        }

        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) return <p>Loading order details...</p>;

  if (error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <Link to="/admin/orders">Back to orders</Link>
      </main>
    );
  }

  if (!order) return <p>Order not found.</p>;

  return (
    <main>
      <h1>Order #{order.id}</h1>

      <p><strong>Customer:</strong> {order.customer_name}</p>
      <p><strong>Email:</strong> {order.customer_email}</p>
      <p><strong>Type:</strong> {order.user_id == null ? "Guest" : "Registered customer"}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p>
        <strong>Date:</strong>{" "}
        {new Date(order.created_at).toLocaleString()}
      </p>

      <h2>Products</h2>

      {order.items.length === 0 ? (
        <p>No products found for this order.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.product_id}-${index}`}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.unit_price).toFixed(2)}</td>
                <td>
                  {(Number(item.unit_price) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Order total: {Number(order.total).toFixed(2)}</h2>

      <Link to="/admin/orders">Back to orders</Link>
    </main>
  );
}
