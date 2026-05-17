# Authentication System Setup

This document explains the authentication system implementation and how to test it.

## Overview

The authentication system stores user credentials securely in Google Cloud Storage (GCS) and implements the following features:

1. ✅ **User Registration** - Store user credentials in GCS with password hashing
2. ✅ **Duplicate Email Prevention** - Email index prevents duplicate registrations
3. ✅ **Secure Login** - Validate credentials against GCS stored data
4. ✅ **Password Security** - SHA-256 hashing with unique salts
5. ✅ **Session Management** - Token-based authentication

## Architecture

### Backend Components

#### 1. Authentication Manager (`src/api-service/agent/auth/auth_manager.py`)

Main authentication service that handles:
- User registration with duplicate email checking
- Password hashing and verification (SHA-256 with salt)
- Login authentication
- Email index management for quick lookups

**Key Functions:**
- `register_user(email, password, name)` - Register new user
- `login_user(email, password)` - Authenticate user login
- `email_exists(email)` - Check if email is already registered
- `hash_password(password, salt)` - Securely hash passwords
- `verify_password(password, hashed, salt)` - Verify password matches

#### 2. FastAPI Endpoints (`src/api-service/api-service/main.py`)

Three new authentication endpoints:

```python
POST /auth/register
POST /auth/login
GET /auth/check-email/{email}
```

### Frontend Components

#### 1. API Configuration (`src/frontend/src/lib/api-config.ts`)

Centralized API endpoint configuration:
```typescript
export const API_ENDPOINTS = {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    CHECK_EMAIL: `${API_BASE_URL}/auth/check-email`,
    ...
};
```

#### 2. Auth Context (`src/frontend/src/contexts/AuthContext.tsx`)

Updated to use real backend API instead of mock data:
- `login()` - Calls `/auth/login` endpoint
- `signup()` - Calls `/auth/register` endpoint
- Stores user data and token in localStorage
- Provides authentication state management

## GCS Storage Structure

### User Authentication Data

```
ac215-skincare/
├── user_auth/
│   ├── email_index.json                    # Email → username mapping
│   └── {username}/
│       └── credentials.json                # User auth data
├── user_profiles/
│   └── {username}/
│       └── profile.json                    # User preferences, allergies
├── user_chat_history/
│   └── {username}/
│       └── {yearmonth}/
│           └── chat_log_{date}.jsonl       # Chat logs
└── user_image/
    └── {username}/
        └── {timestamp}_{filename}          # Uploaded images
```

### Email Index Format (`user_auth/email_index.json`)

```json
{
  "user@example.com": "user_at_example_com",
  "demo@skinme.ai": "demo_at_skinme_ai"
}
```

This allows O(1) lookup for duplicate email checking without scanning all user files.

### User Credentials Format (`user_auth/{username}/credentials.json`)

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "username": "user_at_example_com",
  "hashed_password": "sha256_hash_here",
  "salt": "random_salt_here",
  "created_at": "2025-12-07T10:30:00Z",
  "last_login": "2025-12-07T12:45:00Z",
  "active": true
}
```

## Testing Instructions

### Prerequisites

1. **Backend Running**
   ```bash
   cd src/api-service
   # Make sure you have GCP credentials configured
   export GOOGLE_CLOUD_PROJECT=your-project-id
   export BUCKET_NAME=ac215-skincare

   # Run the FastAPI server
   python api-service/main.py
   ```

2. **Frontend Running**
   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

3. **Environment Variables**

   Frontend (`.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

### Test Case 1: User Registration

#### Step 1: Register a New User

1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create Account"

**Expected Result:**
- ✅ Registration succeeds
- ✅ Redirected to `/app` dashboard
- ✅ User data stored in GCS at `user_auth/test_at_example_com/credentials.json`
- ✅ Email added to `user_auth/email_index.json`

#### Step 2: Verify in GCS

```bash
# Check email index
gsutil cat gs://ac215-skincare/user_auth/email_index.json

# Check user credentials
gsutil cat gs://ac215-skincare/user_auth/test_at_example_com/credentials.json
```

**Expected Output:**
```json
{
  "test@example.com": "test_at_example_com"
}
```

### Test Case 2: Duplicate Email Prevention

#### Step 1: Try Registering with Same Email

1. Log out from the app
2. Navigate to `http://localhost:3000/signup`
3. Try to register with "test@example.com" again

**Expected Result:**
- ❌ Registration fails
- ✅ Error message: "Email already registered. Please use a different email or try logging in."
- ✅ Form stays on signup page

#### Step 2: Verify Backend Logs

Check the API server logs for:
```
Email already registered: test@example.com
```

### Test Case 3: Successful Login

#### Step 1: Login with Registered User

1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Sign In"

**Expected Result:**
- ✅ Login succeeds
- ✅ Redirected to `/app` dashboard
- ✅ User data loaded in header (name, email)
- ✅ `last_login` timestamp updated in GCS

#### Step 2: Verify Session Persistence

1. Refresh the page
2. User should remain logged in (localStorage)

### Test Case 4: Invalid Login Attempts

#### Test 4a: Wrong Password

1. Navigate to `/login`
2. Enter:
   - Email: "test@example.com"
   - Password: "wrongpassword"

**Expected Result:**
- ❌ Login fails
- ✅ Error message: "Invalid email or password."

#### Test 4b: Non-existent Email

1. Navigate to `/login`
2. Enter:
   - Email: "nonexistent@example.com"
   - Password: "password123"

**Expected Result:**
- ❌ Login fails
- ✅ Error message: "Invalid email or password."

### Test Case 5: Password Security

#### Verify Password Hashing

1. Check the stored credentials in GCS:
   ```bash
   gsutil cat gs://ac215-skincare/user_auth/test_at_example_com/credentials.json
   ```

**Expected Result:**
- ✅ `hashed_password` field contains a SHA-256 hash (64 hex characters)
- ✅ `salt` field contains a unique random salt (64 hex characters)
- ✅ Plain text password is NOT stored anywhere

**Example:**
```json
{
  "hashed_password": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "salt": "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd4"
}
```

### Test Case 6: Email Index Consistency

#### Test Multiple Registrations

Register several users:
```
user1@example.com
user2@example.com
user3@example.com
```

Then verify:
```bash
gsutil cat gs://ac215-skincare/user_auth/email_index.json
```

**Expected Result:**
```json
{
  "user1@example.com": "user1_at_example_com",
  "user2@example.com": "user2_at_example_com",
  "user3@example.com": "user3_at_example_com"
}
```

### Test Case 7: API Endpoint Testing (cURL)

#### Test Registration Endpoint

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "testpass123",
    "name": "API Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "api-test_at_example_com",
    "email": "api-test@example.com",
    "name": "API Test User",
    "createdAt": "2025-12-07T12:00:00Z"
  },
  "token": "random_token_here"
}
```

#### Test Login Endpoint

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api-test@example.com",
    "password": "testpass123"
  }'
```

#### Test Email Check Endpoint

```bash
curl http://localhost:8080/auth/check-email/api-test@example.com
```

**Expected Response:**
```json
{
  "exists": true,
  "message": "Email is already registered"
}
```

## Security Features

### 1. Password Hashing
- Uses SHA-256 with unique salt per user
- Salt is randomly generated using `secrets.token_hex(32)`
- Passwords are never stored in plain text

### 2. Email Normalization
- All emails converted to lowercase
- Prevents duplicate registrations with different cases
- Example: "User@Example.com" → "user@example.com"

### 3. Input Validation
- Password minimum length: 6 characters
- Email format validation (handled by frontend)
- Name is required for registration

### 4. Error Messages
- Generic messages for login failures ("Invalid email or password")
- Prevents user enumeration attacks
- Specific messages for registration to help users

## Troubleshooting

### Issue: "Network error. Please check your connection."

**Cause:** Frontend cannot connect to backend API

**Solution:**
1. Verify backend is running on port 8080
2. Check `NEXT_PUBLIC_API_URL` environment variable
3. Ensure CORS is enabled in FastAPI (already configured)

### Issue: "Registration failed" with no specific error

**Cause:** GCS permissions issue

**Solution:**
1. Check GCP credentials: `gcloud auth application-default login`
2. Verify bucket exists: `gsutil ls gs://ac215-skincare`
3. Check bucket permissions

### Issue: Email already registered but shouldn't be

**Cause:** Email index corruption

**Solution:**
1. Check email_index.json for duplicates
2. Manually verify user credentials files exist
3. If needed, rebuild index from existing credential files

## API Documentation

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_at_example_com",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2025-12-07T10:00:00Z"
  },
  "token": "session_token_here"
}
```

**Error Response (200):**
```json
{
  "success": false,
  "error": "Email already registered. Please use a different email or try logging in."
}
```

### POST /auth/login

Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_at_example_com",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2025-12-07T10:00:00Z"
  },
  "token": "session_token_here"
}
```

**Error Response (200):**
```json
{
  "success": false,
  "error": "Invalid email or password."
}
```

### GET /auth/check-email/{email}

Check if email is already registered.

**Path Parameter:**
- `email`: Email address to check

**Response:**
```json
{
  "exists": true,
  "message": "Email is already registered"
}
```

## Future Improvements

1. **JWT Tokens**: Replace simple tokens with JWT for better security
2. **Password Reset**: Add forgot password functionality
3. **Email Verification**: Send verification emails after registration
4. **Rate Limiting**: Prevent brute force attacks
5. **Session Expiration**: Implement token expiration and refresh
6. **OAuth Integration**: Add Google/GitHub OAuth options
7. **Password Strength**: Enforce stronger password requirements
8. **Two-Factor Auth**: Add 2FA support for enhanced security

## Summary

The authentication system is now fully functional with:

✅ **Requirement 1:** User credentials stored in GCS (`user_auth/{username}/credentials.json`)
✅ **Requirement 2:** Duplicate email prevention via email index
✅ **Requirement 3:** Login only allowed with valid email/password pairs in GCS

All three requirements have been implemented and are ready for testing!
