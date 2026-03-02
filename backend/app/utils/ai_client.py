import json
from groq import Groq
from serpapi import GoogleSearch
from app.config import settings
from typing import List, Dict
from app.utils.logger import logger

# Configure Groq
client = Groq(api_key=settings.GROQ_API_KEY)

# We will use Groq's fast Llama 3 model
GROQ_MODEL = "llama-3.3-70b-versatile"

def fetch_job_postings(role: str, country: str, limit: int = 10) -> str:
    """
    Uses SerpApi to search the Google Jobs board for the specified role.
    Returns a consolidated text block of the job snippets/descriptions.
    """
    params = {
      "engine": "google_jobs",
      "q": f"{role} in {country}",
      "hl": "en",
      "api_key": settings.SERPAPI_KEY
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        jobs = results.get("jobs_results", [])
        
        # Take up to the limit
        jobs = jobs[:limit]
        
        consolidated_text = ""
        for i, job in enumerate(jobs):
            consolidated_text += f"---\nJob {i+1}: {job.get('title')} at {job.get('company_name')}\n"
            consolidated_text += f"Description: {job.get('description', 'No description provided')}\n"
            
        return consolidated_text
        
    except Exception as e:
        logger.error("Error fetching jobs from SerpApi", error=str(e), role=role, country=country)
        # Fallback raw prompt if SerpApi fails or key is invalid
        return f"Fallback: The user is looking for {role} roles in {country}. Assume standard industry requirements for this role."


def extract_market_requirements(job_descriptions: str) -> List[Dict]:
    """
    Feeds the scraped job descriptions into Gemini and enforces a strict JSON array output
    categorizing the skills into technical, soft_skill, and responsibility.
    """
    prompt = f"""
    You are an expert technical recruiter analyzing live job postings for a candidate.
    I will provide you with several job descriptions.
    
    Your goal is to extract the core requirements and categorize them strictly into ONE of these three categories:
    1. "technical" (e.g., Python, AWS, React, SQL)
    2. "soft_skill" (e.g., Communication, Leadership, Agile)
    3. "responsibility" (e.g., System Architecture, Leading Scrums, Code Reviews)
    
    Return EXACTLY a raw JSON object containing a single key called "requirements". Do not include markdown formatting like ```json.
    The "requirements" key must contain an array of objects.
    Each object must have exactly these keys:
    - "name": string (the skill or responsibility name)
    - "category": string (must be exactly "technical", "soft_skill", or "responsibility")
    - "description": string (why this is needed based on the postings, keep it to 1 sentence)
    
    Ensure you return a comprehensive list covering the most important unique points (around 10-15 total items).
    
    Job Descriptions:
    {job_descriptions}
    """
    
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content.strip()
        
        # Guard against markdown code blocks if the model ignores the instruction
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        if isinstance(data, dict):
            # Groq JSON mode requires a root object, we asked for "requirements"
            for key in ["requirements", "market_requirements", "data"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
                    
        raise ValueError(f"AI did not return a valid dictionary with a requirements array. Got: {text[:100]}")
            
    except Exception as e:
        logger.error("Error during Gemini requirement extraction", error=str(e), exc_info=True)
        # Return empty list letting our services know the AI failed
        return []

def generate_custom_plan(gap_assessments: List[Dict], strengths_summary: str, role: str) -> List[Dict]:
    """
    Feeds the user's weak points into Gemini to algorithmically design a 6-month roadmap.
    """
    prompt = f"""
    You are an elite career coach helping a candidate transition into a {role} role.
    
    The candidate has existing strengths: {strengths_summary}.
    However, they have critical gaps in the following areas:
    {json.dumps(gap_assessments, indent=2)}
    
    Create a highly structured 6-month progression plan to eliminate these gaps and make them hire-ready.
    
    Return EXACTLY a raw JSON object containing a single key called "tasks". Do not include markdown formatting like ```json.
    The "tasks" key must contain an array of objects, where each object maps to a task they need to do.
    Each task object must have exactly these keys:
    - "title": string (Actionable task title)
    - "description": string (Detailed instruction on how to execute this task)
    - "month_target": integer (1 to 6, indicating which month this task belongs to)
    - "week_target": integer (1 to 4, optional, indicating week. If not applicable, use 0)
    - "task_type": string (must be exactly "learning", "project", or "certification")
    
    Ensure there is a logical progression (e.g., Month 1 is learning basics of the gaps, Month 3 is small projects, Month 6 is advanced capstone). Provide around 10-12 total tasks spread across the 6 months.
    """
    
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        if isinstance(data, dict):
             for key in ["tasks", "plan", "roadmap"]:
                 if key in data and isinstance(data[key], list):
                     return data[key]
                     
        raise ValueError(f"AI did not return a valid dictionary with a tasks array. Got: {text[:100]}")
            
    except Exception as e:
        logger.error("Error during Gemini plan generation", error=str(e), exc_info=True)
        return []

def evaluate_resume_skills(resume_text: str, market_requirements: List[Dict]) -> List[Dict]:
    """
    Feeds a user's raw resume into Gemini and asks it to objectively grade them 0-5
    on the currently active Market Requirements for their role.
    """
    prompt = f"""
    You are an expert technical recruiter and resume reviewer.
    I will provide you with a candidate's Resume Text and a list of specific Market Requirements needed for a role.
    
    Your job is to read their resume and rate their proficiency for EACH requirement on a scale of 0 to 5.
    0 = No evidence of this skill whatsoever.
    5 = World-class expert / extensive verifiable experience.
    
    You must also provide a 1-sentence reason justifying your rating based strictly on the resume text.
    
    Return EXACTLY a raw JSON object containing a single key called "evaluations". Do not include markdown formatting like ```json.
    The "evaluations" key must contain an array of objects.
    Each object must have exactly these keys:
    - "requirement_id": integer (must perfectly match the ID from the requirements list provided)
    - "rating": integer (0, 1, 2, 3, 4, or 5)
    - "reason": string (1-sentence justification)
    
    Market Requirements List:
    {json.dumps(market_requirements, indent=2)}
    
    Candidate Resume Text:
    {resume_text}
    """
    
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        data = json.loads(text)
        if isinstance(data, dict):
            for key in ["evaluations", "results", "grades"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
                    
        raise ValueError(f"AI did not return a valid dictionary with an evaluations array. Got: {text[:100]}")
            
    except Exception as e:
        logger.error("Error during Gemini resume evaluation", error=str(e), exc_info=True)
        return []

def optimize_resume_bullet(bullet_point: str, strengths: List[str]) -> str:
    """
    Feeds a candidate's basic resume bullet, plus their proven strengths, into Gemini
    to rewrite it into a highly optimized, ATS-friendly achievement format.
    """
    prompt = f"""
    You are an elite career coach and resume writer. 
    A candidate has provided a basic bullet point from their resume.
    
    Basic Bullet: "{bullet_point}"
    
    The candidate has the following proven strengths demanded by the job market:
    {", ".join(strengths) if strengths else "None explicitly listed. Assume general best-practices."}
    
    Your Task: Rewrite this bullet point to be ATS-optimized. 
    1. Start with a strong action verb (e.g., Architected, Spearheaded, Engineered).
    2. Focus on metrics / impact if they exist, or structure it as "Accomplished [X] by doing [Y] resulting in [Z]".
    3. Weave in 1-2 of their matching strengths natively into the sentence, but keep it sounding natural.
    
    Return ONLY the rewritten bullet point string. Do not include quotes, lists, or markdown formatting. Just the raw, single-sentence string.
    """
    
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Clean quotes
        return response.choices[0].message.content.strip().strip('"').strip("'")
            
    except Exception as e:
        logger.error("Error during Gemini resume rewrite", error=str(e))
        return bullet_point # Fallback to original


def generate_full_resume(role: str, user_name: str, strengths: List[str], base_text: str = "") -> Dict:
    """
    Auto-generates an entire, structured resume customized to the user's target role and proven strengths.
    If base_text is provided, uses it as context. If not, generates a highly plausible mock resume.
    """
    prompt = f"""
    You are an elite ATS resume writer building a modern tech resume.
    Candidate Name: {user_name}
    Target Role: {role}
    Verified Strengths to Highlight: {", ".join(strengths) if strengths else "None explicitly listed. Assume general best-practices."}
    Base Resume Text Background:
    {base_text if base_text else "No background provided. Generate highly plausible mock experience tailored for standard industry expectations."}
    
    Task: Output EXACTLY a valid JSON object representing a full resume. Do not use markdown like ```json.
    
    Strict JSON Format Required:
    {{
      "name": "Candidate Name",
      "contact": "City, Country | email@example.com | linkedin.com/in/profile",
      "experience": [
        {{
           "title": "Job Title",
           "date": "Jan 2022 - Present",
           "company": "Company Name",
           "bullets": [
             "Action verb metric-driven bullet 1.",
             "Action verb metric-driven bullet 2."
           ]
        }}
      ],
      "projects": [
        {{
           "title": "Project Name",
           "date": "2023",
           "bullets": [
             "Technical achievement bullet 1.",
             "Technical achievement bullet 2."
           ]
        }}
      ],
      "education": [
        {{
           "degree": "B.S. Computer Science",
           "date": "May 2024",
           "school": "University Name"
        }}
      ]
    }}
    
    Make the experience and projects extremely impressive, explicitly weaving in the Verified Strengths.
    Return ONLY JSON.
    """
    
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text)
            
    except Exception as e:
        logger.error("Error during Full Resume Generation", error=str(e), user_name=user_name, role=role, exc_info=True)
        # Return fallback structure
        return {
           "name": user_name,
           "contact": "City, Country | email@example.com",
           "experience": [],
           "projects": [],
           "education": []
        }

def generate_interview_response(role: str, gaps: List[str], history: List[Dict[str, str]], new_message: str) -> str:
    """
    Acts as a hiring manager explicitly testing the user on their identified weak points (gaps).
    Maintains stateless history by passing the conversation back to Gemini.
    """
    system_prompt = f"""
    You are a Senior Technical Hiring Manager interviewing a candidate for a {role} position.
    
    The candidate has identified the following areas as their WEAKNESSES (Skill Gaps):
    {", ".join(gaps) if gaps else "None specifically identified. Ask standard rigorous interview questions."}
    
    Your goal is to conduct a realistic, challenging, but ultimately constructive mock interview. 
    You should start by asking questions that test their knowledge on these specific weaknesses to help them practice.
    
    CRITICAL RULES:
    1. If the candidate explicitly says they DO NOT KNOW the answer, or asks for help, DO NOT keep asking them the same question or drilling down further into that specific topic. 
    2. Instead, briefly and kindly explain the concept to them (teach them), and then pivot to a DIFFERENT interview question or a different weakness.
    3. Do NOT break character as a hiring manager. Do not say "I am an AI". Act like a real, slightly demanding but fair and mentoring hiring manager.
    4. Keep your responses relatively concise (1-2 short paragraphs maximum). Ask one question at a time.
    """
    
    try:
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Pass conversation history accurately
        for msg in history:
            role = "assistant" if msg["role"] == "ai" else "user"
            messages.append({"role": role, "content": msg["text"]})
            
        messages.append({"role": "user", "content": new_message})

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages
        )
        
        return response.choices[0].message.content.strip()
            
    except Exception as e:
        logger.error("Error during Interview Generation", error=str(e), role=role, new_message=new_message)
        return "I'm sorry, we seem to be having connection issues. Could you repeat your last point?"
