import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from app.database import get_logs_collection

def send_email_smtp(to_email, subject, body_content):
    # Get credentials
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    sender_email = os.getenv('SMTP_EMAIL')
    sender_password = os.getenv('SMTP_PASSWORD')

    if not all([smtp_server, sender_email, sender_password]):
        print("⚠️ SMTP credentials missing. Skipping email send.")
        return False

    print(f"📧 Sending '{subject}' to {to_email}...")

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body_content, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        print(f"📨 SUCCESS: Email sent!")
        return True
    except Exception as e:
        print(f"❌ EMAIL FAILED: {e}")
        return False

def process_and_send_notification(data: dict):
    email = data.get('email', 'Unknown')
    name = data.get('name', 'Guest')
    msg_type = data.get('type', 'unknown')

    # --- LOGIC FOR THE 4 TYPES ---
    if msg_type == 'reservation':
        subject = "Booking Confirmed! ✅"
        body = f"Hello {name},\n\nYour reservation is confirmed. We look forward to hosting you!"
        
    elif msg_type == 'cancellation':
        subject = "Booking Canceled ❌"
        body = f"Hello {name},\n\nYour reservation has been canceled as requested. We hope to see you another time."
        
    elif msg_type == 'checkout':
        subject = "Thank You for Staying! 🏨"
        body = f"Hello {name},\n\nWe hope you enjoyed your stay. Please leave us a review!"
        
    elif msg_type == 'init':
        subject = "Welcome to Bookie! 👋"
        body = f"Hello {name},\n\nWelcome to our platform. Your account is now active."
        
    else:
        print(f"⚠️ Unknown message type: {msg_type}")
        return False

    # Send the email
    status = "sent"
    success = send_email_smtp(email, subject, body)
    if not success:
        status = "failed"

    # Log to MongoDB
    try:
        logs_collection = get_logs_collection()
        log_entry = {
            "user": email,
            "name": name,
            "status": status,
            "type": msg_type,
            "timestamp": datetime.now(timezone.utc)
        }
        logs_collection.insert_one(log_entry)
        print(f"📝 Log saved for type: {msg_type}")
    except Exception as e:
        print(f"❌ Failed to log to MongoDB: {e}")
    
    return success
