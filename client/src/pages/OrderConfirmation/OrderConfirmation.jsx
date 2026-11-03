
import { Link, useLocation } from "react-router";

export default function OrderConfirmation() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <main>
      <h1>Thank you for your order!</h1>

      <p>Your order has been placed successfully.</p>

      {orderId && (
        <p>
          Your order number is: <strong>#{orderId}</strong>
        </p>
      )}

      <p>
        Keep your order number for future reference.
      </p>

      <Link to="/">Continue shopping</Link>
    </main>
  );
}
