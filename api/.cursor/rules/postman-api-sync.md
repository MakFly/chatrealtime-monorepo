# Postman API Collection Sync Rule

## 🎯 Core Principle

**MANDATORY**: Always update Postman collection after ANY API modification.

## When to Update Postman Collection

Update `postman/Chat-Realtime-API.postman_collection.json` when:

1. ✅ **New Endpoint Added**
   - New controller method created
   - New route defined
   - New API Platform resource operation

2. ✅ **Endpoint Modified**
   - Route path changed (e.g., `/api/users` → `/api/v1/users`)
   - HTTP method changed (e.g., POST → PUT)
   - Request parameters changed (query, body, headers)
   - Response structure changed

3. ✅ **Endpoint Removed**
   - Route deprecated or deleted
   - Controller method removed

4. ✅ **Request/Response Schema Changed**
   - New required fields added
   - Optional fields added or removed
   - Data types changed
   - Validation rules changed

5. ✅ **Authentication Changed**
   - New auth methods added (OAuth, API Key, etc.)
   - Auth headers modified
   - Token format changed

6. ✅ **Error Responses Changed**
   - New error codes added
   - Error message format changed
   - New validation errors

## Postman Collection Structure

```
postman/
├── Chat-Realtime-API.postman_collection.json    # Main collection
└── Chat-Realtime-API.postman_environment.json   # Environment variables
```

### Collection Organization

```
Chat Realtime API/
├── Authentication/
│   ├── Status - Get Auth Methods
│   ├── Register - Create Account
│   ├── Login - Email/Password
│   ├── Refresh Token
│   └── Logout
├── Google SSO/
│   ├── Initiate Google OAuth
│   └── Google OAuth Callback
├── User Profile/
│   ├── Get Current User
│   ├── Update Profile
│   └── Change Password
└── Error Examples/
    ├── 401 - Unauthorized
    ├── 400 - Validation Error
    └── 409 - Conflict
```

## Update Workflow

### Step 1: Identify Changes

Before committing code changes, ask:
- Did I add/modify/remove an API endpoint?
- Did I change request/response schemas?
- Did I modify authentication?

### Step 2: Update Collection

For **New Endpoint**:

```json
{
    "name": "Endpoint Name",
    "event": [
        {
            "listen": "test",
            "script": {
                "exec": [
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});"
                ],
                "type": "text/javascript"
            }
        }
    ],
    "request": {
        "method": "POST",
        "header": [
            {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
            }
        ],
        "body": {
            "mode": "raw",
            "raw": "{\n    \"field\": \"value\"\n}"
        },
        "url": {
            "raw": "{{base_url}}{{api_prefix}}/endpoint",
            "host": ["{{base_url}}"],
            "path": ["api", "v1", "endpoint"]
        },
        "description": "Detailed endpoint description"
    }
}
```

For **Modified Endpoint**:
- Update `method`, `url`, `body`, or `headers`
- Update `description` to reflect changes
- Update test scripts if response changed

For **Removed Endpoint**:
- Remove the entire request object from collection
- Document removal in commit message

### Step 3: Update Tests

Add Postman test scripts to validate responses:

```javascript
// Status code validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Response structure validation
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.id).to.exist;
    pm.expect(jsonData.email).to.exist;
});

// Save tokens for subsequent requests
pm.test("Response has tokens", function () {
    const jsonData = pm.response.json();
    pm.collectionVariables.set("access_token", jsonData.token);
    pm.collectionVariables.set("refresh_token", jsonData.refresh_token);
});
```

### Step 4: Update Environment Variables

If new variables needed, update `Chat-Realtime-API.postman_environment.json`:

```json
{
    "key": "new_variable",
    "value": "default_value",
    "type": "default",
    "enabled": true
}
```

### Step 5: Test Collection

Before committing:

1. Import updated collection in Postman
2. Run entire collection with "Run Collection"
3. Verify all requests work correctly
4. Fix any failing tests

### Step 6: Document Changes

In commit message, mention Postman updates:

```
feat: Add user profile update endpoint

- POST /api/v1/me/password for password change
- Updated Postman collection with new endpoint
- Added tests for password validation
```

## Common Postman Patterns

### Using Variables

```json
"url": {
    "raw": "{{base_url}}{{api_prefix}}/users/{{user_id}}",
    "host": ["{{base_url}}"],
    "path": ["api", "v1", "users", "{{user_id}}"]
}
```

### Authentication with Bearer Token

```json
"auth": {
    "type": "bearer",
    "bearer": [
        {
            "key": "token",
            "value": "{{access_token}}",
            "type": "string"
        }
    ]
}
```

### Request Body with Variables

```json
"body": {
    "mode": "raw",
    "raw": "{\n    \"email\": \"{{test_email}}\",\n    \"password\": \"{{test_password}}\"\n}"
}
```

### Chaining Requests (Save Response Data)

```javascript
// In first request (Login)
const jsonData = pm.response.json();
pm.collectionVariables.set("access_token", jsonData.token);

// In second request (Get Profile)
// Uses {{access_token}} automatically
```

## Quality Checklist

Before marking Postman update as complete:

- [ ] All endpoints are documented in collection
- [ ] Request examples use collection variables (not hardcoded values)
- [ ] All requests have meaningful descriptions
- [ ] Test scripts validate status codes
- [ ] Test scripts validate response structure
- [ ] Authentication is properly configured
- [ ] Collection can be run successfully end-to-end
- [ ] Environment variables are documented
- [ ] Error examples are included for new endpoints

## Anti-Patterns to Avoid

### ❌ Hardcoded URLs

```json
// BAD
"url": "http://localhost/api/v1/users"

// GOOD
"url": "{{base_url}}{{api_prefix}}/users"
```

### ❌ Hardcoded Tokens

```json
// BAD
"Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

// GOOD
"Authorization": "Bearer {{access_token}}"
```

### ❌ Missing Descriptions

```json
// BAD
"name": "POST /api/users",
"description": ""

// GOOD
"name": "Create User Account",
"description": "Register a new user with email and password. Returns JWT tokens."
```

### ❌ No Test Scripts

```json
// BAD
"event": []

// GOOD
"event": [
    {
        "listen": "test",
        "script": {
            "exec": [
                "pm.test(\"Status code is 201\", function () {",
                "    pm.response.to.have.status(201);",
                "});"
            ]
        }
    }
]
```

## Integration with Development Workflow

### Pre-Commit Hook (Recommended)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check if API files were modified
API_FILES=$(git diff --cached --name-only | grep -E "(Controller|routes)")

if [ -n "$API_FILES" ]; then
    # Check if Postman collection was also updated
    POSTMAN_UPDATED=$(git diff --cached --name-only | grep "postman/.*\.json")

    if [ -z "$POSTMAN_UPDATED" ]; then
        echo "⚠️  WARNING: API files modified but Postman collection not updated"
        echo "Modified files:"
        echo "$API_FILES"
        echo ""
        echo "Please update postman/Chat-Realtime-API.postman_collection.json"
        exit 1
    fi
fi
```

### CI/CD Validation

Add Postman collection test to CI:

```yaml
# .github/workflows/api-tests.yml
- name: Run Postman Collection
  run: |
    npm install -g newman
    newman run postman/Chat-Realtime-API.postman_collection.json \
      -e postman/Chat-Realtime-API.postman_environment.json
```

## Resources

- **Postman Documentation**: https://learning.postman.com/docs/
- **Newman CLI**: https://www.npmjs.com/package/newman
- **Collection Format**: https://schema.postman.com/

## Enforcement Level

**Priority**: 🟡 IMPORTANT

- **Development**: Strong preference to update Postman after API changes
- **Code Review**: Reviewers should check for Postman updates when API changed
- **CI/CD**: Optional Newman tests to validate collection

---

**Version**: 1.0
**Last Updated**: 2025-10-19
**Applies To**: All API modifications (Controllers, Routes, API Platform Resources)
