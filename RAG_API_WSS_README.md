# RAG Document Management System

A serverless, REST-based AI application for managing documents and enabling smart document search using Retrieval-Augmented Generation (RAG) powered by Amazon Bedrock, Azure OpenAI, and Pinecone.

## 🎯 Features

- **Document Management**: Upload, generate, list, and delete documents (PDF, DOCX, TXT, MD)
- **Smart Search**: Natural language queries with AI-powered answers
- **Multi-Model Chat**: WebSocket-based conversational AI with AWS/Azure model selection
- **KnowledgeDB Organization**: Group documents into logical collections
- **User Authentication**: Secure JWT-based authentication via AWS Cognito
- **Conversation History**: Persistent chat history per user
- **Image Generation**: Text-to-image generation with AWS Titan and Azure DALL-E 3
- **Scalable Architecture**: Serverless AWS infrastructure

## 📄 Document Support Matrix

| Extension | Status | Processing Method | MIME Type |
|-----------|--------|-------------------|----------|
| `.pdf` | ✅ **Supported** | PyPDF2 | `application/pdf` |
| `.docx` | ✅ **Supported** | python-docx | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.txt` | ✅ **Supported** | Native Python | `text/plain` |
| `.md` | ✅ **Supported** | Native Python + Claude 3 Generation | `text/markdown` |
| `.json` | ⏳ **Planned** | Native Python | `application/json` |
| `.csv` | ⏳ **Planned** | Native Python | `text/csv` |
| `.pptx` | ⏳ **Planned** | python-pptx | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| `.xlsx` | ⏳ **Planned** | openpyxl/pandas | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `.xls` | ⏳ **Planned** | xlrd/pandas | `application/vnd.ms-excel` |
| `.ppt` | ⏳ **Planned** | Apache Tika | `application/vnd.ms-powerpoint` |
| `.doc` | ⏳ **Planned** | Apache Tika | `application/msword` |
| `.rtf` | ⏳ **Planned** | Apache Tika | `application/rtf` |
| `.odt` | ⏳ **Planned** | Apache Tika | `application/vnd.oasis.opendocument.text` |
| `.html` | ⏳ **Planned** | Apache Tika | `text/html` |
| `.xml` | ⏳ **Planned** | Apache Tika | `application/xml` |
| `.epub` | ⏳ **Planned** | Apache Tika | `application/epub+zip` |

## 🖼️ Image Processing Matrix

| Extension | Status | Processing Method | MIME Type |
|-----------|--------|-------------------|----------|
| `.png` | 🚧 **In Progress** | Image to Text using LLM | `image/png` |
| `.jpg` | 🚧 **In Progress** | Image to Text using LLM | `image/jpeg` |
| `.gif` | 🚧 **In Progress** | Image to Text using LLM | `image/gif` |
| `.webp` | 🚧 **In Progress** | Image to Text using LLM | `image/webp` |

**Legend:**
- ✅ **Supported**: Currently implemented and working
- 🚧 **In Progress**: Next in development pipeline
- ⏳ **Planned**: Future implementation planned

## ⚡ Core Functionalities

### 📄 Document Management
- Upload, list, reindex, and delete documents (PDF, DOCX, TXT, MD)
- Generate documents using Claude 3
- Store documents in Amazon S3
- Store metadata in DynamoDB

### 🔍 Smart Document Retrieval (RAG)
- Accepts natural language queries
- Uses Amazon Titan embeddings to convert questions to vectors
- Queries Pinecone to retrieve relevant document chunks
- Uses Claude 3 Haiku (via Bedrock) to generate answers from chunks

### 💬 Multi-Model Chat
- WebSocket-based real-time chat with conversation history
- AWS models: Claude 3 Haiku (basic), Claude 3.5 Sonnet (premium)
- Azure models: GPT-4o Mini (basic), GPT-4o (premium)
- Provider selection: AWS Bedrock or Azure OpenAI

### 🎨 Image Generation
- Text-to-image generation via REST API
- AWS: Amazon Titan Image Generator
- Azure: DALL-E 3
- Base64-encoded image responses

### 🗂️ Knowledge DBs (User Document Areas)
- Users can create multiple "KnowledgeDBs" (logical partitions or collections)
- Each KnowledgeDB is a separate namespace in Pinecone and S3 prefix
- Allows organizing documents by project, topic, or team context

## 🏗️ Architecture

- **6 Lambda Functions**: auth_handler, knowledgedb_handler, document_handler (with generation), search_handler, chat_handler, image_handler
- **API Gateway**: REST API + WebSocket API with Cognito authorization
- **Amazon Bedrock**: Titan embeddings + Claude 3 models + Titan Image Generator
- **Azure OpenAI**: GPT-4o models + DALL-E 3 (optional)
- **Pinecone**: Vector search with user namespaces
- **DynamoDB**: 5 tables (Users, KnowledgeDBs, Documents, Images, ChatMessages)
- **S3**: Secure document storage with user prefixes
- **Secrets Manager**: Secure API key storage (Pinecone + Azure)

```
Client (Chat UI / Web Frontend)
            ↓
API Gateway (REST + WebSocket, Cognito-authorized)
            ↓
Lambda Functions (upload, delete, search, list, chat, images)
            ↓
    ┌───────────┬─────────────┬──────────────┬─────────────┐
    │    S3     │   Bedrock   │   Pinecone   │  DynamoDB   │
    │(Document  │(Embeddings  │(Vector search│(Document    │
    │ storage)  │   + LLM)    │ namespaces)  │ metadata)   │
    └───────────┴─────────────┴──────────────┴─────────────┘
```

## 📋 Prerequisites

- **Python 3.11+** installed
- **Node.js 18+** installed
- **AWS CLI configured** with appropriate permissions
- **Docker installed** (for Lambda bundling)
- **Pinecone account** and API key

## 🚀 Complete Deployment Process

### Step 1: Environment Setup
```bash
# Clone/navigate to project directory
cd knowledgedb

# Run automated deployment
python deploy.py
```

### Step 2: Manual Configuration

#### Pinecone Index Setup
1. Log into Pinecone console
2. Create new index:
   - **Name**: `rag-documents`
   - **Dimension**: `1536`
   - **Metric**: `cosine`
   - **Environment**: `us-east-1-aws`
   - **Pod Type**: `p1.x1` (starter tier)

#### AWS Bedrock Model Access
1. Navigate to AWS Bedrock console (us-east-1 region)
2. Go to "Model access" section
3. Enable these models:
   - `amazon.titan-embed-text-v1`
   - `anthropic.claude-3-haiku-20240307-v1:0`
   - `anthropic.claude-3-5-sonnet-20240620-v1:0`
   - `amazon.titan-image-generator-v1`

### Step 3: Update Pinecone Credentials
```bash
# Update the secret in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id rag-pinecone-credentials \
  --secret-string '{"pinecone_api_key":"your-actual-api-key","pinecone_environment":"us-east-1-aws"}'
```

## 🔧 Lambda Dependency Management

### How It Works
1. **Docker Bundling**: CDK uses Docker to install Python packages
2. **Automatic Installation**: `pip install -r requirements.txt` runs during deployment
3. **Optimized Packages**: Only essential dependencies included
4. **Runtime Ready**: All packages available when Lambda executes

### Optimized Dependencies
```txt
boto3>=1.34.0          # AWS SDK
PyJWT>=2.8.0           # JWT token handling
pinecone-client>=3.0.0 # Vector database
PyPDF2>=3.0.1          # PDF processing
python-docx>=1.1.0     # DOCX processing
# Coming soon for image processing:
# Pillow>=10.0.0        # Image processing
# pytesseract>=0.3.10   # OCR text extraction
```

### Deployment Package Size
- **Before optimization**: ~150MB
- **After optimization**: ~50MB
- **Cold start improvement**: 2-3 seconds faster

## 🏗️ Infrastructure Components

### AWS Resources Created
- **6 Lambda Functions** (with bundled dependencies)
- **API Gateway** (REST API + WebSocket API with CORS)
- **Cognito User Pool** (authentication)
- **5 DynamoDB Tables** (users, knowledgedbs, documents, images, chat messages)
- **S3 Bucket** (document and image storage)
- **Secrets Manager** (Pinecone + Azure credentials)
- **IAM Roles** (least privilege access)

### Resource Naming Convention
- Bucket: `rag-documents-{account}-{region}`
- Tables: `rag-users`, `rag-knowledgedbs`, `rag-documents`, `rag-images`, `rag-chat-messages`
- Secret: `rag-pinecone-credentials`

## 📚 Complete API Reference

### 🔑 Authentication (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register new user account |
| `POST` | `/auth/login` | Login and receive JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |

### 🔑 Authentication (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/logout` | Invalidate user session |

### 🗂️ KnowledgeDB Management (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/knowledgedbs` | Create new document collection |
| `GET` | `/knowledgedbs` | List all user's collections |
| `DELETE` | `/knowledgedbs/{id}` | Delete collection and all documents |

### 📄 Document Management (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/documents/upload` | Upload and process document |
| `POST` | `/documents/generate` | Generate document using Claude 3 |
| `GET` | `/documents` | List documents (with filtering) |
| `GET` | `/documents/{id}` | Get document details + download URL |
| `DELETE` | `/documents/{id}` | Delete document from all stores |
| `POST` | `/documents/reindex` | Reprocess document embeddings |

### 🔍 Smart Search (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/search` | Natural language search with RAG |

### 🎨 Image Management (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/images/generate` | Generate and store images from text prompts |
| `POST` | `/images/upload` | Upload and process existing images |
| `GET` | `/images` | List all images for user |
| `GET` | `/images/{id}` | Get image metadata and download URL |
| `DELETE` | `/images/{id}` | Delete image from storage |
| `POST` | `/images/reindex` | Regenerate existing image |

### 🏥 Health Check (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health status |

### 💬 WebSocket Chat (Auth Required)
| Event | Description |
|-------|-------------|
| `$connect` | Establish WebSocket connection with JWT token |
| `$disconnect` | Close WebSocket connection |
| `sendMessage` | Send chat message with model/provider selection |
| `load_history` | Retrieve conversation history |
| `clear_conversation` | Clear user's conversation history |

## 💬 WebSocket Chat API

### Connection
```
wss://your-websocket-api-id.execute-api.region.amazonaws.com/prod?token=jwt-token
```

### Chat Actions
```javascript
// Send a message with AWS basic model (default)
{
  "action": "sendMessage",
  "question": "What model are you?",
  "model_id": "basic",
  "provider": "aws"
}

// Send a message with AWS premium model
{
  "action": "sendMessage",
  "question": "Explain quantum computing in detail",
  "model_id": "premium",
  "provider": "aws"
}

// Send a message with Azure provider
{
  "action": "sendMessage",
  "question": "What are machine learning concepts?",
  "model_id": "basic",
  "provider": "azure"
}

// Load conversation history (default: latest 10 messages)
{"action": "load_history"}

// Load latest 20 messages
{"action": "load_history", "start": 0, "end": 20}

// Skip latest 10 messages, get next 10 messages
{"action": "load_history", "start": 10, "end": 20}

// Clear conversation
{"action": "clear_conversation"}
```

### Response Types
```javascript
// Streaming response
{"type": "start", "message": "Processing..."}
{"type": "chunk", "text": "The key points"}
{"type": "end", "message": "Complete"}

// History response with pagination info
{"type": "history", "messages": [...], "has_more": true, "total_count": 150}

// Error response
{"error": "Error message"}
```

### Model Options
- **AWS Models:**
  - **Basic (Claude 3 Haiku)**: $0.38/1000 messages - Fast, cost-effective
  - **Premium (Claude 3.5 Sonnet)**: $4.50/1000 messages - Advanced reasoning

- **Azure Models:**
  - **Basic (GPT-4o Mini)**: $0.54/1000 messages - Multimodal, competitive
  - **Premium (GPT-4o)**: $6.25/1000 messages - Best multimodal capabilities

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl -X GET https://your-api-url/health
```

### 2. WebSocket Chat Test
```bash
# Use the HTML test client
open test/chat_test.html

# Or use the Python test client
cd test
python websocket_chat_test.py
```

### 3. User Registration
```bash
curl -X POST https://your-api-url/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 4. Login
```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 5. Create KnowledgeDB
```bash
curl -X POST https://your-api-url/knowledgedbs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"name":"test-docs","description":"Test document collection"}'
```

### 6. Generate Document
```bash
curl -X POST https://your-api-url/documents/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "Create a technical guide about REST API best practices",
    "knowledgeDbId": "test-docs"
  }'
```

### 7. Search Documents
```bash
curl -X POST https://your-api-url/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"question":"What are the requirements?","knowledge_db":"test-docs","top_k":3}'
```

### 8. Generate Image
```bash
curl -X POST https://your-api-url/images/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{
    "prompt": "A futuristic AI assistant helping with documents",
    "provider": "aws"
  }'
```

### 9. List Images
```bash
curl -X GET https://your-api-url/images \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 10. Get Image Details
```bash
curl -X GET https://your-api-url/images/{IMAGE_ID} \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 11. Delete Image
```bash
curl -X DELETE https://your-api-url/images/{IMAGE_ID} \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 12. Regenerate Image
```bash
curl -X POST https://your-api-url/images/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -d '{"imageId": "{IMAGE_ID}"}'
```

### 13. WebSocket Chat
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://your-ws-api-id.execute-api.region.amazonaws.com/prod?token=jwt-token');

// Send a chat message
ws.send(JSON.stringify({
  action: 'sendMessage',
  question: 'Summarize my documents',
  knowledge_db: 'test-docs'
}));
```

### 14. Upload Document via WebSocket
```javascript
// Convert file to base64
const fileContent = "This is a test document";
const base64Content = btoa(fileContent);

// Send upload request via WebSocket
ws.send(JSON.stringify({
  action: 'upload_document',
  filename: 'test.txt',
  content: base64Content,
  knowledge_db: 'test-docs'
}));
```

### 15. Complete Automated Testing
```bash
cd test
python automated_api_test.py
```

## 🔧 Environment Variables in Production

**Environment variables are automatically injected by CDK into Lambda functions:**
- **Storage**: AWS Lambda service (encrypted)
- **Secrets**: AWS Secrets Manager (Pinecone API key)
- **Configuration**: Set during CDK deployment
- **Access**: Available as `os.environ['VARIABLE_NAME']` in Lambda code
- **Region**: Default set to `us-east-1`

**Re-deployment**: CDK safely updates existing resources without failure

## ⚙️ Optimizations Implemented

### Performance
- **Python 3.11 runtime** for better performance
- **Connection pooling** for Pinecone (singleton pattern)
- **Optimized memory allocation** per Lambda function
- **Concurrent execution limits** to prevent throttling

### Security
- **Secrets Manager** for API key storage
- **IAM least privilege** policies
- **User data isolation** via namespaces and prefixes
- **CORS configuration** for API security

### Cost
- **Pay-per-request DynamoDB** billing
- **Lambda reserved concurrency** to control costs
- **Efficient chunking** to minimize embedding costs

## 🔒 Security & Cost Features

### Security
- **JWT Authentication**: Cognito-based secure tokens
- **User Data Isolation**: S3 prefixes + Pinecone namespaces
- **IAM Least Privilege**: Minimal required permissions
- **Encrypted Storage**: S3 and DynamoDB encryption at rest
- **CORS Configuration**: Proper API security headers

### Cost Optimization
- **Serverless Pay-per-Use**: No idle costs
- **Reserved Concurrency**: Prevents runaway costs
- **Efficient Text Chunking**: Minimizes embedding API calls
- **Connection Pooling**: Reduces initialization overhead

## 🛠️ Project Structure

```
knowledgedb/
├── Lambdas/                    # Lambda function code
│   ├── auth_handler.py         # Authentication (4 endpoints)
│   ├── knowledgedb_handler.py  # KnowledgeDB management (3 endpoints)
│   ├── document_handler.py     # Document processing (5 endpoints)
│   ├── search_handler.py       # RAG search (1 endpoint)
│   ├── chat_handler.py         # WebSocket chat handler
│   ├── image_handler.py        # Image generation and management
│   └── requirements.txt        # Python dependencies
├── infrastructure/             # CDK infrastructure code
│   ├── app.py                 # CDK app entry point
│   ├── rag_document_stack.py  # Complete AWS stack with WebSocket
│   ├── cdk.json              # CDK configuration
│   └── requirements.txt       # CDK dependencies
├── test/                      # Testing utilities
│   ├── websocket_chat_test.py # Python WebSocket test client
│   ├── chat_test.html         # HTML WebSocket test client
│   ├── automated_api_test.py  # Complete API test suite
│   └── API_Testing_Guide.md   # Detailed API testing guide
├── Chat/                      # Chat integration components
│   ├── API_DOCUMENTATION_SIMPLE.md # Simple API docs
│   ├── bedrock-conversation-template.yaml # Bedrock template
│   └── README.md              # Chat-specific documentation
├── deploy.py                  # Automated deployment script
├── CHAT_INTEGRATION_GUIDE.md  # WebSocket chat documentation
└── README.md                  # This file
```

## 🔍 Troubleshooting

### Common Issues

#### Lambda Import Errors
**Problem**: `ModuleNotFoundError` in Lambda logs
**Solution**: Dependencies are now automatically bundled during deployment

#### Pinecone Connection Errors
**Problem**: `Failed to initialize Pinecone`
**Solution**: 
1. Verify API key in Secrets Manager
2. Check Pinecone environment setting
3. Ensure index exists with correct name

#### Bedrock Access Denied
**Problem**: `AccessDeniedException` for Bedrock models
**Solution**: Enable model access in Bedrock console

#### Cold Start Performance
**Problem**: Slow initial responses
**Solution**: 
- Reserved concurrency configured
- Optimized package sizes
- Connection pooling implemented

#### WebSocket Connection Fails
**Problem**: Unable to connect to WebSocket API
**Solution**:
1. Verify JWT token is valid and not expired
2. Check WebSocket URL format
3. Ensure token is passed as query parameter

### Monitoring Commands
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/RagDocument"

# Check API Gateway
aws apigateway get-rest-apis --query 'items[?name==`RAG Document Management API`]'

# Check WebSocket API
aws apigatewayv2 get-apis --query 'Items[?Name==`RAG Chat WebSocket API`]'

# Verify DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `rag-`)]'
```

## 🔄 Updates and Redeployment

### Code Updates
```bash
# Update Lambda code only
cd infrastructure
cdk deploy --hotswap
```

### Full Infrastructure Update
```bash
cd infrastructure
cdk deploy
```

### Rollback
```bash
cd infrastructure
cdk destroy
# Then redeploy previous version
```

## 💰 Cost Estimation

### Monthly Costs (Low Usage)
- **Lambda**: $0-5 (pay per request)
- **API Gateway**: $0-3 (per million requests)
- **DynamoDB**: $0-2 (pay per request)
- **S3**: $0-1 (storage + requests)
- **Cognito**: $0 (up to 50,000 MAU)
- **Secrets Manager**: $0.40 (per secret)
- **Pinecone**: $0 (starter tier)

**Total**: ~$1-12/month for development/testing

### Production Scaling
- Reserved concurrency prevents runaway costs
- DynamoDB auto-scaling available
- S3 lifecycle policies for cost optimization

### Model Cost Comparison
- **AWS Basic (Claude 3 Haiku)**: $0.38/1000 messages
- **AWS Premium (Claude 3.5 Sonnet)**: $4.50/1000 messages
- **Azure Basic (GPT-4o Mini)**: $0.54/1000 messages
- **Azure Premium (GPT-4o)**: $6.25/1000 messages

## 🗑️ Cleanup

```bash
# Remove all AWS resources
cd infrastructure
cdk destroy
```

## 📄 License

MIT License - See LICENSE file for details.