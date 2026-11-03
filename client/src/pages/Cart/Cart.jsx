
import { useState } from "react";
import { Link } from "react-router";

function Cart() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  function saveCart(updatedCart) {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return;

    saveCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }

  function removeItem(id) {
    saveCart(cart.filter((item) => item.id !== id));
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <section>
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <article key={item.id} className="product-card">
              <h3>{item.name}</h3>
              <p>Price: ${Number(item.price).toFixed(2)}</p>

              <label>
                Quantity:
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.id, Number(event.target.value))
                  }
                />
              </label>

              <p>
                Subtotal: $
                {(Number(item.price) * item.quantity).toFixed(2)}
              </p>

              <button onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </article>
          ))}

          <h3>Total: ${total.toFixed(2)}</h3>
          <button onClick={() => alert("Making Checkout!")}>
            <Link to="/checkout">Proceed to Checkout</Link>
          </button>
        </>
      )}
    </section>
  );
}

export default Cart;
