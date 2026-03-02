import io
from PyPDF2 import PdfReader
from docx import Document

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Given raw bytes of an uploaded file, extracts and returns the plain text.
    Supports .pdf and .docx.
    """
    text = ""
    filename_lower = filename.lower()
    
    try:
        if filename_lower.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                 text += page.extract_text() + "\n"
                 
        elif filename_lower.endswith(".docx"):
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                 text += para.text + "\n"
                 
        else:
            raise ValueError("Unsupported file format. Please upload .pdf or .docx.")
            
    except Exception as e:
         print(f"Extraction error: {e}")
         raise ValueError(f"Could not read the file: {e}")
         
    return text.strip()
