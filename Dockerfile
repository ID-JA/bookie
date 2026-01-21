# Use a lightweight Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application (including the 'bookie' folder)
COPY . .

# DEBUGGING: List all files in the current folder
# Change 'notifications.py' to 'notification.py'
CMD ["python", "-u", "notification.py"]