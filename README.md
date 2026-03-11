# Career Planner AI 🚀

Career Planner AI is a modern, full-stack, AI-powered platform designed to act as an algorithmic career coach. It analyzes live job market data, audits your skills, generates ATS-optimized resumes, and facilitates mock technical interviews to boost your career readiness.

## 🌟 Live Demo
- **Frontend (Vercel):** [https://career-planner-alpha.vercel.app/](https://career-planner-alpha.vercel.app/)
- **Backend (Render):** [https://career-planner-2.onrender.com](https://career-planner-2.onrender.com) *(API Root)*

## 🛠️ Technology Stack
### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS, Lucide Icons
- **Hosting:** Vercel

### Backend
- **Framework:** Python FastAPI
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** SQLAlchemy with Connection Pooling
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt Hashing
- **Hosting:** Render

### Artificial Intelligence
- **Provider:** Groq (Llama 3.3 70B Versatile)
- **Capabilities:** High-speed structured JSON generation, NLP matching, and resume building
- **Market Data:** SerpApi (Google Jobs scraping)

## ✨ Core Features
1. **Live Market Analyzer:** Scrapes the internet for live job postings based on a query and uses an LLM to extract the exact technical and soft skills required in the current market.
2. **Resume Architect:** Automatically grades uploaded resumes or user profiles against the market data, highlighting missing skills. It can instantly generate an ATS-friendly, tailored resume formatted perfectly.
3. **Mock Interviews:** An interactive chat platform that tests users on the specific technical skills they are missing, providing live feedback and guidance.
4. **Secure User Profiles:** Full JWT-based authentication system with secure password hashing and strict data-ownership parameters.

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL Database (e.g., Neon)
- Groq API Key
- SerpApi Key

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@neon-db-url...
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GROQ_API_KEY=gsk_your_groq_key
SERPAPI_KEY=your_serpapi_key
FRONTEND_URL=http://localhost:3000
```

Run database migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Start the development server:
```bash
npm run dev
```
Open `http://localhost:3000` to view the application.

## 🏗️ Engineering Highlights
* **Serverless Database Resilience:** Configured SQLAlchemy with `pool_pre_ping=True` and connection recycling to gracefully handle the aggressive idle-connection dropping typical of Serverless Postgres providers.
* **Bcrypt Truncation Override:** Implemented a custom 72-byte truncation override constraint in the authentication service to prevent 500 server errors when interacting with heavily randomized passwords from external password managers.
* **Strict Python Virtual Environments:** Maintained a clean, pruned dependency graph with an explicit `.python-version` file to resolve strict `pip` constraints on cloud platform deployments.
