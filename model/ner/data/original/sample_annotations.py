"""
data/processed/sample_annotations.py
======================================
Processed IT helpdesk annotation data — SAMPLE dataset variant.
Synchronized with Master_IT_10k_Final.csv.

This file provides a subset of validated training examples for 
testing the pipeline and performing fast model evaluations.

Entity Labels
-------------
    PERSON     : Individual names (from 'user_name')
    PRODUCT    : Software product names (from 'application')
    COMPONENT  : Hardware or System IDs (from 'device' or 'system')
    ERROR_CODE : Technical error messages (from 'error_message')
"""

def _span(text: str, entity: str, label: str) -> tuple:
    """Locates the character offsets for an entity within the text."""
    start = text.find(entity)
    if start == -1:
        raise ValueError(
            f"Entity '{entity}' not found in text: '{text}'\n"
            "Check the annotation in data/processed/sample_annotations.py."
        )
    return (start, start + len(entity), label)


def _annotate(text: str, entities: list) -> tuple:
    """Formats the text and entity list into a spaCy-compatible tuple."""
    spans = [_span(text, ent_text, label) for ent_text, label in entities]
    return (text, {"entities": spans})


# ---------------------------------------------------------------------------
# SAMPLE DATASET — 25 Validated Records from Master_IT_10k_Final.csv
# ---------------------------------------------------------------------------

ANNOTATIONS = [
    _annotate("Anita reports: Application crashes when opening in Teams on SRV-22", [("Anita", "PERSON"), ("Teams", "PRODUCT"), ("SRV-22", "COMPONENT")]),
    _annotate("Karan reports: VPN not connecting from home in Excel on SRV-25", [("Karan", "PERSON"), ("Excel", "PRODUCT"), ("SRV-25", "COMPONENT")]),
    _annotate("Priya reports: Email delivery delayed in InternalTool showing 404 error", [("Priya", "PERSON"), ("InternalTool", "PRODUCT"), ("404 error", "ERROR_CODE")]),
    _annotate("Karan reports: Outlook not syncing emails", [("Karan", "PERSON")]),
    _annotate("Anita reports: Software installation failing with error in Chrome", [("Anita", "PERSON"), ("Chrome", "PRODUCT")]),
    _annotate("Mouse not detected after system restart showing slow performance", [("slow performance", "ERROR_CODE")]),
    _annotate("Karan reports: VPN not connecting from home in Teams on SRV-47 showing access denied", [("Karan", "PERSON"), ("Teams", "PRODUCT"), ("SRV-47", "COMPONENT"), ("access denied", "ERROR_CODE")]),
    _annotate("Neha reports: LAN connection not working in VPN on SRV-10 showing login failed", [("Neha", "PERSON"), ("VPN", "PRODUCT"), ("SRV-10", "COMPONENT"), ("login failed", "ERROR_CODE")]),
    _annotate("Unable to login due to access denied on SRV-58 showing login failed", [("SRV-58", "COMPONENT"), ("login failed", "ERROR_CODE")]),
    _annotate("Sneha reports: Outlook not syncing emails in SAP on SRV-57 showing connection timeout", [("Sneha", "PERSON"), ("SAP", "PRODUCT"), ("SRV-57", "COMPONENT"), ("connection timeout", "ERROR_CODE")]),
    _annotate("Unable to login due to access denied on SRV-15", [("SRV-15", "COMPONENT")]),
    _annotate("Sneha reports: Software installation failing with error in VPN", [("Sneha", "PERSON"), ("VPN", "PRODUCT")]),
    _annotate("Keyboard keys not responding properly in SAP on SRV-14 showing server not reachable", [("SAP", "PRODUCT"), ("SRV-14", "COMPONENT"), ("server not reachable", "ERROR_CODE")]),
    _annotate("VPN not connecting from home in Chrome showing server not reachable", [("Chrome", "PRODUCT"), ("server not reachable", "ERROR_CODE")]),
    _annotate("Karan reports: Mouse not detected after system restart in SAP on SRV-24", [("Karan", "PERSON"), ("SAP", "PRODUCT"), ("SRV-24", "COMPONENT")]),
    _annotate("Karan reports: Unable to login due to access denied in Teams on SRV-28", [("Karan", "PERSON"), ("Teams", "PRODUCT"), ("SRV-28", "COMPONENT")]),
    _annotate("Karan reports: Outlook not syncing emails in Outlook showing server not reachable", [("Karan", "PERSON"), ("Outlook", "PRODUCT"), ("server not reachable", "ERROR_CODE")]),
    _annotate("Sneha reports: Software installation failing with error in Outlook showing blue screen", [("Sneha", "PERSON"), ("Outlook", "PRODUCT"), ("blue screen", "ERROR_CODE")]),
    _annotate("Anita reports: VPN not connecting from home on SRV-36", [("Anita", "PERSON"), ("SRV-36", "COMPONENT")]),
    _annotate("Karan reports: Unable to login due to access denied in Outlook on SRV-27 showing login failed", [("Karan", "PERSON"), ("Outlook", "PRODUCT"), ("SRV-27", "COMPONENT"), ("login failed", "ERROR_CODE")]),
    _annotate("Application crashes when opening on SRV-27 showing login failed", [("SRV-27", "COMPONENT"), ("login failed", "ERROR_CODE")]),
    _annotate("Rahul reports: Email delivery delayed on SRV-28", [("Rahul", "PERSON"), ("SRV-28", "COMPONENT")]),
    _annotate("Amit reports: Internet is very slow today in VPN", [("Amit", "PERSON"), ("VPN", "PRODUCT")]),
    _annotate("Karan reports: Mouse not detected after system restart in Chrome showing blue screen", [("Karan", "PERSON"), ("Chrome", "PRODUCT"), ("blue screen", "ERROR_CODE")]),
    _annotate("Anita reports: VPN not connecting from home in Excel on SRV-24 showing blue screen", [("Anita", "PERSON"), ("Excel", "PRODUCT"), ("SRV-24", "COMPONENT"), ("blue screen", "ERROR_CODE")]),
]