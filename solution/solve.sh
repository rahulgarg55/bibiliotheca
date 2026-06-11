#!/bin/bash
# Oracle solution: patches the deliberate bugs in the Bibliotheca backend API
# and verifies functionality.
set -euo pipefail

BASE_URL="http://localhost:5000"

echo "=== Bibliotheca Oracle Solution ==="

echo "Step 1: Patching code in environment/app/src/..."

# Patch books.js
sed -i 's/router\.post('\''\/'\'', authenticateToken, async/router.post('\''\/'\'', authenticateToken, requireAdmin, async/g' environment/app/src/routes/books.js
sed -i 's/router\.put('\''\/:id'\'', authenticateToken, async/router.put('\''\/:id'\'', authenticateToken, requireAdmin, async/g' environment/app/src/routes/books.js
sed -i 's/router\.delete('\''\/:id'\'', authenticateToken, async/router.delete('\''\/:id'\'', authenticateToken, requireAdmin, async/g' environment/app/src/routes/books.js

sed -i 's/\/\/ Bug: duplicate loan and availability checks omitted/const active = await prisma.loan.findFirst({ where: { userId, bookId, status: { in: ['\''active'\'', '\''overdue'\''] } } }); if (active) { return res.status(400).json({ error: '\''You have already checked out a copy of this book.'\'' }); } if (book.available <= 0) { return res.status(400).json({ error: '\''No copies currently available in stack.'\'' }); }/g' environment/app/src/routes/books.js

sed -i 's/fine = 0\.0; \/\/ Bug: fine calculation omitted/fine = diffDays * 0.50;/g' environment/app/src/routes/books.js

sed -i 's/\/\/ Bug: rating calculation and book update omitted/const sum = reviews.reduce((acc, r) => acc + r.rating, 0); const avg = parseFloat((sum \/ reviews.length).toFixed(1)); await prisma.book.update({ where: { id: bookId }, data: { rating: avg, ratingsCount: reviews.length } });/g' environment/app/src/routes/books.js

# Patch users.js
sed -i 's/import { authenticateToken }/import { authenticateToken, requireAdmin }/g' environment/app/src/routes/users.js
sed -i 's/authenticateToken, async/authenticateToken, requireAdmin, async/g' environment/app/src/routes/users.js

# Patch logs.js
sed -i 's/import { authenticateToken }/import { authenticateToken, requireAdmin }/g' environment/app/src/routes/logs.js
sed -i 's/authenticateToken, async/authenticateToken, requireAdmin, async/g' environment/app/src/routes/logs.js

echo "Step 2: Restarting backend container..."
# The container name should be matched based on the docker-compose file
docker compose -f environment/docker-compose.yaml restart main

echo "Step 3: Waiting for API to come back online..."
sleep 5
for i in {1..15}; do
  if curl -sf "$BASE_URL/health" | grep -q '"status":"UP"'; then
    echo "API is healthy!"
    break
  fi
  echo "Waiting..."
  sleep 2
done

# The automated python tests will run next and verify everything.
echo "Oracle solution applied successfully."
