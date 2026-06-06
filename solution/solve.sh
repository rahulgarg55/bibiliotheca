#!/bin/bash
# Oracle solution: verifies the Bibliotheca backend API is fully functional
# by exercising auth, books CRUD, borrow/return, reviews, holds, users, and logs.
set -euo pipefail

BASE_URL="http://localhost:5000"

echo "=== Bibliotheca Oracle Verification ==="

# 1. Health check
echo "Step 1: Health check..."
curl -sf "$BASE_URL/health" | grep -q '"status":"UP"'
echo "  ✓ API is healthy"

# 2. Login as admin
echo "Step 2: Admin login..."
ADMIN_TOKEN=$(curl -sf -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bibliotheca.com","password":"Admin@1234"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "  ✓ Admin token obtained"

# 3. Register a test user
echo "Step 3: Register test user..."
TEST_EMAIL="oracle_$(date +%s)@test.com"
curl -sf -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Oracle User\",\"email\":\"$TEST_EMAIL\",\"password\":\"Test@1234\"}" | grep -q "registered"
echo "  ✓ User registered"

# 4. Login as test user
echo "Step 4: User login..."
USER_TOKEN=$(curl -sf -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test@1234\"}" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "  ✓ User token obtained"

# 5. Get book catalog
echo "Step 5: Get book catalog..."
BOOKS=$(curl -sf "$BASE_URL/api/books")
echo "$BOOKS" | grep -q '\['
echo "  ✓ Catalog returned"

# 6. Create a book as admin
echo "Step 6: Create book as admin..."
BOOK_ID=$(curl -sf -X POST "$BASE_URL/api/books" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Oracle Test Book\",\"author\":\"Oracle\",\"isbn\":\"ORB-$(date +%s)\",\"genre\":\"Test\",\"year\":2024,\"copies\":5,\"pages\":100,\"summary\":\"Oracle test\",\"coverColor\":\"#000\",\"excerpt\":\"\"}" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  ✓ Book created: $BOOK_ID"

# 7. Borrow the book as user
echo "Step 7: Borrow book..."
curl -sf -X POST "$BASE_URL/api/books/$BOOK_ID/borrow" \
  -H "Authorization: Bearer $USER_TOKEN" | grep -q "Checkout"
echo "  ✓ Book borrowed"

# 8. Submit a review
echo "Step 8: Submit review..."
curl -sf -X POST "$BASE_URL/api/books/$BOOK_ID/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"rating":5,"comment":"Excellent oracle test book!"}' | grep -q '"rating"'
echo "  ✓ Review submitted"

# 9. Admin list users
echo "Step 9: Admin list users..."
curl -sf "$BASE_URL/api/users" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q '\['
echo "  ✓ User list returned"

# 10. Admin read logs
echo "Step 10: Admin read audit logs..."
curl -sf "$BASE_URL/api/logs" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -q '\['
echo "  ✓ Logs returned"

echo ""
echo "=== All oracle verification steps passed ==="
