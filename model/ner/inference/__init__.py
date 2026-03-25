"""
NER Inference Package: The Public Interface
-------------------------------------------
This __init__.py file acts as the primary access point for the Named Entity 
Recognition (NER) inference tools. 

By importing 'extract_entities' here, we allow other modules (like main.py) 
to use a cleaner, shorter import statement. This is a standard practice 
in Python 'Namespace Management.'

Usage:
    from model.ner.inference import extract_entities
"""

# We import the core function from the local .predict module
# 'noqa: F401' tells linters to ignore that this import is 'unused' locally
from .predict import extract_entities  # noqa: F401

# __all__ defines exactly what is exported when someone uses 'from inference import *'
# This is a security and clarity best-practice in Python development.
__all__ = ["extract_entities"]