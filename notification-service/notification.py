import os
import pika
import json
import certifi
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pymongo import MongoClient
from datetime import datetime, timezone

# 1. SETUP MONGODB
MONGO_URI = os.getenv('MONGO_URI')

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.get_database()
    logs_collection = db['email_logs']
    print(f"✅ Connected to MongoDB Atlas: {db.name}")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    sys.exit(1)

# 2. EMAIL SENDING FUNCTION
def send_email(to_email, subject, body_content):
    # Get credentials
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    sender_email = os.getenv('SMTP_EMAIL')
    sender_password = os.getenv('SMTP_PASSWORD')

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

# 3. MESSAGE PROCESSOR (The Brain)
def process_notification(data):
    email = data.get('email', 'Unknown')
    name = data.get('name', 'Guest')
    msg_type = data.get('type', 'unknown') # reservation, cancellation, checkout, init

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
        return # Skip sending if type is wrong

    # Send the email
    status = "sent"
    if not send_email(email, subject, body):
        status = "failed"

    # Log to MongoDB
    log_entry = {
        "user": email,
        "name": name,
        "status": status,
        "type": msg_type,
        "timestamp": datetime.now(timezone.utc)
    }
    logs_collection.insert_one(log_entry)
    print(f"📝 Log saved for type: {msg_type}")

# 4. RABBITMQ CONSUMER
def start_service():
    amqp_host = os.getenv('RABBITMQ_HOST', 'rabbitmq')
    queue_name = 'notifications'

    print(f" [*] Connecting to RabbitMQ at: {amqp_host}...")
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=amqp_host))
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)
    print(f" [*] Waiting for messages...")

    def callback(ch, method, properties, body):
        try:
            data = json.loads(body)
            process_notification(data)
        except Exception as e:
            print(f"Error processing message: {e}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    channel.start_consuming()

if __name__ == '__main__':
    try:
        start_service()
    except KeyboardInterrupt:
        sys.exit(0)