```
# Budget Server API Documentation

This document provides comprehensive documentation for the budget server API endpoints. The server runs on `http://localhost:3000` by default and implements session-based authentication with per-user database isolation.

## Base URL
```
http://localhost:3000
```

## Authentication

The API uses session-based authentication with cookies. All endpoints except health check and authentication require a valid session.

### CORS Configuration
- Allowed origins: `http://localhost:5173` (frontend development server)
- Allowed methods: GET, POST, PUT, DELETE
- Credentials: Required (cookies/sessions)

---

## Authentication Endpoints

### 1. User Registration
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "string",  // 3-50 characters, alphanumeric + underscore/hyphen only
  "password": "string"   // minimum 8 characters
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "username": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input (empty username, invalid characters, short password)
- `409 Conflict`: Username already exists
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "mypassword123"}'
```

### 2. User Login
**POST** `/auth/login`

Authenticate user and create session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "username": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Empty username or password
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username": "john_doe", "password": "mypassword123"}'
```

### 3. Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Headers Required:**
- Session cookie (automatically sent by browser)

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "username": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Not logged in or invalid session
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -b cookies.txt
```

### 4. User Logout
**POST** `/auth/logout`

Logout user and destroy session.

**Headers Required:**
- Session cookie

**Response (204 No Content):**
Empty response body

**Example:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

---

## Records Management

All record endpoints require authentication. Records are isolated per user.

### 1. Create Record
**POST** `/records`

Create a new expense record.

**Headers Required:**
- Session cookie
- Content-Type: application/json

**Request Body:**
```json
{
  "name": "string",        // max 255 characters, required
  "amount": number,        // non-zero number, required
  "category_id": "string", // valid category ID, required
  "timestamp": number      // Unix timestamp, required
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "name": "string",
  "amount": number,
  "category_id": "string",
  "timestamp": number  // Unix timestamp
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input (empty name, zero amount, invalid category ID, missing timestamp)
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Category doesn't exist
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Grocery shopping", "amount": 45.67, "category_id": "category-uuid", "timestamp": 1703980800}'
```

### 2. Get Records
**GET** `/records`

Retrieve user's expense records with optional filtering.

**Headers Required:**
- Session cookie

**Query Parameters (all optional):**
- `start_time`: Unix timestamp (default: 0)
- `end_time`: Unix timestamp (default: current time)
- `limit`: Number of records to return (default: 100, max: 1000)

**Response (200 OK):**
```json
{
  "records": [
    {
      "id": "uuid-string",
      "name": "string",
      "amount": number,
      "category_id": "string",
      "timestamp": number
    }
  ],
  "total_count": number
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
# Get all records
curl -X GET http://localhost:3000/records -b cookies.txt

# Get records with filtering
curl -X GET "http://localhost:3000/records?start_time=1640995200&limit=50" -b cookies.txt
```

### 3. Update Record
**PUT** `/records/{id}`

Update an existing expense record.

**Headers Required:**
- Session cookie
- Content-Type: application/json

**Path Parameters:**
- `id`: Record UUID

**Request Body (all fields optional):**
```json
{
  "name": "string",        // optional
  "amount": number,        // optional, non-zero
  "category_id": "string", // optional, must be valid category
  "timestamp": number      // optional, Unix timestamp
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "name": "string",
  "amount": number,
  "category_id": "string",
  "timestamp": number
}
```

**Error Responses:**
- `400 Bad Request`: No fields provided or invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Record not found or category doesn't exist
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X PUT http://localhost:3000/records/record-uuid \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Updated grocery shopping", "amount": 52.34}'
```

### 4. Delete Record
**DELETE** `/records/{id}`

Delete an expense record.

**Headers Required:**
- Session cookie

**Path Parameters:**
- `id`: Record UUID

**Response (204 No Content):**
Empty response body

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Record not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X DELETE http://localhost:3000/records/record-uuid -b cookies.txt
```

---

## Categories Management

All category endpoints require authentication. Categories are isolated per user.

### 1. Create Category
**POST** `/categories`

Create a new expense category.

**Headers Required:**
- Session cookie
- Content-Type: application/json

**Request Body:**
```json
{
  "name": "string"  // max 100 characters, required, case-insensitive unique
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "name": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input (empty name, too long)
- `401 Unauthorized`: Not authenticated
- `409 Conflict`: Category name already exists (case-insensitive)
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Groceries"}'
```

### 2. Get Categories
**GET** `/categories`

Retrieve user's categories with optional search and pagination.

**Headers Required:**
- Session cookie

**Query Parameters (all optional):**
- `limit`: Number of categories (default: 100, max: 1000)
- `offset`: Number of categories to skip (default: 0)
- `search`: Search term for category names (case-insensitive, max 100 chars)

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "uuid-string",
      "name": "string"
    }
  ],
  "total_count": number,
  "limit": number,
  "offset": number
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
# Get all categories
curl -X GET http://localhost:3000/categories -b cookies.txt

# Search categories with pagination
curl -X GET "http://localhost:3000/categories?search=food&limit=10&offset=0" -b cookies.txt
```

### 3. Update Category
**PUT** `/categories/{id}`

Update an existing category.

**Headers Required:**
- Session cookie
- Content-Type: application/json

**Path Parameters:**
- `id`: Category UUID

**Request Body:**
```json
{
  "name": "string"  // required, max 100 characters, must be unique (case-insensitive)
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-string",
  "name": "string"
}
```

**Error Responses:**
- `400 Bad Request`: Name not provided or invalid
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Category not found
- `409 Conflict`: Category name already exists (case-insensitive)
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X PUT http://localhost:3000/categories/category-uuid \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Food & Groceries"}'
```

### 4. Delete Category
**DELETE** `/categories/{id}`

Delete a category. Only allowed if no records use this category.

**Headers Required:**
- Session cookie

**Path Parameters:**
- `id`: Category UUID

**Response (204 No Content):**
Empty response body

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Category not found
- `409 Conflict`: Category has associated records
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X DELETE http://localhost:3000/categories/category-uuid -b cookies.txt
```

---

## Health Check

### Root Endpoint
**GET** `/`

Health check endpoint with visitor counter.

**Response (200 OK):**
```html
<h1>My Budget Server</h1><p>API Ready - Visit count: {number}</p>
```

**Example:**
```bash
curl -X GET http://localhost:3000/
```

---

## Data Types & Constraints

### User Constraints
- Username: 3-50 characters, alphanumeric + underscore/hyphen only
- Password: Minimum 8 characters

### Record Constraints
- Name: Maximum 255 characters, required
- Amount: Non-zero number, required
- Category ID: Must reference existing category

### Category Constraints
- Name: Maximum 100 characters, unique per user (case-insensitive)

### Pagination & Limits
- Default limit: 100
- Maximum limit: 1000
- Default offset: 0

---

## Error Format

All error responses follow this format:
```json
"Error message string"
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Session Management

- Sessions use secure HTTP-only cookies
- Session name: configured via environment
- Session expiry: 30 days of inactivity (configurable)
- Sessions are stored in memory (restart clears all sessions)

---

## Database Architecture

- **Multi-Database Design**: Each user gets their own SQLite database
- **Main Database**: `data/users.db` - stores user accounts
- **User Databases**: `data/user_{id}.db` - stores user's records and categories
- **Complete Data Isolation**: Users cannot access each other's data

---

## Environment Variables

Required for production:
- `SESSION_SECRET`: 64-character hex string for session signing
- `SERVER_HOST`: Server bind address (default: 0.0.0.0)
- `SERVER_PORT`: Server port (default: 3000)
- `DATABASE_PATH`: Path to database files (default: ./data)
```
