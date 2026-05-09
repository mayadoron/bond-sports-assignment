## Architecture

The service is a banking account management REST API built with NestJS (TypeScript), PostgreSQL, and Prisma ORM, containerized via Docker Compose.

The data model consists of two entities — Account (balance, daily withdrawal limit, type, active status) and Transaction (deposit/withdrawal records linked to an account).

The application follows a modular layered architecture: Controllers handle HTTP routing, Services encapsulate business logic (balance validation, daily limit enforcement, account status checks), and Prisma provides the data access layer. Error handling is done using appropriate exceptions.

Unit tests cover the service layer for both the accounts and transactions modules.

## How to run the project?

### Option 1 — Local

Start the Postgres service:
```bash
docker compose up postgres -d
```
Copy env.example to env

Install the dependencies

```bash
npm install
```

Generate the Prisma client and run migrations

```bash
npm run db:generate
npm run db:migrate:dev
```

Start the server with hot-reload

```bash
npm run start:dev
```

### Docker Compose

Copy env.example to env

Build and start both services
```bash
docker compose up --build
```

Service url http://localhost:3000
API Documentation available at http://localhost:3000/api

---

## Running Tests

### Unit tests

```bash
npm run test
```