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
import re
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
    """
    Calculates ticket urgency using a Positional Negation-Aware Hybrid Priority Matrix.
    
    Improvements:
    - Handles multiple occurrences of the same keyword.
    - Uses RegEx to strip punctuation (so 'critical.' is recognized as 'critical').
    - Evaluates the specific context for every high-priority trigger found.
    """
    
    # 1. PRE-PROCESSING: Clean punctuation and split into words
    # This ensures 'critical!' or 'urgent,' matches our keyword list
    clean_text = re.sub(r'[^\w\s]', '', text.lower())
    words = clean_text.split()
    
    # Configuration
    p1_keywords = ["urgent", "blocked", "asap", "down", "crash", "critical"]
    negations = ["not", "no", "never", "isnt", "wasnt", "arent", "neither"]

    # Rule 1: Technical Errors (Hard evidence from NER extraction)
    # If our spaCy model found an 'ERROR' label, it's an automatic P1
    if any(e["label"] == "ERROR" for e in entities): 
        return "P1 - Critical"
    
    # Rule 2: Broad impact categories (SVM prediction)
    # Network issues usually affect multiple users, so they are prioritized
    if "Network" in category: 
        return "P1 - Critical"
    
    # Rule 3: Positional Keyword Check with Negation Handling
    # We loop through every word in the sentence by its index (i)
    for i, word in enumerate(words):
        if word in p1_keywords:
            # Look at the 2 words immediately before THIS specific keyword
            # Example: "system [is] [not] critical" -> idx 3, checks words at 1 and 2
            prev_context = words[max(0, i-2):i]
            
            # If no negation is found in front of this specific keyword, trigger P1
            if not any(neg in prev_context for neg in negations):
                return "P1 - Critical"
            
            # If negated, we don't return. We keep looking for other 
            # non-negated keywords in the rest of the sentence.
    
    # Rule 4: Presence of physical assets (NER)
    # Hardware issues that aren't critical/errors default to Medium
    if any(e["label"] == "DEVICE" for e in entities): 
        return "P2 - Medium"
    
    # Default Rule: Standard requests with no high-signal triggers
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
    query = "The login is not critical, but the server being down is critical."
    
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