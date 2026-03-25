"""
NER Dataset Validation Utility: The "Pre-Flight Check"
-----------------------------------------------------
This script ensures that the manual annotations created in Milestone 1 
are mathematically and structurally perfect. 

It prevents the most common AI training failures:
1. Out-of-bounds errors (labeling characters that don't exist).
2. Overlapping spans (spaCy cannot handle two labels for the same word).
3. Structural mismatches (missing keys or incorrect data types).
"""

import argparse  # Handles command-line arguments (like --path)
import importlib.util  # Allows us to 'peek' inside another Python file dynamically
import sys  # System-level interactions (exiting if errors are found)


# ---------------------------------------------------------------------------
# [DATA LOADER] - Dynamically importing the annotations
# ---------------------------------------------------------------------------

def load_dataset(path: str):
    """Dynamically imports the 'TRAIN_DATA' variable from a specific file path.
    
    Why use importlib? 
    Because our data files (original/annotations.py) aren't fixed. This utility 
    can check ANY annotation file you point it at.
    """
    # Create a 'blueprint' (spec) of the module we want to load
    spec = importlib.util.spec_from_file_location("dataset_module", path)
    if spec is None:
        print(f"[ERROR] Could not find the file: {path}")
        sys.exit(1)

    # Create the actual module object based on that blueprint
    module = importlib.util.module_from_spec(spec)

    try:
        # Execute the file so the 'TRAIN_DATA' variable becomes available in memory
        spec.loader.exec_module(module)
    except Exception as exc:
        print(f"[ERROR] The annotation file crashed during execution: {exc}")
        sys.exit(1)

    # Check if the variable 'TRAIN_DATA' actually exists in the file
    if not hasattr(module, "TRAIN_DATA"):
        print("[ERROR] No 'TRAIN_DATA' variable found. Did you name it correctly?")
        sys.exit(1)

    return module.TRAIN_DATA


# ---------------------------------------------------------------------------
# [CORE VALIDATOR] - The "Quality Police"
# ---------------------------------------------------------------------------

def check_sample(index: int, text, annotations: dict):
    """Performs 6 levels of inspection on a single data sample.

    Args:
        index (int): The row number in the dataset.
        text (str): The raw text of the ticket.
        annotations (dict): The dictionary containing entity offsets.

    Returns:
        list: A list of found problems. If empty, the sample is 'Gold Standard'.
    """
    problems = []

    # CHECK 1: Text Integrity
    # Text must be a string and it cannot be empty.
    if not isinstance(text, str) or len(text.strip()) == 0:
        problems.append(f"  Sample #{index}: 'text' field is empty or not a string.")
        return problems  # Stop here; we can't check numbers against empty text.

    text_len = len(text)

    # CHECK 2: Dictionary Structure
    # Annotations must be a dictionary and MUST have the 'entities' key.
    if not isinstance(annotations, dict) or "entities" not in annotations:
        problems.append(f"  Sample #{index}: missing the 'entities' dictionary key.")
        return problems

    entities = annotations["entities"]

    # CHECK 3: Data Type Check
    # Entities must be inside a list [ ].
    if not isinstance(entities, list):
        problems.append(f"  Sample #{index}: 'entities' must be a list [ ].")
        return problems

    # CHECK 4: Content Presence
    # If you have text but 0 labels, it's a 'Empty Annotation' (often a mistake).
    if len(entities) == 0:
        problems.append(f"  Sample #{index}: No entities labeled (empty list).")
        return problems

    # CHECK 5: Individual Entity Math (The Start/End logic)
    seen_spans = [] # Used for the overlap check later

    for span_idx, entity in enumerate(entities):
        # Format check: Must be (start, end, label)
        if not (isinstance(entity, (tuple, list)) and len(entity) == 3):
            problems.append(f"  Sample #{index}, Entity #{span_idx}: Format must be (start, end, label).")
            continue

        start, end, label = entity

        # A: Type Check - indices must be integers (not floats or strings)
        if not isinstance(start, int) or not isinstance(end, int):
            problems.append(f"  Sample #{index}: Start/End must be integers, not {type(start).__name__}.")
            continue

        # B: Logic Check - Start cannot be higher than End
        if start >= end:
            problems.append(f"  Sample #{index}: Start ({start}) cannot be after End ({end}).")
            continue

        # C: Boundary Check - Index cannot be negative or higher than text length
        if start < 0 or end > text_len:
            problems.append(f"  Sample #{index}: Span ({start}:{end}) is outside text length ({text_len}).")
            continue

        # D: Label Check - The label (e.g., 'SOFTWARE') must be a string
        if not isinstance(label, str):
            problems.append(f"  Sample #{index}: Label must be a string (e.g., 'SOFTWARE').")
            continue

        seen_spans.append((start, end, span_idx))

    # CHECK 6: Overlap Detection (The most common error)
    # If I label 'Slack' and 'Slack App', the ranges cross. spaCy can't handle this.
    seen_spans.sort(key=lambda s: s[0]) # Sort by start index
    for i in range(len(seen_spans) - 1):
        s1_start, s1_end, s1_idx = seen_spans[i]
        s2_start, s2_end, s2_idx = seen_spans[i + 1]

        # If the start of the next entity is BEFORE the end of the current one, they overlap.
        if s2_start < s1_end:
            problems.append(
                f"  Sample #{index}: OVERLAP FOUND - Entity #{s1_idx} crosses into Entity #{s2_idx}."
            )

    return problems


# ---------------------------------------------------------------------------
# [ORCHESTRATOR] - The Report Generator
# ---------------------------------------------------------------------------

def validate(path: str):
    """Loads the whole dataset and runs the Validator on every single row."""
    print(f"\n{'='*60}")
    print(f"  NER DATASET VALIDATION REPORT")
    print(f"{'='*60}")

    # Load the TRAIN_DATA list
    dataset = load_dataset(path)

    # Basic stats
    total_samples = len(dataset)
    total_entities = 0
    unique_labels = set()
    invalid_records = []

    # Loop through the list and check every row
    for idx, sample in enumerate(dataset):
        # Ensure the row is a valid (text, dict) pair
        if not (isinstance(sample, (tuple, list)) and len(sample) == 2):
            invalid_records.append((idx, [f"  Sample #{idx}: Wrong structure (should be a tuple)."]))
            continue

        text, annotations = sample

        # Pre-count for the summary
        if isinstance(annotations, dict) and isinstance(annotations.get("entities"), list):
            for ent in annotations["entities"]:
                if len(ent) == 3 and isinstance(ent[2], str):
                    total_entities += 1
                    unique_labels.add(ent[2])

        # Run the detailed 6-level check
        problems = check_sample(idx, text, annotations)
        if problems:
            invalid_records.append((idx, problems))

    # PRINT RESULTS
    if invalid_records:
        print(f"\n[ALERT] {len(invalid_records)} records failed validation!\n")
        for sample_idx, problems in invalid_records:
            for msg in problems:
                print(msg)
    else:
        print("\n[PASSED] No structural or logical issues found.")

    # FINAL SUMMARY TABLE
    print(f"\n{'─'*60}")
    print(f"  DATASET SUMMARY")
    print(f"{'─'*60}")
    print(f"  Total Rows     : {total_samples}")
    print(f"  Total Entities : {total_entities}")
    print(f"  Unique Labels  : {len(unique_labels)} ({', '.join(sorted(unique_labels))})")
    print(f"  Error Count    : {len(invalid_records)}")
    print(f"{'─'*60}\n")

    if invalid_records:
        print("RESULT: Fix the errors above before running train_ner.py!\n")
        sys.exit(1) # Signal failure to the terminal
    else:
        print("RESULT: Dataset is healthy and ready for training.\n")
        sys.exit(0) # Signal success


# ---------------------------------------------------------------------------
# [CLI ENTRY POINT]
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validates NER annotations.")
    parser.add_argument("--path", required=True, help="Path to annotations.py")
    args = parser.parse_args()
    validate(args.path)