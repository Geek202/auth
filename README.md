# SQL-backed auth API

A small Express API using MySQL, bcrypt password hashing, JWT authentication, and role-based authorization.

## Setup

1. Create a MySQL database and application user, then grant that user access to the database.
2. Run `schema.sql` against the database.
3. Copy `.env.example` to `.env` and set the database connection values and a random `JWT_SECRET` of at least 32 characters.
4. Run `npm install`, then `npm start`.

The API listens on port `3000` by default. Change it with `PORT`.

## Endpoints

- `POST /api/auth/register` — create an account with `{ "email": "...", "password": "..." }`. New accounts always have the `user` role.
- `POST /api/auth/login` — authenticate with the same fields; returns a JWT.
- `GET /api/auth/me` — return the authenticated user. Send `Authorization: Bearer <token>`.
- `GET /api/auth/admin` — example admin-only route.

Promote an account to admin through a trusted database administration process, not through public registration:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Role changes take effect on the next authenticated request. In production, serve the API over HTTPS, keep `.env` private, and use appropriately restricted database credentials.
