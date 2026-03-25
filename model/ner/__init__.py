"""
model/ner/
==========
Named Entity Recognition module for the AI Ticket Creation system.

Technology : spaCy (lightweight, no transformers)
Scope      : Raw text → extracted entity spans (ONLY)
             Not responsible for classification, priority, or ticket generation.

Public API
----------
    from model.ner.inference.predict import predict_entities

Usage
-----
    # Training phase
    python model/ner/training/train_ner.py --dataset original
    python model/ner/training/train_ner.py --dataset processed

    # Inference phase
    from model.ner.inference.predict import predict_entities
    result = predict_entities("Outlook crashes with 0x80070005 on Windows 11")
"""

__version__ = "0.2.0"

# Inference API — available after at least one training run has completed.
# predict_entities is importable directly from model.ner.inference.predict.
