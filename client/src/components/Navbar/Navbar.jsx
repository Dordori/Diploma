
import { Fragment } from "react";
import { Link } from "react-router";
import navbarItems from "./navbarConfig.js";

function Navbar() {
  return (
    <nav>
      {navbarItems.map(({ label, to }, index) => (
        <Fragment key={to}>
          {index > 0 && " | "}
          <Link to={to}>{label}</Link>
        </Fragment>
      ))}
    </nav>
  );
}

export default Navbar;
