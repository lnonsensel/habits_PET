FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.core.fastapi:app --host 0.0.0.0 --port 3000"]
