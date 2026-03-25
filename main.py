"""
IT Ticket AI Orchestrator
-------------------------
This module serves as the central engine for the AI-Powered Ticket System.
It integrates Natural Language Processing (NER) and Machine Learning (SVM) 
models with custom business logic to generate structured, traceable IT tickets.

Main Features:
- Unique Ticket ID generation (UUID)
- Hybrid Priority Scoring (AI + Heuristics)
- Entity Noise Reduction (Post-processing)
- Automated Title and Description Mapping
"""

import json
import sys
import uuid
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# 1. PATH BOOTSTRAP & DEPENDENCY RESOLUTION
# ---------------------------------------------------------------------------

# Define project root to ensure internal modules are discoverable
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    # Essential for unpickling the SVM model which references this function
    from data_pipeline.preprocessing import preprocess_text
except ImportError:
    print("CRITICAL ERROR: Could not find 'data_pipeline/preprocessing.py'")
    sys.exit(1)

# Import AI Inference layers
from model.ner.inference.predict import extract_entities
from model.classification.inference import predict_ticket_with_confidence

# ---------------------------------------------------------------------------
# 2. BUSINESS LOGIC ENGINE (The "Manager")
# ---------------------------------------------------------------------------

def clean_entities(entities):
    """Filters out non-technical noise and pronouns from NER results.
    
    Args:
        entities (list): A list of dictionaries containing 'text' and 'label'.
        
    Returns:
        list: A filtered list of high-signal technical entities.
    """
    cleaned = []
    # Pronouns often labeled as entities in technical contexts
    pronouns = {"it", "this", "that", "he", "she", "they", "we"}
    
    for ent in entities:
        text = ent["text"].strip().lower()
        # Remove entities that are too short or serve as general pronouns
        if len(text) <= 2 or text in pronouns:
            continue
        cleaned.append(ent)
    return cleaned

def get_subject(entities):
    """Selects the most relevant technical entity to represent the ticket title.
    
    Heuristic: Prioritizes Software over Devices, and Errors over Persons.
    
    Args:
        entities (list): List of processed entity dictionaries.
        
    Returns:
        str: The text of the primary entity or 'General Issue' as a fallback.
    """
    priority_labels = ["SOFTWARE", "DEVICE", "ERROR", "PERSON"]
    for label in priority_labels:
        for ent in entities:
            if ent["label"] == label:
                return ent["text"]
    return "General Issue"

def determine_priority(text, category, entities):
    """Calculates ticket urgency using a Hybrid Priority Matrix.
    
    The logic weighs hard technical evidence (Errors) and specific sentiment 
    keywords against the AI-predicted category.
    
    Args:
        text (str): The raw user input.
        category (str): The SVM-predicted ticket category.
        entities (list): The list of extracted entities.
        
    Returns:
        str: A priority level string (P1, P2, or P3).
    """
    text_lower = text.lower()
    # Keywords indicating high urgency or work-blocker status
    p1_keywords = ["urgent", "blocked", "asap", "down", "crash", "critical"]

    # Rule 1: Technical Errors trigger immediate escalation
    if any(e["label"] == "ERROR" for e in entities): 
        return "P1 - Critical"
    
    # Rule 2: Explicit urgency keywords in user sentiment
    if any(word in text_lower for word in p1_keywords): 
        return "P1 - Critical"
    
    # Rule 3: Broad impact categories (e.g., Network outages)
    if "Network" in category: 
        return "P1 - Critical"
    
    # Rule 4: Presence of physical assets indicates standard hardware support
    if any(e["label"] == "DEVICE" for e in entities): 
        return "P2 - Medium"
    
    # Default Rule: Standard service requests
    return "P3 - Low"

# ---------------------------------------------------------------------------
# 3. CORE GENERATION ENGINE
# ---------------------------------------------------------------------------

def create_it_ticket(user_input: str):
    """The main pipeline: Transforms raw input into a professional IT ticket.
    
    This function coordinates the NER and SVM models, cleans the output,
    and maps the results to a structured JSON schema.
    
    Args:
        user_input (str): The unstructured text from the user.
        
    Returns:
        dict: A structured ticket object containing headers, body, and metadata.
    """
    # Generate unique traceability identifier (8-character short UUID)
    ticket_id = f"TIC-{str(uuid.uuid4())[:8].upper()}"
    
    # STEP 1: AI Inference Layer (Data Extraction)
    raw_entities = extract_entities(user_input)
    category, confidence, status = predict_ticket_with_confidence(user_input)
    
    # STEP 2: Logic Layer (Refinement & Mapping)
    processed_entities = clean_entities(raw_entities)
    # Defensive programming: Ensure subject extraction doesn't fail on empty lists
    subject = get_subject(processed_entities) if processed_entities else "General Issue"
    priority = determine_priority(user_input, category, processed_entities)
    
    # STEP 3: Serialization (Schema Construction)
    title = f"{category}: Issue involving {subject}"
    
    return {
        "ticket_id": ticket_id,
        "header": {
            "title": title,
            "category": category,
            "priority": priority,
            "status": "OPEN (" + status + ")"
        },
        "body": {
            "description": user_input, # Preserving raw input for agent context
            "ai_extracted_entities": processed_entities
        },
        "metadata": {
            "ai_confidence": round(float(confidence), 2),
            "system": "Hybrid-IT-Support-v3.0",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }

# ---------------------------------------------------------------------------
# 4. EXECUTION ENTRY POINT (Testing & Demonstration)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n" + "="*60)
    print("      AI TICKET GENERATION SYSTEM - PRODUCTION STABLE")
    print("="*60)
    
    # Example production-case input
    query = "Karan is trying to open Slack on his MacBook but gets a 500 error. It is urgent!"
    
    try:
        # Process the input and generate the ticket
        ticket = create_it_ticket(query)
        
        # Output the full structured payload
        print(json.dumps(ticket, indent=4))
        
        # Summary for demonstration purposes
        print("\n" + "-"*60)
        print(f"SUCCESS: Ticket generated at {ticket['metadata']['timestamp']}")
        print(f"USER TRACKING ID: {ticket['ticket_id']}")
        print(f"INITIAL PRIORITY: {ticket['header']['priority']}")
        print("-"*60)
        
        print("\n" + "="*60)
        print("      PROJECT COMPLETE - READY FOR FINAL SUBMISSION")
        print("="*60)
        
    except Exception as e:
        # Global error handling for system-level failures
        print(f"\n[SYSTEM ERROR]: {e}")