"""
TEAM A: DATA PREPARATION & ANNOTATION
Lead:  Technical Oversight: Addagada Dinesh
"""

import re

# ==============================================================================
# [START OF ADDAGADA DINESH] - CLASSIFICATION PREPROCESSING
# Implementation: Aggressive cleaning (lower, no-punct) for Intent/Priority.
# ==============================================================================
def preprocess_for_classification(text: str) -> str:
    """Standardized cleaning for Category and Priority models."""
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    
    return text
# ==============================================================================
# [END OF ADDAGADA DINESH]
# ==============================================================================

# ==============================================================================
#  NER PREPROCESSING
# Implementation: Offset-preserving cleaning (keeps casing/hyphens).
# ==============================================================================
def preprocess_for_ner(text: str) -> str:
    """Specialized cleaning for Named Entity Recognition."""
    if not isinstance(text, str) or not text:
        return ""

    # Preserve casing and punctuation for entity offsets (e.g., SYSTEM_ID like SRV-22) [cite: 268, 1453]
    # Blank 'en' tokenizer requirement: Preserve text as-is [cite: 1454, 1668]
    text = re.sub(r"\s+", " ", text)
    
    return text.strip()
# ==============================================================================
# 
# ==============================================================================

preprocess_text = preprocess_for_classification

