"""
NER Sample Dataset: Sync'd with Master_IT_10k_Final.csv
-------------------------------------------------------
This module provides 'Gold Standard' placeholder data for the NER pipeline.
These examples were extracted directly from the project's master dataset 
and have been validated to ensure perfect character-level alignment.

Labels Used:
- PERSON: Extracted from 'user_name' column.
- SOFTWARE: Extracted from 'application' column.
- DEVICE: Extracted from 'device' and 'system' (SRV-XX) columns.
- ERROR: Extracted from 'error_message' column.

Design Concept: 
This file acts as the 'Verification Set' to ensure the SpaCy model correctly 
identifies IT assets and user names from real helpdesk queries.
"""

def _span(text: str, entity: str, label: str) -> tuple:
    """Safely calculates the (start, end, label) tuple for an entity.
    
    If an entity is not found in the text, it raises a ValueError to 
    prevent 'dirty data' from corrupting the training process.
    """
    start = text.find(entity)
    if start == -1:
        raise ValueError(
            f"DATA ERROR: The word '{entity}' was not found in: '{text}'. "
            "Please check the source CSV for text/entity mismatches."
        )
    return (start, start + len(entity), label)


def _annotate(text: str, entities: list) -> tuple:
    """Wraps the text and extracted spans into the SpaCy training format."""
    spans = [_span(text, ent_text, label) for ent_text, label in entities]
    return (text, {"entities": spans})


# ---------------------------------------------------------------------------
# ANNOTATIONS: 25 Validated Examples from Master_IT_10k_Final.csv
# ---------------------------------------------------------------------------
# Each record here represents a real ticket from your project CSV.
# ---------------------------------------------------------------------------

ANNOTATIONS = [
    _annotate("Anita reports: Application crashes when opening in Teams on SRV-22", [("Anita", "PERSON"), ("Teams", "SOFTWARE"), ("SRV-22", "DEVICE")]),
    _annotate("Karan reports: VPN not connecting from home in Excel on SRV-25", [("Karan", "PERSON"), ("Excel", "SOFTWARE"), ("SRV-25", "DEVICE")]),
    _annotate("Priya reports: Email delivery delayed in InternalTool showing 404 error", [("Priya", "PERSON"), ("InternalTool", "SOFTWARE"), ("404 error", "ERROR")]),
    _annotate("Karan reports: Outlook not syncing emails", [("Karan", "PERSON")]),
    _annotate("Anita reports: Software installation failing with error in Chrome", [("Anita", "PERSON"), ("Chrome", "SOFTWARE")]),
    _annotate("Mouse not detected after system restart showing slow performance", [("slow performance", "ERROR")]),
    _annotate("Karan reports: VPN not connecting from home in Teams on SRV-47 showing access denied", [("Karan", "PERSON"), ("Teams", "SOFTWARE"), ("SRV-47", "DEVICE"), ("access denied", "ERROR")]),
    _annotate("Neha reports: LAN connection not working in VPN on SRV-10 showing login failed", [("Neha", "PERSON"), ("VPN", "SOFTWARE"), ("SRV-10", "DEVICE"), ("login failed", "ERROR")]),
    _annotate("Unable to login due to access denied on SRV-58 showing login failed", [("SRV-58", "DEVICE"), ("login failed", "ERROR")]),
    _annotate("Sneha reports: Outlook not syncing emails in SAP on SRV-57 showing connection timeout", [("Sneha", "PERSON"), ("SAP", "SOFTWARE"), ("SRV-57", "DEVICE"), ("connection timeout", "ERROR")]),
    _annotate("Unable to login due to access denied on SRV-15", [("SRV-15", "DEVICE")]),
    _annotate("Sneha reports: Software installation failing with error in VPN", [("Sneha", "PERSON"), ("VPN", "SOFTWARE")]),
    _annotate("Keyboard keys not responding properly in SAP on SRV-14 showing server not reachable", [("SAP", "SOFTWARE"), ("SRV-14", "DEVICE"), ("server not reachable", "ERROR")]),
    _annotate("VPN not connecting from home in Chrome showing server not reachable", [("Chrome", "SOFTWARE"), ("server not reachable", "ERROR")]),
    _annotate("Karan reports: Mouse not detected after system restart in SAP on SRV-24", [("Karan", "PERSON"), ("SAP", "SOFTWARE"), ("SRV-24", "DEVICE")]),
    _annotate("Karan reports: Unable to login due to access denied in Teams on SRV-28", [("Karan", "PERSON"), ("Teams", "SOFTWARE"), ("SRV-28", "DEVICE")]),
    _annotate("Karan reports: Outlook not syncing emails in Outlook showing server not reachable", [("Karan", "PERSON"), ("Outlook", "SOFTWARE"), ("server not reachable", "ERROR")]),
    _annotate("Sneha reports: Software installation failing with error in Outlook showing blue screen", [("Sneha", "PERSON"), ("Outlook", "SOFTWARE"), ("blue screen", "ERROR")]),
    _annotate("Anita reports: VPN not connecting from home on SRV-36", [("Anita", "PERSON"), ("SRV-36", "DEVICE")]),
    _annotate("Karan reports: Unable to login due to access denied in Outlook on SRV-27 showing login failed", [("Karan", "PERSON"), ("Outlook", "SOFTWARE"), ("SRV-27", "DEVICE"), ("login failed", "ERROR")]),
    _annotate("Application crashes when opening on SRV-27 showing login failed", [("SRV-27", "DEVICE"), ("login failed", "ERROR")]),
    _annotate("Rahul reports: Email delivery delayed on SRV-28", [("Rahul", "PERSON"), ("SRV-28", "DEVICE")]),
    _annotate("Amit reports: Internet is very slow today in VPN", [("Amit", "PERSON"), ("VPN", "SOFTWARE")]),
    _annotate("Karan reports: Mouse not detected after system restart in Chrome showing blue screen", [("Karan", "PERSON"), ("Chrome", "SOFTWARE"), ("blue screen", "ERROR")]),
    _annotate("Anita reports: VPN not connecting from home in Excel on SRV-24 showing blue screen", [("Anita", "PERSON"), ("Excel", "SOFTWARE"), ("SRV-24", "DEVICE"), ("blue screen", "ERROR")]),
]