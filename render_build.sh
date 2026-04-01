#!/usr/bin/env bash
# render_build.sh — Render.com build script for FastAPI backend
# Run from repo root. Installs all deps + downloads spaCy model.
set -e

echo "=== Installing Python dependencies ==="
pip install -r ui/backend/requirements.txt

echo "=== Downloading spaCy English model ==="
python -m spacy download en_core_web_sm

echo "=== Build complete ==="
