FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY revela_risk_model.json .

ENV MODEL_PATH=revela_risk_model.json

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
