"""
NER Inference Engine: The "Eyes" of the System
----------------------------------------------
This module handles the extraction of Named Entities (PERSON, SOFTWARE, DEVICE, 
ERROR) from raw user input. It utilizes a 'Hybrid NER' architecture, combining 
statistical Deep Learning (spaCy) with deterministic rules (Entity Ruler).

Technical Highlights:
1. Lazy Loading: The heavy model is only loaded into RAM when first requested.
2. Hybrid Supervisor: An Entity Ruler acts as a safety net for critical keywords.
3. Post-Filtering: Heuristic logic removes punctuation noise and hallucinations.
"""

import sys
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# [PATH BOOTSTRAP] - Multi-environment Compatibility
# ---------------------------------------------------------------------------
# We go up 3 levels to find the project root from model/ner/inference/
PROJECT_ROOT = Path(__file__).resolve().parents[3] 
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import spacy
from data_pipeline.preprocessing import preprocess_for_ner

# Path logic to locate the best-performing trained model
_NER_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = _NER_ROOT / "models" / "model-best"

# ---------------------------------------------------------------------------
# [MODEL MANAGEMENT] - Optimized Loading
# ---------------------------------------------------------------------------

# Global cache to prevent the system from reloading the model for every ticket
_NLP = None

def _load_model():
    """Internal helper to perform 'Lazy Loading' of the spaCy model.
    
    This function also injects a 'Hybrid Supervisor' (Entity Ruler). Statistical 
    models sometimes miss specific tools like 'Slack' or 'MacBook' if the context 
    is unusual; the Ruler ensures 100% recall for these high-priority terms.

    Returns:
        spacy.Language: The fully configured NLP pipeline.
    """
    global _NLP
    if _NLP is not None:
        return _NLP

    print(f"[NER] Loading inference model from: {MODEL_PATH}")
    try:
        # Load the core statistical model weights
        _NLP = spacy.load(str(MODEL_PATH))
        
        # --- HYBRID SUPERVISOR LOGIC ---
        # We add an 'Entity Ruler' to the end of the pipe. 
        # overwrite_ents=True allows the rules to fix statistical mistakes.
        if "entity_ruler" not in _NLP.pipe_names:
            ruler = _NLP.add_pipe("entity_ruler", after="ner", config={"overwrite_ents": True})
            
            # These patterns act as a 'Hardcoded Brain' for 100% accuracy on specific tools
            patterns = [
                {"label": "ERROR", "pattern": [{"IS_DIGIT": True}, {"LOWER": "error"}]},
                {"label": "DEVICE", "pattern": [{"LOWER": "macbook"}]},
                {"label": "DEVICE", "pattern": [{"LOWER": "laptop"}]},
                {"label": "SOFTWARE", "pattern": [{"LOWER": "slack"}]},
                {"label": "SOFTWARE", "pattern": [{"LOWER": "teams"}]}
            ]
            ruler.add_patterns(patterns)
            
        return _NLP
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize NER model. Error: {e}")
        return None

# ---------------------------------------------------------------------------
# [POST-PROCESSING] - Noise Reduction
# ---------------------------------------------------------------------------

def clean_entities(entities):
    """Refines raw AI output by removing punctuation and trivial noise.
    
    Args:
        entities (list): List of dictionaries containing extracted labels.
        
    Returns:
        list: A polished list of technical entities.
    """
    cleaned = []
    # Set of punctuation marks that the model sometimes misidentifies as 'SYSTEM_ID'
    noise = {".", ",", "!", "?", "-", "_", "(", ")"}
    
    for ent in entities:
        text = ent["text"].strip()
        
        # FILTER 1: Skip empty strings or standalone punctuation
        if not text or text in noise:
            continue
            
        # FILTER 2: Skip single-character artifacts (e.g. 'a', 'x') 
        # but KEEP single digits (e.g. error code '1')
        if len(text) <= 1 and not text.isdigit():
            continue
            
        cleaned.append(ent)
    return cleaned

# ---------------------------------------------------------------------------
# [PUBLIC API] - The Primary Interface
# ---------------------------------------------------------------------------

def extract_entities(text: str):
    """The main entry point for entity extraction.
    
    Process: 
    1. Preprocess text (Preserving character offsets) 
    2. Statistical Inference 
    3. Hybrid Rule correction 
    4. Post-filter cleaning.

    Args:
        text (str): The raw ticket text from the user.
        
    Returns:
        list: Structured list of entities with character start/end positions.
    """
    nlp = _load_model()
    if not nlp or not text:
        return []

    # Apply specialized NER preprocessing (e.g., handling double spaces)
    cleaned_text = preprocess_for_ner(text)
    
    # Perform Inference
    doc = nlp(cleaned_text)
    
    # Map spaCy objects to a serializable Python list
    raw_entities = [
        {
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char
        }
        for ent in doc.ents
    ]
    
    # Return cleaned results (removes 'It', periods, etc.)
    return clean_entities(raw_entities)

# ---------------------------------------------------------------------------
# [DEVELOPER SANDBOX]
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Rapid testing string
    sample = "Karan is trying to open Slack on his MacBook but gets a 500 error."
    print(f"\n--- Testing NER Pipeline ---")
    print(f"Results: {extract_entities(sample)}")