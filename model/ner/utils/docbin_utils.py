"""
DocBin Utility Module: The Data Pipeline "Translator"
----------------------------------------------------
This module manages the conversion of raw Python annotations into spaCy's 
optimized DocBin binary format. 

Key Technical Concept:
spaCy does not train directly on text strings. It requires 'Doc' objects 
stored in a 'DocBin' for maximum speed and memory efficiency during 
backpropagation (the learning process).
"""

import warnings  # Used to alert the developer about 'bad' data without crashing the script
from pathlib import Path  # Handles file paths safely across Windows and Linux


# ---------------------------------------------------------------------------
# [INTERNAL HELPER] - The Alignment Guard
# ---------------------------------------------------------------------------

def _validate_span(doc, start: int, end: int, label: str) -> bool:
    """Checks if an entity (like 'Slack') perfectly lines up with a word.

    Why this exists: 
    In spaCy, you cannot label 'half' a word. If your annotation says an 
    entity starts at character 5, but character 5 is in the middle of a 
    word, spaCy will crash. This function catches those 'misaligned' 
    errors before they reach the model.

    Args:
        doc (Doc): The spaCy document object.
        start (int): The starting character index.
        end (int): The ending character index.
        label (str): The label assigned (e.g., 'SOFTWARE').

    Returns:
        bool: True if the word boundaries are perfect, False if they are broken.
    """
    # .char_span() tries to create a 'Link' between character index and word index
    span = doc.char_span(start, end, label=label)
    
    # If the span is None, it means the start/end numbers split a word in half.
    if span is None:
        warnings.warn(
            f"DATA ERROR: Skipping entity '{label}' [{start}:{end}]. "
            "The numbers do not align with full words. Check your annotations!",
            UserWarning,
            stacklevel=3,
        )
        return False
    return True


# ---------------------------------------------------------------------------
# [PUBLIC API] - The tools used by train_ner.py
# ---------------------------------------------------------------------------

def annotations_to_docbin(nlp, annotations: list):
    """Converts a Python list of data into a high-speed DocBin object.

    This function 'packs' your text and labels into a binary container.

    Args:
        nlp (Language): A blank spaCy model used just to read/tokenize the text.
        annotations (list): Your (text, {"entities": [...]}) data from annotations.py.

    Returns:
        DocBin: A binary object ready to be saved as a .spacy file.
    """
    # We import DocBin here (Lazy Import) so the script starts faster
    from spacy.tokens import DocBin 

    db = DocBin()  # Create an empty binary 'container'
    total, skipped = 0, 0

    # Loop through every sentence in your dataset
    for text, annots in annotations:
        doc = nlp.make_doc(text)  # Convert raw text into a spaCy 'Doc' object
        ents = []

        # Loop through every label inside that specific sentence
        for start, end, label in annots.get("entities", []):
            total += 1
            # Step 1: Ensure the label perfectly matches word boundaries
            if not _validate_span(doc, start, end, label):
                skipped += 1
                continue
            
            # Step 2: Create the entity 'Span' (the highlighted part of the text)
            span = doc.char_span(start, end, label=label)
            ents.append(span)

        # Step 3: Attach the valid labels back to the document
        doc.ents = ents
        # Step 4: Add the finished document to our binary container
        db.add(doc)

    # Final summary report for the developer
    if skipped:
        print(f"[Warning] {skipped}/{total} labels were ignored due to alignment issues.")
    else:
        print(f"[Success] All {total} entities converted perfectly.")

    return db


def save_docbin(db, path: str) -> None:
    """Saves the binary container to a .spacy file on your hard drive.

    Args:
        db (DocBin): The binary object created in the previous step.
        path (str): Where to save it (e.g., 'data/train.spacy').
    """
    dest = Path(path)
    # Automatically create folders (like 'data/') if they don't exist yet
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert the object to a file on disk
    db.to_disk(dest)
    print(f"[File System] Binary data saved to: {dest.resolve()}")


def load_docbin(path: str):
    """Reloads a .spacy file back into Python memory.

    Args:
        path (str): The path to the .spacy file.
    """
    from spacy.tokens import DocBin 

    src = Path(path)
    if not src.exists():
        raise FileNotFoundError(f"Missing data file: {src.resolve()}")
    
    # Read the file and turn it back into a DocBin object
    db = DocBin().from_disk(src)
    return db


def split_annotations(annotations: list, train_ratio: float = 0.8) -> tuple:
    """Splits your data into a 'Training Set' and a 'Test Set'.

    This is critical for honest evaluation. We train on 80% and 
    keep 20% 'secret' so we can test if the AI actually learned or just memorized.

    Args:
        annotations (list): The full list of labels.
        train_ratio (float): The percentage to use for training (default 0.8).

    Returns:
        tuple: (train_list, test_list)
    """
    if len(annotations) < 2:
        raise ValueError("Not enough data to perform a split (need at least 2).")

    # Find the 'cut-off' index based on the 80% ratio
    split_idx = max(1, int(len(annotations) * train_ratio))
    
    # Slicing the list: everything before the index is 'train', everything after is 'dev'
    train = annotations[:split_idx]
    dev = annotations[split_idx:]

    print(f"[Split] Data divided: {len(train)} for Training, {len(dev)} for Testing.")
    return train, dev