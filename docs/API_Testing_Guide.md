# RAG Document Management API - Complete Testing Guide

This comprehensive guide provides both manual and automated testing for all API endpoints, from user registration to document search.

## 📁 Testing Options

### 🤖 Automated Testing (Recommended)
1. Install dependencies: `pip install -r requirements.txt`
2. Run: `python automated_api_test.py`
3. Enter API URL and credentials when prompted

### 📋 Manual Testing
Follow the curl commands below for step-by-step testing

## 🔧 Prerequisites

1. **API Gateway URL**: Replace `{API_URL}` with your deployed API Gateway URL
2. **Test Files**: For manual testing, prepare sample documents (PDF, DOCX, TXT)
3. **Tools**: curl, Postman, or use the automated Python script

## 📋 Testing Sequence

### Step 1: Health Check (No Auth Required)

**Endpoint**: `GET /health`

```bash
curl -X GET {API_URL}/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "rag-auth-handler"
}
```

---

### Step 2: User Registration (No Auth Required)

**Endpoint**: `POST /auth/signup`

```bash
curl -X POST {API_URL}/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response**:
```json
{
  "message": "User registered successfully. Please verify your email.",
  "userId": "user-uuid-123"
}
```

**Notes**:
- Password must meet requirements: min 8 chars, uppercase, lowercase, numbers, symbols
- Email must be unique
- User ID will be used internally

---

### Step 3: User Login (No Auth Required)

**Endpoint**: `POST /auth/login`

```bash
curl -X POST {API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "userId": "user-uuid-123",
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

**Important**: Save the `accessToken` for subsequent requests!

---

### Step 4: Create KnowledgeDB (Auth Required)

**Endpoint**: `POST /knowledgedbs`

```bash
curl -X POST {API_URL}/knowledgedbs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "name": "test-documents",
    "description": "Test document collection for API testing"
  }'
```

**Expected Response**:
```json
{
  "knowledgeDbId": "kb-uuid-456",
  "name": "test-documents",
  "description": "Test document collection for API testing",
  "namespace": "user-uuid-123__kb-uuid-456",
  "message": "KnowledgeDB created successfully"
}
```

**Important**: Save the `knowledgeDbId` for document operations!

---

### Step 5: List KnowledgeDBs (Auth Required)

**Endpoint**: `GET /knowledgedbs`

```bash
curl -X GET {API_URL}/knowledgedbs \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "knowledgedbs": [
    {
      "knowledgeDbId": "kb-uuid-456",
      "name": "test-documents",
      "description": "Test document collection for API testing",
      "createdAt": "2024-01-15T10:35:00.000Z",
      "documentCount": 0,
      "namespace": "user-uuid-123__kb-uuid-456"
    }
  ],
  "count": 1
}
```

---

### Step 6: Upload Document (Auth Required)

**Endpoint**: `POST /documents/upload`

**For Text File**:
```bash
# First, encode your text file to base64
echo "This is a test document with important information about API testing." | base64

curl -X POST {API_URL}/documents/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "fileContent": "VGhpcyBpcyBhIHRlc3QgZG9jdW1lbnQgd2l0aCBpbXBvcnRhbnQgaW5mb3JtYXRpb24gYWJvdXQgQVBJIHRlc3RpbmcuCg==",
    "filename": "test-document.txt",
    "fileType": "text/plain",
    "knowledgeDbId": "kb-uuid-456"
  }'
```

**Expected Response**:
```json
{
  "documentId": "doc-uuid-789",
  "filename": "test-document.txt",
  "chunkCount": 1,
  "message": "Document uploaded and processed successfully"
}
```

**Important**: Save the `documentId` for document operations!

---

### Step 7: Generate Document (Auth Required)

**Endpoint**: `POST /documents/generate`

```bash
curl -X POST {API_URL}/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "Create a comprehensive guide about machine learning fundamentals, including supervised learning, unsupervised learning, and neural networks",
    "knowledgeDbId": "kb-uuid-456"
  }'
```

**Expected Response**:
```json
{
  "documentId": "doc-uuid-890",
  "filename": "create-a-comprehensive-guide-about-machine-learning.md",
  "prompt": "Create a comprehensive guide about machine learning fundamentals, including supervised learning, unsupervised learning, and neural networks",
  "chunkCount": 8,
  "contentPreview": "# Machine Learning Fundamentals Guide\n\nMachine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task....",
  "message": "Document generated and stored successfully"
}
```

**Features**:
- Uses Claude 3 to generate comprehensive markdown content
- Automatically creates filename from prompt
- Follows same processing pipeline as uploaded documents
- Content is chunked, embedded, and stored in Pinecone
- Supports markdown formatting with headers, lists, code blocks

**Important**: Save the `documentId` for document operations!

---

### Step 8: List Documents (Auth Required)

**Endpoint**: `GET /documents`

```bash
# List all documents
curl -X GET {API_URL}/documents \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# List documents in specific KnowledgeDB
curl -X GET "{API_URL}/documents?knowledgeDbId=kb-uuid-456" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "documents": [
    {
      "documentId": "doc-uuid-789",
      "filename": "test-document.txt",
      "fileType": "text/plain",
      "fileSize": 65,
      "knowledgeDbId": "kb-uuid-456",
      "chunkCount": 1,
      "createdAt": "2024-01-15T10:40:00.000Z",
      "status": "processed"
    }
  ],
  "count": 1
}
```

---

### Step 9: Get Document Details (Auth Required)

**Endpoint**: `GET /documents/{doc_id}`

```bash
curl -X GET {API_URL}/documents/doc-uuid-789 \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "documentId": "doc-uuid-789",
  "filename": "test-document.txt",
  "fileType": "text/plain",
  "fileSize": 65,
  "knowledgeDbId": "kb-uuid-456",
  "chunkCount": 1,
  "createdAt": "2024-01-15T10:40:00.000Z",
  "status": "processed",
  "downloadUrl": "https://s3.amazonaws.com/bucket/presigned-url..."
}
```

---

### Step 10: Search Documents (Auth Required)

**Endpoint**: `POST /search`

```bash
curl -X POST {API_URL}/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "question": "What information is available about API testing?",
    "knowledge_db": "kb-uuid-456",
    "top_k": 3
  }'
```

**Expected Response**:
```json
{
  "answer": "The document contains important information about API testing, specifically mentioning that it is a test document with relevant details for API testing purposes.",
  "sources": [
    {
      "doc_id": "doc-uuid-789",
      "title": "test-document.txt",
      "chunk": "This is a test document with important information about API testing.",
      "score": 0.95
    }
  ],
  "question": "What information is available about API testing?",
  "knowledgeDb": "kb-uuid-456"
}
```

---

### Step 11: Reindex Document (Auth Required)

**Endpoint**: `POST /documents/reindex`

```bash
curl -X POST {API_URL}/documents/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "documentId": "doc-uuid-789"
  }'
```

**Expected Response**:
```json
{
  "documentId": "doc-uuid-789",
  "chunkCount": 1,
  "message": "Document reindexed successfully"
}
```

---

### Step 12: Generate Image (Auth Required)

**Endpoint**: `POST /images/generate`

```bash
curl -X POST {API_URL}/images/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "A futuristic AI assistant helping with documents",
    "provider": "aws"
  }'
```

**Expected Response**:
```json
{
  "imageId": "img-uuid-101",
  "prompt": "A futuristic AI assistant helping with documents",
  "provider": "aws",
  "image": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "message": "Image generated and stored successfully"
}
```

**Important**: Save the `imageId` for image operations!

**Provider Examples**:
```bash
# AWS Provider
curl -X POST {API_URL}/images/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "A detailed technical diagram",
    "provider": "aws"
  }'

# Azure Provider
curl -X POST {API_URL}/images/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "A modern office workspace",
    "provider": "azure"
  }'
```

---

### Step 13: List Images (Auth Required)

**Endpoint**: `GET /images`

```bash
curl -X GET {API_URL}/images \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "images": [
    {
      "imageId": "img-uuid-101",
      "prompt": "A futuristic AI assistant helping with documents",
      "provider": "aws",
      "fileSize": 245760,
      "createdAt": "2024-01-15T10:45:00.000Z",
      "status": "generated"
    }
  ],
  "count": 1
}
```

---

### Step 14: Get Image Details (Auth Required)

**Endpoint**: `GET /images/{image_id}`

```bash
curl -X GET {API_URL}/images/img-uuid-101 \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "imageId": "img-uuid-101",
  "prompt": "A futuristic AI assistant helping with documents",
  "provider": "aws",
  "fileSize": 245760,
  "createdAt": "2024-01-15T10:45:00.000Z",
  "status": "generated",
  "downloadUrl": "https://s3.amazonaws.com/bucket/presigned-url..."
}
```

---

### Step 15: Regenerate Image (Auth Required)

**Endpoint**: `POST /images/reindex`

```bash
curl -X POST {API_URL}/images/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "imageId": "img-uuid-101"
  }'
```

**Expected Response**:
```json
{
  "imageId": "img-uuid-101",
  "prompt": "A futuristic AI assistant helping with documents",
  "provider": "aws",
  "message": "Image regenerated successfully"
}
```

---

### Step 16: Delete Image (Auth Required)

**Endpoint**: `DELETE /images/{image_id}`

```bash
curl -X DELETE {API_URL}/images/img-uuid-101 \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "message": "Image with prompt 'A futuristic AI assistant helping with documents' deleted successfully"
}
```

---

### Step 17: Refresh Token (No Auth Required)

**Endpoint**: `POST /auth/refresh`

```bash
curl -X POST {API_URL}/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{REFRESH_TOKEN_FROM_LOGIN}"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

---

### Step 18: Delete Document (Auth Required)

**Endpoint**: `DELETE /documents/{doc_id}`

```bash
curl -X DELETE {API_URL}/documents/doc-uuid-789 \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "message": "Document 'test-document.txt' deleted successfully"
}
```

---

### Step 19: Delete KnowledgeDB (Auth Required)

**Endpoint**: `DELETE /knowledgedbs/{knowledge_db_id}`

```bash
curl -X DELETE {API_URL}/knowledgedbs/kb-uuid-456 \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Expected Response**:
```json
{
  "message": "KnowledgeDB 'test-documents' and all associated documents deleted successfully",
  "deletedDocuments": 0,
  "deletedVectors": 0
}
```

---

### Step 20: Logout (Auth Required)

**Endpoint**: `POST /auth/logout`

```bash
curl -X POST {API_URL}/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "refreshToken": "{REFRESH_TOKEN_FROM_LOGIN}"
  }'
```

**Expected Response**:
```json
{
  "message": "Successfully logged out"
}
```

---

## 🔍 Error Scenarios to Test

### Authentication Errors

1. **Invalid Credentials**:
```bash
curl -X POST {API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }'
```

2. **Missing Authorization Header**:
```bash
curl -X GET {API_URL}/knowledgedbs
```

3. **Invalid Token**:
```bash
curl -X GET {API_URL}/knowledgedbs \
  -H "Authorization: Bearer invalid-token"
```

### Validation Errors

1. **Duplicate KnowledgeDB Name**:
```bash
# Create the same KnowledgeDB twice
curl -X POST {API_URL}/knowledgedbs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"name": "test-documents", "description": "Duplicate test"}'
```

2. **Invalid Document Generation Prompt**:
```bash
curl -X POST {API_URL}/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "",
    "knowledgeDbId": "kb-uuid-456"
  }'
```

3. **Unsupported File Type**:
```bash
curl -X POST {API_URL}/documents/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "fileContent": "dGVzdA==",
    "filename": "test.exe",
    "fileType": "application/x-executable",
    "knowledgeDbId": "kb-uuid-456"
  }'
```

4. **Non-existent Resource**:
```bash
curl -X GET {API_URL}/documents/non-existent-id \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

---

## 📊 Performance Testing

### Load Testing Recommendations

1. **Concurrent User Registration**: Test multiple users signing up simultaneously
2. **Bulk Document Upload**: Upload multiple documents to test processing capacity
3. **Search Performance**: Test search response times with varying document counts
4. **Token Refresh**: Test token refresh under load

### Monitoring Points

- Response times for each endpoint
- Error rates during high load
- Memory usage during document processing
- Vector search performance with large datasets

---

## 🛠️ Troubleshooting Common Issues

### 1. Token Expiration
- **Symptom**: 401 Unauthorized after some time
- **Solution**: Use refresh token to get new access token

### 2. File Upload Failures
- **Symptom**: 500 error during document upload
- **Solution**: Check file size (<10MB), file type, and base64 encoding

### 3. Search Returns No Results
- **Symptom**: Empty sources array in search response
- **Solution**: Ensure documents are uploaded and processed, check KnowledgeDB ID

### 4. Pinecone Connection Errors
- **Symptom**: Vector operations fail
- **Solution**: Verify Pinecone API key in Secrets Manager

---

## 📝 Test Data Templates

### Sample Text Document
```
# API Testing Guide

This document contains comprehensive information about testing REST APIs.

## Key Topics:
- Authentication and authorization
- Request/response validation
- Error handling
- Performance testing

## Best Practices:
1. Test all endpoints systematically
2. Validate error scenarios
3. Monitor performance metrics
4. Document test results
```

### Sample JSON for Testing
```json
{
  "users": [
    {
      "email": "user1@test.com",
      "password": "TestPass123!",
      "firstName": "User",
      "lastName": "One"
    },
    {
      "email": "user2@test.com", 
      "password": "TestPass456!",
      "firstName": "User",
      "lastName": "Two"
    }
  ],
  "knowledgedbs": [
    {
      "name": "technical-docs",
      "description": "Technical documentation collection"
    },
    {
      "name": "user-guides",
      "description": "User guide collection"
    }
  ]
}
```

---

## 🎯 Success Criteria

A successful test run should demonstrate:

1. ✅ User can register and login successfully
2. ✅ JWT tokens work for authenticated endpoints
3. ✅ KnowledgeDBs can be created, listed, and deleted
4. ✅ Documents can be uploaded, generated, processed, and searched
5. ✅ Document generation using Claude 3 produces quality markdown content
6. ✅ Search returns relevant results with proper sources
7. ✅ Image generation works with both AWS and Azure providers
8. ✅ Different image models produce appropriate results
9. ✅ Error handling works correctly for invalid requests
10. ✅ Token refresh mechanism works
11. ✅ User data isolation is maintained
12. ✅ All cleanup operations work properly
13. ✅ Health checks return proper status

---

## 🤖 Automated Testing Details

### What Gets Tested
The automated script (`automated_api_test.py`) tests the complete user journey:

1. **Health Check** - Verify API is running
2. **User Registration** - Create new test user
3. **User Login** - Authenticate and get tokens
4. **Create KnowledgeDB** - Create document collection
5. **List KnowledgeDBs** - Verify creation
6. **Upload Document** - Upload and process test document
7. **Generate Document** - Generate document using Claude 3
8. **List Documents** - Verify upload and generation
9. **Get Document Details** - Retrieve metadata and download URL
10. **Search Documents** - Test RAG search functionality
11. **Generate Image** - Test image generation with AI models
12. **List Images** - Verify image storage
13. **Get Image Details** - Retrieve image metadata and download URL
14. **Regenerate Image** - Test image reprocessing
15. **Reindex Document** - Test document reprocessing
16. **Refresh Token** - Test token refresh mechanism
17. **Delete Document** - Clean up uploaded document
18. **Delete Generated Documents** - Clean up AI-generated documents
19. **Delete Image** - Clean up generated image
20. **Delete KnowledgeDB** - Clean up collection
21. **User Logout** - End session

### File Upload in Automated Script
The automated script creates a test document **in-memory** and uploads it as base64:

```python
# Test document content (created dynamically)
doc_content = """
# API Testing Document

This is a comprehensive test document for the RAG Document Management API.

## Key Features:
- Document upload and processing
- Vector embeddings generation
- Semantic search capabilities
- User authentication and authorization

## Testing Information:
This document contains important information about API testing procedures,
authentication mechanisms, and document management workflows.

The system supports multiple file formats including PDF, DOCX, and TXT files.
All documents are processed using advanced AI models for optimal search results.
"""

# Convert to base64 for upload
file_content_b64 = base64.b64encode(doc_content.encode('utf-8')).decode('utf-8')
```

**No external files needed** - the script generates test content automatically!

### Test Results Output
```
🚀 Starting RAG Document Management API Test Suite
============================================================

🏥 Testing Health Check...
[10:30:15] ✅ PASS - Health Check
    Details: Service: rag-auth-handler

👤 Testing User Registration...
[10:30:16] ✅ PASS - User Registration
    Details: User ID: abc-123-def

... (continues for all tests)

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 19
Passed: 19
Failed: 0
Success Rate: 100.0%
Duration: 52.18 seconds

🎉 ALL TESTS PASSED! API is working correctly.
```

## 📋 Manual Test Checklist

- [ ] Health check endpoint responds
- [ ] User registration with valid data
- [ ] User login returns tokens
- [ ] Create KnowledgeDB with unique name
- [ ] List KnowledgeDBs shows created items
- [ ] Upload document (TXT, PDF, DOCX)
- [ ] Generate document using Claude 3
- [ ] List documents shows uploaded items
- [ ] Get document details with download URL
- [ ] Search returns relevant results
- [ ] Generate image with AWS and Azure providers
- [ ] List images shows generated items
- [ ] Get image details with download URL
- [ ] Regenerate image creates new version
- [ ] Delete image removes from storage
- [ ] Reindex document updates vectors
- [ ] Refresh token generates new access token
- [ ] Delete document removes from all stores
- [ ] Delete KnowledgeDB cascades properly
- [ ] Logout invalidates session
- [ ] Error scenarios handled gracefully

## 🛠️ Troubleshooting

### Common Issues
1. **Connection Errors**: Verify API Gateway URL is correct
2. **Authentication Failures**: Check Cognito User Pool configuration
3. **Upload Failures**: Ensure file size limits and supported formats
4. **Search No Results**: Verify Pinecone index and Bedrock model access

### Debug Mode
Add debug prints to the automated script:
```python
# Add after line 45 in automated_api_test.py
print(f"Request: {method} {url}")
print(f"Headers: {headers}")
if data:
    print(f"Data: {json.dumps(data, indent=2)}")
```