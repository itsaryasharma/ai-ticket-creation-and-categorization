"""
TEAM A: DATA PREPARATION & ANNOTATION
Lead: Sameera Shaik | Technical Oversight: Addagada Dinesh
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

