# Backend Setup Guide

## 📋 Prerequisites

- Python 3.12+
- Docker & Docker Compose
- Supabase account
- Google Gemini API key
- Evolution API instance

## 🚀 Quick Start

### 1. Database Setup (Supabase)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/migrations/001_create_tables.sql`
4. Click **Run** to create the tables

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in your credentials in `backend/.env`:

   **Supabase** (from https://app.supabase.com/project/_/settings/api):
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_KEY`: Anon/Public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

   **Database** (from https://app.supabase.com/project/_/settings/database):
   - `DATABASE_URL`: Connection string (use the "Connection string" with password)
   - Format: `postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

   **AI**:
   - `GEMINI_API_KEY`: Get from https://aistudio.google.com/app/apikey
   - `OPENAI_API_KEY`: (Optional) Get from https://platform.openai.com/api-keys

   **Evolution API**:
   - `EVOLUTION_API_URL`: Your Evolution API base URL
   - `EVOLUTION_API_KEY`: Your API key
   - `INSTANCE_NAME`: Your WhatsApp instance name

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Run with Docker (Recommended)

```bash
# From project root
docker-compose up --build
```

The API will be available at: http://localhost:8000

### 5. Run Locally (Development)

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 Testing

### Test the API

```bash
# Health check
curl http://localhost:8000/health

# Admin config
curl http://localhost:8000/api/v1/admin/config
```

### Test Conversation Flow

```bash
python3 backend/verify_flow.py
```

## 📚 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔧 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if your IP is allowed in Supabase (Settings > Database > Connection Pooling)
- Ensure you're using `postgresql+asyncpg://` prefix

### Evolution API Issues
- Verify `EVOLUTION_API_URL` doesn't have trailing slash
- Check `INSTANCE_NAME` matches your Evolution instance
- Test Evolution API separately first

### AI/RAG Issues
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- For RAG, upload documents via Admin Panel first

## 📁 Project Structure

```
backend/
├── core/           # Configuration & database
├── models/         # SQLAlchemy models
├── services/       # Business logic (AI, WhatsApp, RAG)
├── routers/        # API endpoints
├── migrations/     # Database migrations
├── main.py         # FastAPI app entry point
└── requirements.txt
```

## 🔐 Security Notes

- **Never commit `.env` file**
- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend (never expose to frontend)
- Enable RLS (Row Level Security) in Supabase for production
- Use HTTPS for Evolution API webhook in production
