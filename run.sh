#!/bin/bash
echo "Setting up environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r backend/requirements.txt

echo "Starting Music Player Server..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
