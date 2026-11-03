
import { Link } from "react-router";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>{" | "}
      <Link to="/products">Products</Link>{" | "}
      <Link to="/cart">Cart</Link>{" | "}
      <Link to="/add-product">Add Product</Link>{" | "}
      <Link to="/register">Register</Link>
      {" | "}
      <Link to="/login">Log In</Link>{" | "}
      <Link to="/my-orders">My Orders</Link>{" | "}
      <Link to="/track-order-guest">Track Guest Order</Link>
    </nav>
  );
}

export default Navbar;
