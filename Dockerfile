FROM python:3.10

WORKDIR /app

COPY requirements.txt .

# upgrade pip before installing
RUN pip install --upgrade pip
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

COPY . .

CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
