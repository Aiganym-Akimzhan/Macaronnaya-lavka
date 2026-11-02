import { Pool } from "pg";
import { products } from "../data/productsData.js";

export function createPool() {
  return new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "macaron",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 5432,
  });
}

export async function createProductsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      image TEXT NOT NULL,
      category VARCHAR(60) NOT NULL,
      tag VARCHAR(50) DEFAULT '',
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function seedProducts(pool) {
  const result = await pool.query("SELECT * FROM products");

  if (result.rows.length > 0) {
    return;
  }

  for (const product of products) {
    await pool.query(
      `INSERT INTO products
      (name, price, image, category, tag, description)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        product.name,
        product.price,
        product.image,
        product.category,
        product.tag || "",
        product.description,
      ],
    );
  }

  console.log("Products added !");
}

export async function migrateAndSeed(pool) {
  await createProductsTable(pool);
  await seedProducts(pool);

  console.log("Database iss ready");
}
