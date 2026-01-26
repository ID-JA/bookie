FROM python:3.10-slim

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt   

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

RUN pip install 'pydantic[email]'

COPY ./app /code/app

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]