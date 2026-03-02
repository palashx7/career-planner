# Career Planner SaaS - Project Summary for Resume

**Instructions:** Copy and paste the text below into another AI (like ChatGPT or Claude) to help you craft your resume bullets or project section.

---

### Prompt for AI:

Please help me add the following project to my resume. I built a full-stack **Career Planner SaaS** application using modern web technologies and generative AI. Here is a comprehensive technical breakdown of what I built:

#### Tech Stack
*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand (state management), React Hook Form, and Zod (validation).
*   **Backend:** FastAPI (Python), SQLAlchemy (ORM), PostgreSQL.
*   **AI & Integrations:** Google Gemini AI (Generative Language API), SerpApi (Google Search Results for live job scraping), PyPDF2 & `python-docx` for document parsing.
*   **Authentication & Security:** JWT-based authentication (python-jose), bcrypt for password hashing, and OAuth2PasswordBearer.

#### Key Features & Architecture
1.  **Market Intelligence System:** 
    *   Integrates with SerpApi to scrape top 10 live job postings based on the user's targeted role and country.
    *   Feeds scraped job descriptions into Gemini AI to automatically extract and categorize market requirements (technical skills, soft skills, responsibilities).
2.  **Gap Analysis & Custom Learning Plans:**
    *   Allows users to self-assess their skills against the extracted market requirements on a 0-5 scale.
    *   Uses Gemini AI to intelligently analyze the gap between the user's current skills and market demands.
    *   Auto-generates a structured, chronological 6-month progress and learning plan to bridge those gaps.
3.  **AI-Powered Resume Analyzer & Builder:**
    *   Parses user-uploaded resumes (PDF/DOCX) using custom extraction utilities.
    *   Auto-grades the extracted resume content against real-time market requirements to identify missing keywords.
    *   Features an AI rewrite engine that accepts basic bullet points and weaves in the user's verified strengths to create ATS-optimized bullets.
    *   Can completely auto-generate a full, mapped resume based on the user's parsed experience and verified skill profile.
4.  **Admin & User Dashboards:**
    *   Secure, role-based dashboards for users to track their target tasks, view strength profiles, and manage active job goals.

**Goal:** Based on this technical stack and feature set, please help me write 3-4 impactful, quantities-driven resume bullet points that highlight my system design, full-stack engineering, and AI integration skills. Also, provide a short 2-sentence project description I can use in a portfolio.
