import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='notifications', durable=True)

# We will send the email to 'test@example.com' 
# (Ethereal will catch it regardless of the address)
message = {
    "email": "test@example.com",
    "name": "Baissa",
    "property": "Morocco Villa",
    "price": 500
}

channel.basic_publish(
    exchange='',
    routing_key='notifications',
    body=json.dumps(message)
)
print(f" [x] Sent booking for {message['name']}!")
connection.close()