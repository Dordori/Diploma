import { useState } from 'react'
import { Link } from "react-router";
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import { Outlet } from "react-router";
import Navbar from "./components/Navbar/Navbar.jsx";

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  }

  return (
    <>
      <Navbar />
      { user ? ( <>
            {" | "}
            <span>Hello, {user.name}</span>
            {" | "}
            <Link to="/my-orders">My Orders</Link>
            {" | "}
            <button onClick={handleLogout}>Logout</button>
          </>
          ):( 
                  <>
            {" | "}
            <Link to="/login">Login</Link>
            {" | "}
            <Link to="/register">Register</Link>
          </>
            )}
      <hr />
      <main>
        <Outlet />
      </main>
    </>
  );
}




export default App;

