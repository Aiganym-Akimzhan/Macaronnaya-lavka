import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPool, migrateAndSeed } from "./migrations/createTable.js";

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const frontendPath = path.join(here, "../frontend");
const pool = createPool();
const port = 4000;

app.use(express.json());

app.get("/api/products", async function (req, res, next) {
  try {
    const search = req.query.search || "";
    const category = req.query.category || "";
    const sort = req.query.sort || "all";

    const sorts = {
      all: "id ASC",
      newest: "created_at DESC, id DESC",
      price_asc: "price ASC, id DESC",
      price_desc: "price DESC, id DESC",
      name_asc: "name ASC, id DESC",
    };

    const orderBy = sorts[sort] || sorts.all;

    let where = "WHERE name ILIKE $1";
    const values = [`%${search}%`];

    if (category) {
      values.push(category);
      where += " AND category = $2";
    }

    const count = await pool.query(
      `SELECT COUNT(*) FROM products ${where}`,
      values,
    );

    const total = Number(count.rows[0].count);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const pages = Math.ceil(total / limit);
    const page = Math.min(
      Math.max(1, Number(req.query.page) || 1),
      Math.max(1, pages),
    );
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM products
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${values.length + 1}
       OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );

    const categoryResult = await pool.query(
      "SELECT DISTINCT category FROM products ORDER BY category",
    );

    res.json({
      items: result.rows,
      total: total,
      page: page,
      limit: limit,
      pages: pages,
      categories: categoryResult.rows.map(function (row) {
        return row.category;
      }),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", async function (req, res, next) {
  try {
    const product = req.body;
    const price = Number(product.price);

    if (
      !product.name ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !product.image ||
      !product.category ||
      !product.description
    ) {
      return res.status(400).json({
        error: "Please fill in all fields correctly.",
      });
    }

    const result = await pool.query(
      `INSERT INTO products
       (name, price, image, category, tag, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        product.name,
        price,
        product.image,
        product.category,
        product.tag || null,
        product.description,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", async function (req, res, next) {
  try {
    const id = req.params.id;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        error: "Invalid product ID.",
      });
    }

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found.",
      });
    }

    res.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(frontendPath));

app.use("/api", function (req, res) {
  res.status(404).json({
    error: "API endpoint not found.",
  });
});

app.use(function (error, req, res, next) {
  console.error(error);
  res.status(500).json({
    error: "Something went wrong.",
  });
});

async function startServer() {
  try {
    await migrateAndSeed(pool);

    app.listen(port, function () {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
