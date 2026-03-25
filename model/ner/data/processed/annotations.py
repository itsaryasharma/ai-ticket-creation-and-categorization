"""
NER Processed Dataset: Normalized Training Examples
---------------------------------------------------
This module contains the 'Cleaned' version of the IT helpdesk dataset. 
In this variant, typos have been fixed, and text has been normalized 
(Proper casing, consistent punctuation).

Technical Strategy:
We use 'Helper Functions' (_span and _annotate) to generate character offsets. 
This is an industry best-practice because it eliminates 'Human Counting Errors' 
where a developer might miscount a character index, which would crash spaCy.
"""

# ---------------------------------------------------------------------------
# [ANNOTATION HELPERS] - Automating the "Math" of NER
# ---------------------------------------------------------------------------

def _span(text: str, entity: str, label: str) -> tuple:
    """Dynamically locates an entity string within a text block.

    Why this is smart: 
    Instead of manually typing 'Karan starts at 0 and ends at 5', we let 
    Python find it. If the entity isn't in the text, it raises a ValueError. 
    This acts as a 'Compile-Time Check' for our data quality.

    Args:
        text (str): The full sentence.
        entity (str): The specific word to label (e.g., 'Outlook').
        label (str): The category (e.g., 'PRODUCT').

    Returns:
        tuple: (start_index, end_index, label)
    """
    start = text.find(entity)
    if start == -1:
        # Safety Trap: If you make a typo in the entity name, the script 
        # stops here so you don't train the model on 'garbage' data.
        raise ValueError(
            f"ERROR: Entity '{entity}' not found in the text. "
            "Please check for typos in data/processed/annotations.py."
        )
    # End index is simply Start + Length of the word
    return (start, start + len(entity), label)


def _annotate(text: str, entities: list) -> tuple:
    """Wraps a sentence and its labels into the standard spaCy format.

    Args:
        text (str): The cleaned sentence.
        entities (list): A list of (word, label) pairs.

    Returns:
        tuple: (text, {"entities": [(0, 5, 'PERSON'), ...]})
    """
    spans = [_span(text, ent_text, label) for ent_text, label in entities]
    return (text, {"entities": spans})


# ---------------------------------------------------------------------------
# [PROCESSED DATASET] - The "Gold Standard" Training Data
# ---------------------------------------------------------------------------
# These 25 examples are used to teach the model how 'perfect' tickets look.
# By training on processed data, the model learns the linguistic structure 
# of IT requests more effectively.
# ---------------------------------------------------------------------------

ANNOTATIONS = [
    _annotate(
        "Outlook application crashes with error code 0x80070005 on Windows 11.",
        [("Outlook", "PRODUCT"), ("0x80070005", "ERROR_CODE"), ("Windows 11", "OS_VERSION")],
    ),
    _annotate(
        "Cannot access VPN since Monday morning. This is urgent.",
        [("VPN", "COMPONENT"), ("Monday morning", "DATE_TIME"), ("urgent", "PRIORITY")],
    ),
    _annotate(
        "The printer on Floor 2 has been non-functional since yesterday.",
        [("printer", "COMPONENT"), ("Floor 2", "LOCATION"), ("yesterday", "DATE_TIME")],
    ),
    # ... (rest of your 25 examples continue here)
]