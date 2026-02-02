# Monitoring Objects API Documentation

Base URL: `http://localhost:8081/api`

All endpoints require authentication via Bearer token in the Authorization header.

## Authentication

Get a token from Keycloak:
```bash
curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_username" \
  -d "password=your_password" \
  -d "grant_type=password" \
  -d "client_id=spa-client" \
  -d "client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3"
```

## Endpoints

### 1. Create Monitoring Object

**POST** `/api/mon-objects`

Creates a new monitoring object in the system.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Router-Core-01",
  "type": "router",
  "parentId": "uuid-of-parent",  // optional
  "childId": "uuid-of-child",     // optional
  "technology": "Cisco IOS-XE",
  "platform": "Catalyst 9000",
  "network": "Core Network",
  "manufacturer": "Cisco Systems"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Router-Core-01",
  "type": "router",
  "parentId": null,
  "childId": null,
  "technology": "Cisco IOS-XE",
  "platform": "Catalyst 9000",
  "network": "Core Network",
  "manufacturer": "Cisco Systems",
  "createdAt": "2026-01-02T19:30:00Z",
  "updatedAt": "2026-01-02T19:30:00Z"
}
```

**Validation:**
- `name` is required (max 255 characters)
- All other fields are optional

---

### 2. Get Monitoring Object by ID

**GET** `/api/mon-objects/{id}`

Retrieves a single monitoring object by its UUID.

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `id` (UUID) - The monitoring object ID

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Router-Core-01",
  "type": "router",
  "technology": "Cisco IOS-XE",
  "platform": "Catalyst 9000",
  "network": "Core Network",
  "manufacturer": "Cisco Systems",
  "createdAt": "2026-01-02T19:30:00Z",
  "updatedAt": "2026-01-02T19:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `404 Not Found` - Object doesn't exist

---

### 3. List Monitoring Objects

**GET** `/api/mon-objects`

Retrieves a paginated list of monitoring objects with optional filtering.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `pageSize` (integer, default: 20, max: 100) - Items per page
- `type` (string, optional) - Filter by object type
- `name` (string, optional) - Filter by name (case-insensitive partial match)
- `technology` (string, optional) - Filter by technology

**Example Request:**
```
GET /api/mon-objects?page=1&pageSize=20&type=router&name=core
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Router-Core-01",
      "type": "router",
      "technology": "Cisco IOS-XE",
      "platform": "Catalyst 9000",
      "network": "Core Network",
      "manufacturer": "Cisco Systems",
      "createdAt": "2026-01-02T19:30:00Z",
      "updatedAt": "2026-01-02T19:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Router-Core-02",
      "type": "router",
      "technology": "Juniper JunOS",
      "platform": "MX Series",
      "network": "Core Network",
      "manufacturer": "Juniper Networks",
      "createdAt": "2026-01-02T19:35:00Z",
      "updatedAt": "2026-01-02T19:35:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### 4. Update Monitoring Object

**PUT** `/api/mon-objects/{id}`

Updates an existing monitoring object. Only provided fields will be updated.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**
- `id` (UUID) - The monitoring object ID

**Request Body** (all fields optional):
```json
{
  "name": "Router-Core-01-Updated",
  "type": "router",
  "technology": "Cisco IOS-XR",
  "platform": "ASR 9000",
  "network": "Core Network - Region A",
  "manufacturer": "Cisco Systems"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Router-Core-01-Updated",
  "type": "router",
  "technology": "Cisco IOS-XR",
  "platform": "ASR 9000",
  "network": "Core Network - Region A",
  "manufacturer": "Cisco Systems",
  "createdAt": "2026-01-02T19:30:00Z",
  "updatedAt": "2026-01-02T20:15:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID or request body
- `404 Not Found` - Object doesn't exist

---

### 5. Delete Monitoring Object

**DELETE** `/api/mon-objects/{id}`

Permanently deletes a monitoring object.

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parameters:**
- `id` (UUID) - The monitoring object ID

**Response:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `404 Not Found` - Object doesn't exist

---

## Example Usage for Angular/Frontend

### Service Setup

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export class MonObjectService {
  private apiUrl = 'http://localhost:8081/api/mon-objects';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createMonObject(data: CreateMonObjectRequest): Observable<MonObject> {
    return this.http.post<MonObject>(this.apiUrl, data, {
      headers: this.getHeaders()
    });
  }

  getMonObject(id: string): Observable<MonObject> {
    return this.http.get<MonObject>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  listMonObjects(params: ListParams): Observable<MonObjectListResponse> {
    const queryParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());
    
    if (params.type) queryParams.set('type', params.type);
    if (params.name) queryParams.set('name', params.name);
    
    return this.http.get<MonObjectListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params: queryParams
    });
  }

  updateMonObject(id: string, data: UpdateMonObjectRequest): Observable<MonObject> {
    return this.http.put<MonObject>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteMonObject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
```

### TypeScript Interfaces

```typescript
export interface MonObject {
  id: string;
  name: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonObjectRequest {
  name: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
}

export interface UpdateMonObjectRequest {
  name?: string;
  type?: string;
  parentId?: string;
  childId?: string;
  technology?: string;
  platform?: string;
  network?: string;
  manufacturer?: string;
}

export interface MonObjectListResponse {
  items: MonObject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListParams {
  page: number;
  pageSize: number;
  type?: string;
  name?: string;
  technology?: string;
}
```

## Testing with curl

### Create an object
```bash
curl -X POST "http://localhost:8081/api/mon-objects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Switch-Access-01",
    "type": "switch",
    "technology": "Cisco IOS",
    "platform": "Catalyst 2960",
    "network": "Access Layer",
    "manufacturer": "Cisco Systems"
  }'
```

### List objects
```bash
curl -X GET "http://localhost:8081/api/mon-objects?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get specific object
```bash
curl -X GET "http://localhost:8081/api/mon-objects/{id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update object
```bash
curl -X PUT "http://localhost:8081/api/mon-objects/{id}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Switch-Access-01-Updated",
    "platform": "Catalyst 2960X"
  }'
```

### Delete object
```bash
curl -X DELETE "http://localhost:8081/api/mon-objects/{id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
Invalid request body
```
or
```json
Invalid ID format
```

### 401 Unauthorized
```json
Authorization header required
```

### 403 Forbidden
```json
Forbidden
```

### 404 Not Found
```json
Monitoring object not found
```

### 500 Internal Server Error
```json
Failed to create/update/delete monitoring object
```

## CORS Configuration

The API has CORS enabled, allowing requests from:
- `http://localhost:4200` (Angular dev server)
- Other origins as configured

## Database Schema

The `mon_objects` table structure:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Object name |
| type | VARCHAR(100) | nullable | Object type (router, switch, server, etc.) |
| parent_id | UUID | nullable | Reference to parent object |
| child_id | UUID | nullable | Reference to child object |
| technology | VARCHAR(100) | nullable | Technology/OS (e.g., "Cisco IOS-XE") |
| platform | VARCHAR(100) | nullable | Hardware platform |
| network | VARCHAR(100) | nullable | Network segment |
| manufacturer | VARCHAR(100) | nullable | Device manufacturer |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

Indexes:
- `parent_id` - For hierarchy queries
- `child_id` - For relationship queries
- `type` - For filtering by type
- `name` - For name searches

## Notes for Frontend Development

1. **Authentication**: Make sure to obtain and store the Keycloak token before making API calls
2. **Pagination**: Always use pagination for list endpoints to avoid performance issues
3. **Filtering**: Use query parameters to filter results on the server side
4. **Error Handling**: Implement proper error handling for all API responses
5. **UUID Format**: All IDs are UUIDs in the format: `550e8400-e29b-41d4-a716-446655440000`
6. **Timestamps**: All timestamps are in ISO 8601 format in UTC
7. **Nullable Fields**: Most fields except `name` are nullable/optional


