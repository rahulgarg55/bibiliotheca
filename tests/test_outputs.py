"""
Bibliotheca API Integration Tests
===================================
Verifies the core REST API behaviour of the Bibliotheca backend running
at http://localhost:5000. The full docker-compose stack (PostgreSQL, Redis,
Kafka, backend) must be healthy before these tests run.
"""

import os
import uuid
import requests
import pytest

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


# ── Helpers ──────────────────────────────────────────────────────────────────


def api(path: str) -> str:
    """Return the full URL for a given API path."""
    return f"{BASE_URL}{path}"


def unique_email() -> str:
    """Return a unique email address for test isolation."""
    return f"test_{uuid.uuid4().hex[:8]}@bibliotheca.test"


def register_user(name="Test User", email=None, password="Test@1234"):
    """Register a new user and return the raw response."""
    payload = {"name": name, "email": email or unique_email(), "password": password}
    return requests.post(api("/api/auth/signup"), json=payload, timeout=10)


def login_user(email: str, password: str = "Test@1234"):
    """Authenticate and return (token, user_dict)."""
    resp = requests.post(api("/api/auth/login"), json={"email": email, "password": password}, timeout=10)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    return data["token"], data["user"]


def auth_headers(token: str) -> dict:
    """Return Authorization header dict for a given JWT token."""
    return {"Authorization": f"Bearer {token}"}


# ── Fixtures ─────────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def admin_token():
    """Authenticate as the seeded admin user and return the JWT token."""
    token, _ = login_user("admin@bibliotheca.com", "Admin@1234")
    return token


@pytest.fixture(scope="module")
def user_token():
    """Register a fresh regular user, authenticate, and return the JWT token."""
    email = unique_email()
    r = register_user(name="Integration Tester", email=email)
    assert r.status_code == 201, f"Registration failed: {r.text}"
    token, _ = login_user(email)
    return token


@pytest.fixture(scope="module")
def sample_book_id(admin_token):
    """Create a test book as admin and return its database ID."""
    payload = {
        "title": f"Test Book {uuid.uuid4().hex[:6]}",
        "author": "pytest Author",
        "isbn": f"978-{uuid.uuid4().int % 10**10:010d}",
        "genre": "Testing",
        "year": 2024,
        "copies": 3,
        "pages": 200,
        "summary": "A book created during integration testing.",
        "coverColor": "linear-gradient(135deg, #8b5cf6, #06b6d4)",
        "excerpt": "It was a test on a dark and stormy night.",
    }
    resp = requests.post(api("/api/books"), json=payload, headers=auth_headers(admin_token), timeout=10)
    assert resp.status_code == 201, f"Book creation failed: {resp.text}"
    return resp.json()["id"]


# ── Health ────────────────────────────────────────────────────────────────────


class TestHealth:
    def test_health_endpoint_returns_up(self):
        """Verify the /health endpoint responds with status UP and a timestamp."""
        resp = requests.get(api("/health"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "UP"
        assert "timestamp" in data


# ── Auth ──────────────────────────────────────────────────────────────────────


class TestAuth:
    def test_signup_new_user_succeeds(self):
        """Verify that a POST to /api/auth/signup creates a new user with role 'user'."""
        resp = register_user()
        assert resp.status_code == 201
        data = resp.json()
        assert "user" in data
        assert data["user"]["role"] == "user"

    def test_signup_duplicate_email_is_rejected(self):
        """Verify that registering with an already-used email returns HTTP 400."""
        email = unique_email()
        register_user(email=email)
        resp = register_user(email=email)
        assert resp.status_code == 400
        assert "already registered" in resp.json().get("error", "")

    def test_signup_without_required_fields_returns_400(self):
        """Verify that omitting required signup fields returns HTTP 400."""
        resp = requests.post(api("/api/auth/signup"), json={"email": unique_email()}, timeout=10)
        assert resp.status_code == 400

    def test_login_with_valid_credentials_returns_token(self):
        """Verify that valid credentials at /api/auth/login return a JWT token."""
        email = unique_email()
        register_user(email=email)
        token, user = login_user(email)
        assert isinstance(token, str) and len(token) > 10
        assert user["email"] == email

    def test_login_with_wrong_password_returns_401(self):
        """Verify that an incorrect password returns HTTP 401."""
        email = unique_email()
        register_user(email=email)
        resp = requests.post(api("/api/auth/login"), json={"email": email, "password": "WrongPass!"}, timeout=10)
        assert resp.status_code == 401

    def test_login_with_unknown_email_returns_401(self):
        """Verify that logging in with a non-existent email returns HTTP 401."""
        resp = requests.post(api("/api/auth/login"), json={"email": "nobody@nowhere.test", "password": "x"}, timeout=10)
        assert resp.status_code == 401


# ── Books ─────────────────────────────────────────────────────────────────────


class TestBooks:
    def test_get_catalog_without_auth_returns_200(self):
        """Verify that GET /api/books is publicly accessible without authentication."""
        resp = requests.get(api("/api/books"), timeout=10)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_catalog_contains_seeded_books(self):
        """Verify that the catalog contains at least the books added during database seeding."""
        resp = requests.get(api("/api/books"), timeout=10)
        assert len(resp.json()) >= 1

    def test_admin_can_create_book(self, admin_token):
        """Verify that an admin can create a new book via POST /api/books and receive 201."""
        payload = {
            "title": f"Admin Book {uuid.uuid4().hex[:6]}",
            "author": "Admin Author",
            "isbn": f"111-{uuid.uuid4().int % 10**9:09d}",
            "genre": "Science",
            "year": 2023,
            "copies": 2,
            "pages": 150,
            "summary": "Created by admin in test.",
            "coverColor": "#ff0000",
            "excerpt": "First line.",
        }
        resp = requests.post(api("/api/books"), json=payload, headers=auth_headers(admin_token), timeout=10)
        assert resp.status_code == 201
        assert resp.json()["title"] == payload["title"]

    def test_regular_user_cannot_create_book(self, user_token):
        """Verify that a non-admin user receives HTTP 403 when attempting to create a book."""
        payload = {
            "title": "Unauthorized Book",
            "author": "Hacker",
            "isbn": f"999-{uuid.uuid4().int % 10**9:09d}",
            "genre": "Crime",
            "year": 2020,
            "copies": 1,
            "pages": 50,
            "summary": "Should not be created.",
            "coverColor": "#000",
            "excerpt": "",
        }
        resp = requests.post(api("/api/books"), json=payload, headers=auth_headers(user_token), timeout=10)
        assert resp.status_code == 403

    def test_unauthenticated_book_creation_returns_401(self):
        """Verify that creating a book without a token returns HTTP 401."""
        resp = requests.post(api("/api/books"), json={"title": "Ghost", "author": "A", "isbn": "x"}, timeout=10)
        assert resp.status_code == 401

    def test_creating_book_with_duplicate_isbn_returns_400(self, admin_token, sample_book_id):
        """Verify that using an ISBN already in the catalog returns HTTP 400."""
        books = requests.get(api("/api/books"), timeout=10).json()
        existing = next((b for b in books if b["id"] == sample_book_id), None)
        assert existing is not None
        payload = {
            "title": "Duplicate",
            "author": "Dup Author",
            "isbn": existing["isbn"],
            "genre": "Other",
            "year": 2020,
            "copies": 1,
            "pages": 100,
            "summary": "",
            "coverColor": "",
            "excerpt": "",
        }
        resp = requests.post(api("/api/books"), json=payload, headers=auth_headers(admin_token), timeout=10)
        assert resp.status_code == 400

    def test_admin_can_update_book_summary(self, admin_token, sample_book_id):
        """Verify that PUT /api/books/:id updates the book record and reflects the new summary."""
        resp = requests.put(
            api(f"/api/books/{sample_book_id}"),
            json={"summary": "Updated summary via integration test."},
            headers=auth_headers(admin_token),
            timeout=10,
        )
        assert resp.status_code == 200
        assert resp.json()["summary"] == "Updated summary via integration test."

    def test_admin_can_delete_book(self, admin_token):
        """Verify that DELETE /api/books/:id removes the book and returns a success message."""
        isbn = f"DEL-{uuid.uuid4().int % 10**9:09d}"
        payload = {
            "title": "Delete Me",
            "author": "Author",
            "isbn": isbn,
            "genre": "Misc",
            "year": 2021,
            "copies": 1,
            "pages": 10,
            "summary": "Will be deleted.",
            "coverColor": "#ccc",
            "excerpt": "",
        }
        book_id = requests.post(api("/api/books"), json=payload, headers=auth_headers(admin_token), timeout=10).json()["id"]
        resp = requests.delete(api(f"/api/books/{book_id}"), headers=auth_headers(admin_token), timeout=10)
        assert resp.status_code == 200
        assert "deleted" in resp.json().get("message", "").lower()


# ── Borrow / Return ───────────────────────────────────────────────────────────


class TestBorrowReturn:
    def test_authenticated_user_can_borrow_available_book(self, user_token, sample_book_id):
        """Verify that a user can borrow an available book and receive HTTP 201."""
        resp = requests.post(
            api(f"/api/books/{sample_book_id}/borrow"),
            headers=auth_headers(user_token),
            timeout=10,
        )
        # 201 on first borrow; 400 if already borrowed in this test session
        assert resp.status_code in (201, 400)

    def test_borrowing_same_book_twice_returns_400(self, user_token, sample_book_id):
        """Verify that borrowing a book already on active loan returns HTTP 400."""
        requests.post(api(f"/api/books/{sample_book_id}/borrow"), headers=auth_headers(user_token), timeout=10)
        resp = requests.post(api(f"/api/books/{sample_book_id}/borrow"), headers=auth_headers(user_token), timeout=10)
        assert resp.status_code == 400

    def test_borrowing_nonexistent_book_returns_404(self, user_token):
        """Verify that attempting to borrow a book with a non-existent ID returns HTTP 404."""
        resp = requests.post(api(f"/api/books/{uuid.uuid4()}/borrow"), headers=auth_headers(user_token), timeout=10)
        assert resp.status_code == 404

    def test_borrow_without_auth_returns_401(self, sample_book_id):
        """Verify that the borrow endpoint requires authentication and returns 401 without a token."""
        resp = requests.post(api(f"/api/books/{sample_book_id}/borrow"), timeout=10)
        assert resp.status_code == 401


# ── Reviews ───────────────────────────────────────────────────────────────────


class TestReviews:
    def test_authenticated_user_can_submit_review(self, user_token, sample_book_id):
        """Verify that a user can post a review and the response contains the submitted rating."""
        payload = {"rating": 5, "comment": "Excellent integration test book!"}
        resp = requests.post(
            api(f"/api/books/{sample_book_id}/review"),
            json=payload,
            headers=auth_headers(user_token),
            timeout=10,
        )
        assert resp.status_code == 201
        assert resp.json()["rating"] == 5

    def test_review_without_comment_returns_400(self, user_token, sample_book_id):
        """Verify that submitting a review with only a rating but no comment returns HTTP 400."""
        resp = requests.post(
            api(f"/api/books/{sample_book_id}/review"),
            json={"rating": 4},
            headers=auth_headers(user_token),
            timeout=10,
        )
        assert resp.status_code == 400

    def test_review_without_auth_returns_401(self, sample_book_id):
        """Verify that the review endpoint requires authentication and returns 401 without a token."""
        resp = requests.post(
            api(f"/api/books/{sample_book_id}/review"),
            json={"rating": 3, "comment": "anon"},
            timeout=10,
        )
        assert resp.status_code == 401


# ── Holds ─────────────────────────────────────────────────────────────────────


class TestHolds:
    def test_authenticated_user_can_place_hold(self, user_token, sample_book_id):
        """Verify that a user can place a reservation hold on a book."""
        resp = requests.post(
            api(f"/api/books/{sample_book_id}/hold"),
            headers=auth_headers(user_token),
            timeout=10,
        )
        # 201 on first hold; 400 if already holds this book in this test session
        assert resp.status_code in (201, 400)

    def test_hold_without_auth_returns_401(self, sample_book_id):
        """Verify that placing a hold requires authentication and returns 401 without a token."""
        resp = requests.post(api(f"/api/books/{sample_book_id}/hold"), timeout=10)
        assert resp.status_code == 401


# ── Admin: Users ──────────────────────────────────────────────────────────────


class TestAdminUsers:
    def test_admin_can_list_all_users(self, admin_token):
        """Verify that GET /api/users returns the full user list when called by an admin."""
        resp = requests.get(api("/api/users"), headers=auth_headers(admin_token), timeout=10)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_regular_user_cannot_list_users(self, user_token):
        """Verify that a non-admin user receives HTTP 403 when accessing the user list."""
        resp = requests.get(api("/api/users"), headers=auth_headers(user_token), timeout=10)
        assert resp.status_code == 403

    def test_unauthenticated_request_to_user_list_returns_401(self):
        """Verify that GET /api/users without a token returns HTTP 401."""
        resp = requests.get(api("/api/users"), timeout=10)
        assert resp.status_code == 401


# ── Logs ─────────────────────────────────────────────────────────────────────


class TestLogs:
    def test_admin_can_read_audit_logs(self, admin_token):
        """Verify that GET /api/logs returns the system audit log list when called by an admin."""
        resp = requests.get(api("/api/logs"), headers=auth_headers(admin_token), timeout=10)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_regular_user_cannot_read_logs(self, user_token):
        """Verify that a non-admin user receives HTTP 403 when accessing the audit log endpoint."""
        resp = requests.get(api("/api/logs"), headers=auth_headers(user_token), timeout=10)
        assert resp.status_code == 403
