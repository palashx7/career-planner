import smtplib
from email.message import EmailMessage
from typing import Optional

from app.config import settings

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Sends an OTP code to the provided email address using SMTP.
    Returns True if successful, False otherwise.
    """
    msg = EmailMessage()
    msg.set_content(f"Your OTP for Career Planner is: {otp_code}\nThis code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.")

    msg["Subject"] = "Career Planner - Verification Code"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email

    try:
        # Establish a secure session with gmail's outgoing SMTP server using your account
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
