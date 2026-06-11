# Bibliotheca Library Management API Task

The Bibliotheca library management backend is running at `http://localhost:5000`. The source code is located at `/app`. The backend is a Node.js/Express API backed by PostgreSQL, Redis, and Kafka. 

The database has been seeded and an administrator account exists with the following credentials:
- **Email:** `admin@bibliotheca.com`
- **Password:** `Admin@1234`

## Objective

Several critical API endpoints are broken, missing logic, or have severe security vulnerabilities. Your task is to fix them so that the full integration test suite passes.

Restart the backend service after making code changes.

## Expected Behaviors and Requirements

1. **Authentication & Authorization:**
   - Admin-only routes must return `403` for regular users and `401` for unauthenticated requests.
   - The catalog endpoint (`GET /api/books`) must be publicly accessible.
   - Book creation (`POST /api/books`) without a token must return `401`.
   - The Signup endpoint (`POST /api/auth/signup`) should return an object containing the user details in this shape: `{ "user": { "id": "...", "name": "...", "email": "...", "role": "user" } }`.
   - The Login endpoint (`POST /api/auth/login`) should return `{ "token": "<JWT>", "user": { "id": "...", "name": "...", "email": "...", "avatarColor": "...", "role": "...", "goal": ..., "goalProgress": ..., "fines": ... } }`.

2. **Book CRUD & Management:**
   - The API must support book creation, updates (`PUT /api/books/:id`), and deletions (`DELETE /api/books/:id`).
   - Successful deletions must return `{ "message": "... deleted ..." }`.
   - Creating a book with a duplicate ISBN must be rejected with a `400` error.
   
3. **Borrowing & Returning:**
   - Book borrowing (`POST /api/books/:id/borrow`) must enforce availability (rejecting if `available <= 0`) and prevent duplicate active loans for the same user. Successful borrows must return `{ "loan": { "id": "...", "status": "active", ... }, "availableCopies": <number> }`.
   - Returning a book (`POST /api/books/loans/:id/return`) must calculate and record overdue fines at **$0.50 per day**. The response must return `{ "fineAmount": <float> }`.

4. **Reviews & Holds:**
   - Reviews (`POST /api/books/:id/review`) must require both a `rating` and a `comment`.
   - Submitting a review must aggregate and update the average `rating` and `ratingsCount` on the book record. Successful reviews must return `{ "rating": <number>, "comment": "...", "user": "...", "date": "..." }`.
   - The system must support placing reservation holds (`POST /api/books/:id/hold`).

5. **Health:**
   - The `/health` endpoint must return a `200` status with the system state, returning the shape `{ "status": "UP", "timestamp": "<ISO date>" }`.
