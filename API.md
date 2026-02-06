# API Guide (my-budget-server)

Base URL
- Default: http://localhost:3000
- Frontend origin must be allowed by the server via `FRONTEND_ORIGIN` (server default is http://localhost:8080).

Auth + Cookies
- Session cookie is set on login. All API calls must include credentials.
- Use `credentials: "include"` for fetch.
- 401 responses mean not logged in (or session expired).

JSON Conventions
- All request/response bodies are JSON.
- Dates use `YYYY-MM-DD`.
- Amount: positive = income, negative = expense. Amount cannot be 0.

Validation Limits
- username: 4-50 chars, only alphanumeric + _ + -
- password: min 6 chars
- category name: 1-100 chars
- record name: 1-255 chars
- search term: 1-100 chars
- limit: 1..=1000 (default depends on endpoint)
- offset: 0..=1_000_000 (default 0)

Auth Endpoints

POST /auth/register
Request
{
  "username": "string",
  "password": "string"
}
Response 201
{
  "id": "string",
  "username": "string"
}
Errors: 400 validation, 409 username exists

POST /auth/login
Request
{
  "username": "string",
  "password": "string"
}
Response 200
{
  "id": "string",
  "username": "string"
}
Errors: 400 validation, 401 invalid credentials

GET /auth/me
Response 200
{
  "id": "string",
  "username": "string"
}
Errors: 401 not logged in

POST /auth/logout
Response 204 (no body)

Records Endpoints

GET /records
Query params
- start_date (optional, YYYY-MM-DD)
- end_date (optional, YYYY-MM-DD)
- limit (optional, default 500)
- offset (optional, default 0)
Response 200
{
  "records": [
    {
      "id": "string",
      "name": "string",
      "amount": 123.45,
      "category_id": "string",
      "date": "YYYY-MM-DD"
    }
  ],
  "total_count": 123
}
Notes: Records are ordered by date DESC.

POST /records
Request
{
  "name": "string",
  "amount": 123.45,
  "category_id": "string",
  "date": "YYYY-MM-DD"
}
Response 201
{
  "id": "string",
  "name": "string",
  "amount": 123.45,
  "category_id": "string",
  "date": "YYYY-MM-DD"
}
Errors: 400 validation, 400 if category does not exist

PUT /records/{id}
Request (all optional, at least one field required)
{
  "name": "string",
  "amount": 123.45,
  "category_id": "string",
  "date": "YYYY-MM-DD"
}
Response 200
{
  "id": "string",
  "name": "string",
  "amount": 123.45,
  "category_id": "string",
  "date": "YYYY-MM-DD"
}
Errors: 400 validation, 404 not found

DELETE /records/{id}
Response 204 (no body)
Errors: 404 not found

Categories Endpoints

GET /categories
Query params
- limit (optional, default 100)
- offset (optional, default 0)
- search (optional, case-insensitive substring)
Response 200
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "is_income": true
    }
  ],
  "total_count": 123,
  "limit": 100,
  "offset": 0
}
Notes: Categories are ordered by name ASC.

POST /categories
Request
{
  "name": "string",
  "is_income": true
}
Response 201
{
  "id": "string",
  "name": "string",
  "is_income": true
}
Errors: 400 validation, 409 name conflict (case-insensitive)

PUT /categories/{id}
Request
{
  "name": "string"
}
Response 200
{
  "id": "string",
  "name": "string",
  "is_income": true
}
Errors: 400 validation, 404 not found, 409 name conflict

DELETE /categories/{id}
Response 204 (no body)
Errors: 404 not found, 409 if category has records
