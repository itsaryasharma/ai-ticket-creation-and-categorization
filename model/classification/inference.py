# TEAM B: NLP / ML MODEL DEVELOPMENT
# LEAD: Arya Kumar | EXECUTION: Bhavya Sree Pasumarthi
# FEATURE: Confidence-Based Routing & Automated Audit Logging

"""
Classification Inference Engine: The "Brain" of the System
-----------------------------------------------------------
This module uses a trained Support Vector Machine (SVM) to categorize 
IT helpdesk tickets. It implements 'Confidence-Based Routing,' meaning 
it only auto-assigns a ticket if it is sure of the answer.

Technical Strategy:
1. Probability Scoring: Uses .predict_proba() to get a certainty percentage.
2. Audit Logging: Automatically records 'Low-Confidence' queries for humans.
3. Dependency Injection: Ensures preprocessing functions are in the namespace 
   so the pickled model (.pkl) can 'unfreeze' correctly.
"""
from data_pipeline.preprocessing import preprocess_text
import sys

# Fix for pickle dependency
sys.modules['__main__'].preprocess_text = preprocess_text

import joblib  # Standard library for loading serialized (pickled) ML models
import sys
import os
import numpy as np
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# [PATH BOOTSTRAP] - Connecting the AI to the Data Pipeline
# ---------------------------------------------------------------------------
current_dir = Path(__file__).resolve().parent
# We go up 2 levels: classification -> model -> root folder
project_root = current_dir.parents[1] 
pipeline_path = project_root / "data_pipeline"

# Adding the 'data_pipeline' folder to Python's search path
if str(pipeline_path) not in sys.path:
    sys.path.insert(0, str(pipeline_path))

try:
    # IMPORTANT: The pickled SVM model contains a 'reference' to these functions.
    # If we don't import them here, the model will fail to load (unpickle).
    from preprocessing import preprocess_for_classification, preprocess_text
except ImportError:
    print(f"CRITICAL ERROR: Could not find 'preprocessing.py' in {pipeline_path}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# [MODEL LOADING] - Reheating the trained "Brain"
# ---------------------------------------------------------------------------
model_filename = "svm_ticket_classifier_v1.pkl" 
model_path = current_dir / model_filename

if not model_path.exists():
    print(f"CRITICAL ERROR: SVM Model file (.pkl) missing at {model_path}")
    sys.exit(1)

# Load the model into memory. This includes the TF-IDF Vectorizer + SVM weights.
model = joblib.load(str(model_path))

# ---------------------------------------------------------------------------
# [AUDIT LOGGING] - Human-in-the-Loop (HITL)
# ---------------------------------------------------------------------------

def log_low_confidence(query, score, category):
    """Logs 'confusing' tickets into a file for manual human review.
    
    Why this is professional: 
    No AI is 100% perfect. By saving the 'hard' tickets, we allow IT managers 
    to see where the AI is struggling, which helps in future retraining.
    """
    log_file = current_dir / "manual_review_needed.txt"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Create a human-readable log entry
    log_entry = f"[{timestamp}] Query: {query} | Predicted: {category} | Conf: {score:.2f}\n"
    
    # 'a' means append (add to the end of the file without deleting old logs)
    with open(log_file, "a") as f:
        f.write(log_entry)

# ---------------------------------------------------------------------------
# [PUBLIC API] - The Ticket Routing Logic
# ---------------------------------------------------------------------------

def predict_ticket_with_confidence(text, threshold=0.60):
    """Analyzes text and routes it based on mathematical certainty.

    Args:
        text (str): The user's IT issue.
        threshold (float): The 'Confidence Bar'. If AI score is lower than 
                           this (60%), it asks for human help.

    Returns:
        tuple: (Category Name, Confidence Score, System Status)
    """
    # Safety Check: Don't process empty or invalid text
    if not text or str(text).strip() == "":
        return "Invalid Input", 0.0, "REJECTED"
    
    # STEP 1: PREPROCESS (Tokenization, Lemmatization, Stop-word removal)
    # The AI needs 'clean' text to match the patterns it learned during training.
    cleaned_text = preprocess_for_classification(text)
    
    # STEP 2: CALCULATE PROBABILITIES
    # Instead of just giving one answer, the SVM gives a list of percentages 
    # for every possible category.
    probs = model.predict_proba([cleaned_text])[0]
    
    # STEP 3: PICK THE WINNER
    # np.argmax finds the index of the highest percentage in the list.
    max_prob_idx = np.argmax(probs)
    
    prediction = model.classes_[max_prob_idx] # The Name (e.g., 'Network Issue')
    confidence = probs[max_prob_idx]          # The Certainty (e.g., 0.85)
    
    # STEP 4: ROUTING LOGIC (The "Status" flag)
    # If the AI is sure (>= 60%), we auto-assign. Otherwise, we flag for review.
    if confidence >= threshold:
        status = "AUTO_ASSIGN"
    else:
        status = "MANUAL_REVIEW"
        # Trigger the audit log for low-confidence results
        log_low_confidence(text, confidence, prediction)
    
    return prediction, confidence, status

# ---------------------------------------------------------------------------
# [DEVELOPER TEST BED]
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Test case 1: High confidence (should be Hardware/Device)
    sample = "My MacBook screen is flickering and I cannot see anything."
    cat, conf, stat = predict_ticket_with_confidence(sample)
    
    print("\n" + "-"*40)
    print(f"INPUT: {sample}")
    print(f"PREDICTION: {cat}")
    print(f"CONFIDENCE: {conf:.2%}")
    print(f"STATUS: {stat}")
    print("-"*40 + "\n")