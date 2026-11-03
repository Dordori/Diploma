import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router";
import './index.css'
import App from './App.jsx'
import Home from "./pages/Home/Home.jsx";
import Products from "./pages/Products/Products.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import AddProduct from "./pages/AddProduct/AddProduct.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import OrderConfirmation from "./pages/OrderConfirmation/OrderConfirmation.jsx";
import AdminOrders from "./pages/AdminOrders/AdminOrders.jsx";
import OrderDetails from "./pages/OrderDetails/OrderDetails.jsx";
import MyOrders from "./pages/MyOrders/MyOrders.jsx";
import GuestOrderLookup from "./pages/GuestOrderLookup/GuestOrderLookup.jsx";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
         path: "cart", 
         element: <Cart /> 
        },
      { 
        path: "add-product", 
        element: <AddProduct /> 
      },
      { path: "checkout", element: <Checkout /> },
      { path: "register", element: <Register /> },
      { path: "login", element: <Login /> },
      {
        path: "order-confirmation",
        element: <OrderConfirmation />,
      },
      {
        path: "admin/orders",
        element: <AdminOrders />,
      },
      {
        path: "admin/orders/:id",
        element: <OrderDetails />,
      },
      {
        path: "my-orders",
        element: <MyOrders />,
      },
      {
        path: "track-order-guest",
        element: <GuestOrderLookup />,
      },
    ],
  },
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);