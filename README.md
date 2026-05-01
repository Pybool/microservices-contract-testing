# Pact Contract Testing — Orders ↔ Users Microservices

Two independent microservices with a Pact-enforced contract between them.

```
┌─────────────────────────┐   POST /orders (validates user)   ┌──────────────────────────┐
│   orders-service        │  ──────────────────────────────►  │   users-service          │
│   Node.js / TypeScript  │  ◄──────────────────────────────  │   Python / FastAPI       │
│   Port 3000             │       GET /users/:id              │   Port 5000              │
└─────────────────────────┘                                    └──────────────────────────┘
         │                                                              │
   Pact consumer test                                         Pact provider verification
   generates contract JSON                                   reads contract JSON & replays
```

---

## Orders Service — what it actually does

- Full order lifecycle: create → confirm → ship → cancel
- Validates the customer exists by calling Users service before accepting an order
- Owns its own data (in-memory store, swap for Postgres in prod)
- Business rules: cancelled orders cannot be re-opened; orders must have ≥1 item

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/orders` | Create a new order (validates user first) |
| GET | `/orders` | List all orders |
| GET | `/orders/:id` | Get order by UUID |
| GET | `/orders/user/:userId` | Get all orders for a user |
| PATCH | `/orders/:id/status` | Update order status |

### POST /orders — example request

```json
{
  "userId": 1,
  "items": [
    { "productId": "prod-abc", "name": "Widget", "quantity": 2, "unitPrice": 1500 }
  ]
}
```

Response `201`:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1,
    "items": [{ "productId": "prod-abc", "name": "Widget", "quantity": 2, "unitPrice": 1500 }],
    "status": "pending",
    "totalCents": 3000,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## Users Service — what it actually does

- Manages the user registry
- CRUD: list, get by id, create, delete
- The source of truth for user identity across the system

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by id |
| POST | `/users` | Create user |
| DELETE | `/users/:id` | Delete user |

---

## Running the contract tests

### Step 1 — Consumer (Orders service generates the pact)

```bash
cd orders-service
npm install
npm run test:pact
# → writes pacts/orders-service-users-service.json
```

### Step 2 — Provider (Users service verifies the pact)

```bash
cd users-service
pip install -r requirements.txt
pytest test_provider_pact.py -v
```

### Run all orders-service tests (unit + pact)

```bash
cd orders-service
npm run test:all
```

### Publish pact after running consumer
npx pact-broker publish ./pacts --consumer-app-version=1.0.0 --broker-base-url=http://localhost:9292

### Deploy docker pact broker
docker run -d -p 9292:9292 -e PACT_BROKER_DATABASE_ADAPTER=sqlite -e PACT_BROKER_DATABASE_NAME=/tmp/pact_broker.sqlite pactfoundation/pact-broker

---

## Run the services locally

```bash
# Terminal 1 — Users service
cd users-service
pip install -r requirements.txt
uvicorn app:app --port 5000 --reload

# Terminal 2 — Orders service
cd orders-service
npm install
USERS_SERVICE_URL=http://localhost:5000 npm run dev
```

---

## What to do when pact verification fails

See **`docs/JIRA_BUG_REPORTING.md`** for the full Jira template,
REST API snippet, and triage checklist.

---

