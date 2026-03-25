"""
Data Loader Module: The "Librarian" of the NER System
----------------------------------------------------
This module provides a centralized way to access training data. 

Design Principle: Abstraction.
By using this loader, we ensure that if we ever move our data files or 
change their names, we only have to update this ONE file, and the rest 
of the system (training, evaluation) will still work perfectly.
"""

import importlib  # Used to 'load' Python files as if they were libraries
import sys        # Used to manage Python's internal search paths
from pathlib import Path  # Modern, safe way to handle folder paths


# ---------------------------------------------------------------------------
# [PATH BOOTSTRAP] - Connecting the folders
# ---------------------------------------------------------------------------
# We find the 'ner' folder root so that we can use 'data.original' as a path.
_NER_ROOT = Path(__file__).resolve().parents[1]
if str(_NER_ROOT) not in sys.path:
    sys.path.insert(0, str(_NER_ROOT))

# Security Check: Only allow these two dataset names to prevent errors.
VALID_DATASETS = {"original", "processed"}


# ---------------------------------------------------------------------------
# [CORE LOADER] - Fetching the Annotations
# ---------------------------------------------------------------------------

def load_annotations(dataset: str) -> list:
    """Dynamically imports the ANNOTATIONS list from the data sub-folders.

    Args:
        dataset (str): The name of the folder ('original' or 'processed').

    Returns:
        list: A list of (text, entities) tuples for spaCy training.

    Raises:
        ValueError: If the dataset name is misspelled.
        ModuleNotFoundError: If the actual annotation file is missing.
    """
    # Step 1: Validate the input name
    if dataset not in VALID_DATASETS:
        raise ValueError(
            f"WRONG DATASET: '{dataset}' is not valid. Use 'original' or 'processed'."
        )

    # Step 2: Build the 'Internal Address' of the file.
    # It converts to a format like: 'data.original.sample_annotations'
    module_path = f"data.{dataset}.sample_annotations"

    try:
        # Step 3: Use importlib to 'Open' that file as a Python module
        module = importlib.import_module(module_path)
    except ModuleNotFoundError as exc:
        raise ModuleNotFoundError(
            f"FILE MISSING: We expected a file at model/ner/{module_path.replace('.', '/')}.py"
        ) from exc

    # Step 4: Extract the 'ANNOTATIONS' list from inside that file.
    # getattr() is used because we don't know the file content until we open it.
    annotations = getattr(module, "ANNOTATIONS", None)
    
    # Step 5: Final Health Checks
    if annotations is None:
        raise AttributeError(f"Module '{module_path}' is missing the 'ANNOTATIONS' list.")

    if not annotations:
        raise ValueError(f"The dataset '{dataset}' exists but has zero entries!")

    # Return the data as a standard Python list
    return list(annotations)


# ---------------------------------------------------------------------------
# [UTILITY] - Label Discovery
# ---------------------------------------------------------------------------

def get_label_set(dataset: str) -> set:
    """Scans the entire dataset to find every unique label used.

    Why this is useful: 
    Before training, the model needs to know how many 'buttons' to create 
    (PERSON, SOFTWARE, etc.). This function finds them automatically.

    Args:
        dataset (str): "original" or "processed".

    Returns:
        set: A unique set of strings, e.g., {"PERSON", "SOFTWARE", "DEVICE"}
    """
    # Reuse the loader we wrote above
    annotations = load_annotations(dataset)
    labels = set()

    # Loop through every sentence and every entity to collect the names
    for _, annots in annotations:
        for _start, _end, label in annots.get("entities", []):
            labels.add(label) # Sets automatically ignore duplicates
            
    return labels