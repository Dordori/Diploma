const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const optionalAuth = require("./middleware/optionalAuth");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
});
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products ORDER BY id"
    );

    res.json(products);
  } catch (error) {
    console.error("Error loading products:", error);
    res.status(500).json({ error: "Could not load products" });
  }
});


app.post("/api/products", authenticateToken,
  requireAdmin, async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;

  // Validate the input
  if (
    typeof name !== "string" ||
    !name.trim() ||
    price === undefined ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return res.status(400).json({
      error: "Please provide a name, valid price, and valid stock quantity.",
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO products
       (name, description, price, stock, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description || null,
        Number(price),
        Number(stock),
        image_url || null,
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Could not add product" });
  }
});

app.put("/api/products/:id", authenticateToken,
  requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, stock } = req.body;

  if (
    !Number.isInteger(id) || id <= 0 ||
    typeof name !== "string" || !name.trim() ||
    price === undefined ||
    !Number.isFinite(Number(price)) || Number(price) < 0 ||
    !Number.isInteger(Number(stock)) || Number(stock) < 0
  ) {
    return res.status(400).json({ error: "Invalid product data" });
  }

  try {
    const [result] = await db.execute(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock = ?
       WHERE id = ?`,
      [name.trim(), description || null, Number(price), Number(stock), id]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.execute(
        "SELECT id FROM products WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
    }

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Could not update product" });
  }
});

app.delete("/api/products/:id", authenticateToken,
  requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const [result] = await db.execute(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Could not delete product" });
  }
});

app.post("/api/orders", optionalAuth, async (req, res) => {
  const { customer_name, customer_email, items } = req.body;

  const name = req.user
  ? req.user.name
  : customer_name?.trim();

const email = req.user
  ? req.user.email
  : customer_email?.trim();

if (!name || !email || typeof name !== "string" ||
    typeof email !== "string" ||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(items) || items.length === 0 ||
    items.length > 100) {
  return res.status(400).json({
    error: "Please provide valid customer details and cart items.\nAt least one cart item are required",
  });
}

  const quantities = new Map();

  for (const item of items) {
    if (
      !Number.isInteger(Number(item.id)) ||
      Number(item.id) <= 0 ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    ) {
      return res.status(400).json({
        error: "Invalid product or quantity.",
      });
    }

    const id = Number(item.id);
    quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity));
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const orderItems = [];
    let total = 0;

    for (const [productId, quantity] of quantities) {
      const [rows] = await connection.execute(
        `SELECT id, name, price, stock
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [productId]
      );

      if (rows.length === 0) {
        throw new Error(`Product ${productId} not found.`);
      }

      const product = rows[0];

      if (product.stock < quantity) {
        throw new Error(
          `Not enough stock for ${product.name}. Available: ${product.stock}.`
        );
      }

      const price = Number(product.price);
      total += price * quantity;

      orderItems.push({
        productId,
        name: product.name,
        quantity,
        price,
      });
    }

    total = Number(total.toFixed(2));

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, customer_name, customer_email, total)
       VALUES (?, ?, ?, ?)`,
        [
          req.user ? req.user.id : null,
          name,
          email,
          total,
        ]
    );
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          item.productId,
          item.name,
          item.quantity,
          item.price,
        ]
      );

      await connection.execute(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.productId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Order created successfully.",
      orderId: orderResult.insertId,
      orderId: orderId, // not sure what i done
      total,
    });
  } catch (error) {
    await connection.rollback();

    if (
      error.message.includes("not found") ||
      error.message.includes("Not enough stock")
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Could not create order." });
  } finally {
    connection.release();
  }
});


app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 150 ||
    typeof email !== "string" ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      error: "Enter a valid name and email, and a password of 8–72 characters.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    res.status(201).json({
      message: "Account created successfully.",
      userId: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 255 ||
    password.length > 72
  ) {
    return res.status(400).json({
      error: "Please enter a valid email and password.",
    });
  }

  try {
    const [users] = await db.execute(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const user = users[0];

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Could not log in." });
  }
});

app.get("/api/orders/my", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         o.id AS order_id,
         o.total,
         o.status,
         o.created_at,
         oi.product_name,
         oi.quantity,
         oi.unit_price
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC, o.id DESC`,
      [req.user.id]
    );

    const orders = [];
    const ordersById = new Map();

    for (const row of rows) {
      let order = ordersById.get(row.order_id);

      if (!order) {
        order = {
          id: row.order_id,
          total: row.total,
          status: row.status,
          created_at: row.created_at,
          items: [],
        };

        ordersById.set(row.order_id, order);
        orders.push(order);
      }

      if (row.product_name !== null) {
        order.items.push({
          name: row.product_name,
          quantity: row.quantity,
          price: row.unit_price,
        });
      }
    }

    res.json(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).json({ error: "Could not load your orders." });
  }
});


app.get(
  "/api/orders",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [orders] = await db.execute(`
        SELECT
          o.id,
          o.customer_name,
          o.customer_email,
          o.total,
          o.status,
          o.created_at,
          o.user_id
        FROM orders o
        ORDER BY o.created_at DESC, o.id DESC
      `);

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({
        error: "Could not load orders.",
      });
    }
  }
);

app.put(
  "/api/orders/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];

      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
          error: "Invalid order ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid order status.",
        });
      }

      const [result] = await db.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      res.json({
        message: "Order status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        error: "Could not update order status.",
      });
    }
  }
);


app.get(
  "/api/orders/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = Number(req.params.id);

      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
          error: "Invalid order ID.",
        });
      }

      const [orders] = await db.execute(
        `SELECT id, user_id, customer_name, customer_email,
                total, status, created_at
         FROM orders
         WHERE id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      const [items] = await db.execute(
        `SELECT product_id, product_name, quantity, unit_price
         FROM order_items
         WHERE order_id = ?`,
        [orderId]
      );

      res.json({
        ...orders[0],
        items,
      });
    } catch (error) {
      console.error("Error loading order details:", error);
      res.status(500).json({
        error: "Could not load order details.",
      });
    }
  }
);

app.get(
  "/api/orders/my",
  authenticateToken,
  async (req, res) => {
    try {
      const [rows] = await db.execute(
        `SELECT
           o.id AS order_id,
           o.total,
           o.status,
           o.created_at,
           oi.product_name,
           oi.quantity,
           oi.unit_price
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC, o.id DESC`,
        [req.user.id]
      );

      const orders = [];
      const ordersById = new Map();

      for (const row of rows) {
        let order = ordersById.get(row.order_id);

        if (!order) {
          order = {
            id: row.order_id,
            total: row.total,
            status: row.status,
            created_at: row.created_at,
            items: [],
          };

          ordersById.set(row.order_id, order);
          orders.push(order);
        }

        if (row.product_name !== null) {
          order.items.push({
            name: row.product_name,
            quantity: row.quantity,
            unit_price: row.unit_price,
          });
        }
      }

      res.json(orders);
    } catch (error) {
      console.error("Error loading customer orders:", error);
      res.status(500).json({
        error: "Could not load your orders.",
      });
    }
  }
);


app.post("/api/orders/lookup", async (req, res) => {
  try {
    const { orderId, email } = req.body;

    const id = Number(orderId);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: "Please enter a valid order number and email.",
      });
    }

    const [orders] = await db.execute(
      `SELECT id, customer_name, customer_email,
              total, status, created_at, user_id
       FROM orders
       WHERE id = ? AND LOWER(customer_email) = LOWER(?)`,
      [id, email.trim()]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        error: "No order found with that order number and email.",
      });
    }

    const order = orders[0];

    // Guest lookup is intended only for orders placed without an account.
    if (order.user_id !== null) {
      return res.status(404).json({
        error: "No guest order found with those details.",
      });
    }

    const [items] = await db.execute(
      `SELECT product_name, quantity, unit_price
       FROM order_items
       WHERE order_id = ?`,
      [order.id]
    );

    res.json({
      id: order.id,
      customer_name: order.customer_name,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      items,
    });
  } catch (error) {
    console.error("Guest order lookup error:", error);
    res.status(500).json({
      error: "Could not look up the order.",
    });
  }
});




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});