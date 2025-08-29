# Budget Server API Documentation

Budget server API with session-based authentication and per-user database isolation. Base URL: `http://localhost:3000`

## Authentication

Session-based authentication with secure HTTP-only cookies. All endpoints require authentication except health check and auth endpoints.

**CORS**: Origins `http://localhost:5173` | Methods: GET, POST, PUT, DELETE | Credentials required

### Authentication Endpoints

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| POST | `/auth/register` | Register user | `{"username": "string", "password": "string"}` |
| POST | `/auth/login` | Login user | `{"username": "string", "password": "string"}` |
| GET | `/auth/me` | Get current user | None |
| POST | `/auth/logout` | Logout user | None |

**Validation Rules**:
- Username: 3-50 chars, alphanumeric + underscore/hyphen only
- Password: Minimum 8 characters

**Response Format** (register/login/me):
```json
{"id": "uuid", "username": "string"}
```

---

## Records Management

CRUD operations for expense records. All endpoints require authentication.

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/records` | Create record |
| GET | `/records` | List records (with filtering) |
| PUT | `/records/{id}` | Update record |
| DELETE | `/records/{id}` | Delete record |

### Record Schema
```json
{
  "id": "uuid",
  "name": "string",           // max 255 chars
  "amount": number,           // non-zero
  "category_id": "uuid",      // must exist
  "timestamp": number         // Unix timestamp
}
```

### Query Parameters (GET)
- `start_time`: Unix timestamp (default: 0)
- `end_time`: Unix timestamp (default: current)
- `limit`: Records count (default: 100, max: 1000)

### Example Response (GET)
```json
{
  "records": [{"id": "uuid", "name": "Grocery", "amount": 45.67, "category_id": "uuid", "timestamp": 1703980800}],
  "total_count": 1
}
```

---

## Categories Management

CRUD operations for expense categories. All endpoints require authentication.

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/categories` | Create category |
| GET | `/categories` | List categories |
| PUT | `/categories/{id}` | Update category |
| DELETE | `/categories/{id}` | Delete category |

### Category Schema
```json
{
  "id": "uuid",
  "name": "string"  // max 100 chars, case-insensitive unique per user
}
```

### Query Parameters (GET)
- `limit`: Categories count (default: 100, max: 1000)
- `offset`: Skip count (default: 0)
- `search`: Name search (case-insensitive, max 100 chars)

### Example Response (GET)
```json
{
  "categories": [{"id": "uuid", "name": "Groceries"}],
  "total_count": 1,
  "limit": 100,
  "offset": 0
}
```

**Note**: Category deletion only allowed if no records reference it.

---

## Health Check

**GET** `/` - Server status with visitor counter

**Response**: `<h1>My Budget Server</h1><p>API Ready - Visit count: {number}</p>`

---

## Error Handling

**Format**: `"Error message string"`

**Status Codes**:
- 200: Success
- 201: Created  
- 204: No Content
- 400: Bad Request (validation)
- 401: Unauthorized
- 404: Not Found
- 409: Conflict (duplicate)
- 500: Server Error

---

## Session & Database

**Sessions**:
- Secure HTTP-only cookies, 30-day expiry
- In-memory storage (cleared on restart)

**Database Architecture**:
- `data/users.db` - User accounts
- `data/user_{id}.db` - Per-user expense data
- Complete data isolation between users

**Environment Variables**:
- `SESSION_SECRET` - 64-char hex string (required)
- `SERVER_HOST` - Bind address (default: 0.0.0.0)
- `SERVER_PORT` - Port (default: 3000)
- `DATABASE_PATH` - Data directory (default: ./data)

---

## Example Usage

```bash
# Register and login
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"username":"user","password":"password123"}'
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -c cookies.txt -d '{"username":"user","password":"password123"}'

# Create category and record
curl -X POST http://localhost:3000/categories -H "Content-Type: application/json" -b cookies.txt -d '{"name":"Food"}'
curl -X POST http://localhost:3000/records -H "Content-Type: application/json" -b cookies.txt -d '{"name":"Lunch","amount":12.50,"category_id":"category-id","timestamp":1703980800}'

# Retrieve data
curl -X GET http://localhost:3000/categories -b cookies.txt
curl -X GET http://localhost:3000/records -b cookies.txt
```