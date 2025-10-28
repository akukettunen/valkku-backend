# 🗃️ Database Guide

This document explains how the database is managed in this project — for both local development and production.
It applies to all contributors and acts as a checklist when making database changes.

---

## 🧠 Overview

We use **Sequelize ORM** for all database interactions and **Sequelize migrations** for schema versioning.

| Environment | Database | Connection method |
|--------------|-----------|-------------------|
| **Production** | MySQL | `DATABASE_URL` (from environment) |
| **Development** | MySQL (Docker container) | Local port `3306` |
| **Testing** | (optional) SQLite or MySQL | Temporary DB |

---

## 🧩 Structure

valkku-backend/
├── migrations/          # All migration files (timestamped)
├── seeders/             # Optional: initial or demo data
├── sql/schema.sql       # Baseline schema dump (initial MySQL structure)
├── src/db/models/       # Sequelize model definitions (TypeScript)
├── sequelize.config.cjs # Sequelize config (dev/prod)
└── docs/database.md     # This file

---

## 🐳 Local Development

### 1️⃣ Start MySQL in Docker

We use a local MySQL container that mirrors production.
```
docker compose up -d
```
Stop it when done:
```
docker compose down
```
To remove all local data (fresh start):
```
docker compose down -v
```
---

## 🪜 Migrations

### Creating a new migration

Each schema change must have its own migration file.
```
npx sequelize-cli migration:generate --name <commit-name>
```
Examples:
```
npx sequelize-cli migration:generate --name add-user-avatar-column
npx sequelize-cli migration:generate --name create-team-users-table
```

This generates a file under `migrations/` like:
migrations/20251028XXXXXX-add-user-avatar-column.js

Edit the file to define what the migration does.

### Running migrations
```
NODE_ENV=development npx sequelize-cli db:migrate
```

This applies all pending migrations to your current environment.

To roll back the latest migration:
```
NODE_ENV=development npx sequelize-cli db:migrate:undo
```
To reset everything (careful!):
```
NODE_ENV=development npx sequelize-cli db:migrate:undo:all
```
---

## 🔄 Baseline Schema

The first migration (`baseline-initial-schema.js`) represents the **existing database structure** at the time we introduced Sequelize migrations.

- It uses `sql/schema.sql` to build all initial tables.
- This migration should **never be edited or deleted**.
- If production already has those tables, mark this migration as “applied” manually in the `SequelizeMeta` table.

---

## 💡 Workflow for Schema Changes

Every time you change the database structure:

1. **Create a migration**
   npx sequelize-cli migration:generate --name <what-you-change>

2. **Edit the migration file** to apply the correct SQL or Sequelize commands.

3. **Update your model(s)** in `src/db/models` to reflect the change.

4. **Run locally**
   NODE_ENV=development npx sequelize-cli db:migrate

5. **Verify** your app still runs and queries behave as expected.

6. **Commit both** the migration file and model changes in the **same PR**.

---

## 🧱 Best Practices

✅ **Every schema change = one migration file**
Keep migrations small and reviewable.

✅ **Never edit existing migrations**
Once shared with others or deployed, migrations are immutable.

✅ **Migration + code change = same PR**
Schema and logic evolve together.

✅ **Don’t rely on `sequelize.sync()`**
We use explicit migrations for all schema creation.

✅ **Use `db:migrate` in CI/CD**
Always migrate automatically on deploy to keep environments in sync.

---

## 🧩 Quick Commands Reference

| Action | Command |
|--------|----------|
| Create DB | `NODE_ENV=development npx sequelize-cli db:create` |
| Run migrations | `NODE_ENV=development npx sequelize-cli db:migrate` |
| Undo last migration | `NODE_ENV=development npx sequelize-cli db:migrate:undo` |
| Undo all migrations | `NODE_ENV=development npx sequelize-cli db:migrate:undo:all` |
| Generate new migration | `npx sequelize-cli migration:generate --name <change>` |
| Start local DB | `docker compose up -d` |
| Stop local DB | `docker compose down` |
| Reset local DB | `docker compose down -v && docker compose up -d` |

---

## 🧾 Summary

- The **database schema is code** — every change goes through a migration.
- **Migrations are committed and PR-reviewed.**
- **Local DB** runs in Docker for consistency.
- **Production DB** is MySQL, managed separately.
- Never change tables manually in production — use migrations only.