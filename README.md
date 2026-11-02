# Macaronnaya lavka API

The storefront stores products in PostgreSQL. The server runs the table migration and seeds the starter catalog on startup; `npm run migrate` can also run it separately. Seeding only happens when the products table is empty.

## First setup

The backend automatically reads the repository-root `.env` file before connecting. It expects `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`; shell environment variables override values from `.env`.

Create the database named by `DB_NAME` in pgAdmin (or run this in the Query Tool; the default name is `macaron`):

```sql
CREATE DATABASE macaron;
```

Then open a terminal in `backend/`, install the PostgreSQL driver, and run the migration and server:

```sh
npm install
npm run migrate
npm start

node --env-file=../.env server.js
```

The fallback database settings are user `postgres`, host `localhost`, port `5432`, and database `macaron`. You can instead set `DATABASE_URL`. The site is served at `http://localhost:3000`.

## API

- `GET /api/products?search=&category=&sort=featured&page=1&limit=8` — returns `{ items, total, page, limit, pages, categories }`. Supported sorts are `featured`, `newest`, `price_asc`, `price_desc`, and `name_asc`.
- `POST /api/products` — creates a product from JSON fields `name`, `price`, `image`, `category`, `tag`, and `description`.
- `DELETE /api/products/:id` — deletes that product.

Product creation and deletion update the same PostgreSQL `products` table visible in pgAdmin. Refresh the table view there to see changes.
