import asyncio
import sys
import os

# Set up path to load app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.utils.ai_client import extract_market_requirements

def main():
    job_desc = "Testing: Looking for a senior software engineer who knows python, communication, and AWS."
    print("Testing extraction...")
    res = extract_market_requirements(job_desc)
    print("Result:", res)

if __name__ == "__main__":
    main()
