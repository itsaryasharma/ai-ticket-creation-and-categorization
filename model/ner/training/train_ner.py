"""
NER Training Pipeline: The "Factory" for your AI's Eyes
-------------------------------------------------------
This script is the 'Model Factory.' It takes raw text and entity labels, 
converts them into a format the computer understands (DocBin), and 
runs a mathematical optimization loop to 'teach' the model patterns.
"""

import argparse  # Used to handle command-line inputs (like --dataset)
import random    # Used to shuffle data so the model doesn't just memorize the order
import sys       # Used to interact with the system (like adding paths or exiting)
from datetime import datetime  # Used to give each model a unique 'birth certificate' (timestamp)
from pathlib import Path       # The modern way to handle file folders across Windows/Linux

# ---------------------------------------------------------------------------
# [PATH BOOTSTRAP] - Making the folders talk to each other
# ---------------------------------------------------------------------------
# We find the 'ner' folder root so we can import 'data' and 'utils' folders.
# .resolve() gets the absolute path; .parents[1] goes up two levels from this file.
_NER_ROOT = Path(__file__).resolve().parents[1] 

# If this path isn't in Python's 'search list', we add it to the top (index 0).
if str(_NER_ROOT) not in sys.path:
    sys.path.insert(0, str(_NER_ROOT))

import spacy  # The core NLP library
from spacy.training import Example  # A special object that holds (Input Text + Correct Answer)

# These are your custom helper tools located in the model/ner/ folder
from data.loader import load_annotations, get_label_set
from utils.docbin_utils import (
    annotations_to_docbin,
    save_docbin,
    split_annotations,
)

# Define where models are saved and where data lives
MODELS_DIR = _NER_ROOT / "models"
DATA_DIR = _NER_ROOT / "data"

# ---------------------------------------------------------------------------
# [THE TRAINING ENGINE] - Where the learning happens
# ---------------------------------------------------------------------------

def train_ner(
    dataset: str,        # Choice: 'original' or 'processed'
    n_iter: int = 30,    # How many times the AI looks at the whole dataset
    dropout: float = 0.2, # A 'forgetting' factor to prevent the AI from over-memorizing
    train_pct: float = 0.8, # Use 80% for training, 20% for testing
) -> Path:
    """End-to-end function to train, save, and version the NER model."""

    print("=" * 60)
    print(f"  STARTING NER TRAINING | Dataset: {dataset}")
    print("=" * 60)

    # --- STEP 1: LOAD ANNOTATIONS ---
    # We fetch the (Text, Label) pairs you created in the data/ folder.
    print("\n[1/5] Loading annotations ...")
    annotations = load_annotations(dataset)
    labels = get_label_set(dataset) # Finds all unique labels like PERSON, SOFTWARE
    print(f"      Loaded {len(annotations)} total examples.")

    # --- STEP 2: SPLIT DATA ---
    # We hide some data (dev_data) so we can test the AI on things it hasn't seen.
    print("\n[2/5] Splitting data into Train (80%) and Dev (20%) ...")
    train_data, dev_data = split_annotations(annotations, train_ratio=train_pct)

    # --- STEP 3: DOCBIN CONVERSION ---
    # spaCy trains faster if data is in a binary format (.spacy) instead of a list.
    print("\n[3/5] Converting to spaCy DocBin binary format ...")
    nlp_tok = spacy.blank("en") # We use a blank English model just to 'read' the words
    train_db = annotations_to_docbin(nlp_tok, train_data)
    dev_db = annotations_to_docbin(nlp_tok, dev_data)

    # Save these binary files to the disk so we have a record of what we used to train
    dataset_dir = DATA_DIR / dataset
    save_docbin(train_db, str(dataset_dir / "train.spacy"))
    save_docbin(dev_db, str(dataset_dir / "dev.spacy"))

    # --- STEP 4: INITIALIZE PIPELINE ---
    # We start with a 100% blank model. No pre-trained biases.
    print("\n[4/5] Initializing blank 'en' pipeline ...")
    nlp = spacy.blank("en")
    
    # We add an 'NER' component to the empty pipe
    ner = nlp.add_pipe("ner", last=True)

    # We register your custom labels (PERSON, SOFTWARE, etc.) into the model
    for label in sorted(labels):
        ner.add_label(label)

    # --- STEP 5: THE TRAINING LOOP ---
    # This is where the math happens. The model makes a guess, checks the answer, 
    # and adjusts its 'weights' to be more accurate next time.
    print(f"\n[5/5] Executing {n_iter} Training Epochs ...")
    optimizer = nlp.initialize() # Sets up the 'Adjuster' (Stochastic Gradient Descent)
    best_loss = float("inf")     # We want the lowest loss possible

    # Create a unique folder based on the current time (prevents overwriting old models)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    output_dir = MODELS_DIR / dataset / timestamp
    output_dir.mkdir(parents=True, exist_ok=True)

    # We disable other components (if any) to focus 100% on the NER weights
    other_pipes = [pipe for pipe in nlp.pipe_names if pipe != "ner"]
    with nlp.disable_pipes(*other_pipes):
        for iteration in range(1, n_iter + 1):
            random.shuffle(train_data) # Shuffle so the model doesn't learn 'order'
            losses = {}
            batch = []

            # Turn each raw text/label pair into a spaCy 'Example' object
            for text, annots in train_data:
                doc = nlp.make_doc(text) # Tokenize the text
                example = Example.from_dict(doc, annots) # Pair it with the answer
                batch.append(example)

            # nlp.update is the magic line: it performs backpropagation 
            # and updates the neural network's weights.
            nlp.update(batch, sgd=optimizer, drop=dropout, losses=losses)

            current_loss = losses.get("ner", 0.0)
            # If the loss is lower than ever before, we mark it as 'best'
            marker = " ✓ [Best Model Saved]" if current_loss < best_loss else ""
            print(f"  Iteration {iteration:>3} | Loss: {current_loss:.4f}{marker}")

            # Every time the model improves, we save a checkpoint to the disk
            if current_loss < best_loss:
                best_loss = current_loss
                nlp.to_disk(output_dir)

    print(f"\n  FINISH: Model saved to {output_dir.resolve()}")
    return output_dir

# ---------------------------------------------------------------------------
# [EVALUATION] - How good is the AI?
# ---------------------------------------------------------------------------

def evaluate_on_dev(model_dir: Path, dev_data: list) -> None:
    """Tests the newly trained model on the 20% 'Dev' set it has never seen."""
    print("\n[EVALUATION] Checking Accuracy on Dev Set ...")
    
    # Load the model we just saved
    nlp = spacy.load(str(model_dir))
    
    # Create evaluation examples
    examples = [Example.from_dict(nlp.make_doc(t), a) for t, a in dev_data]
    
    # nlp.evaluate calculates Precision, Recall, and F1-Score
    scores = nlp.evaluate(examples)

    # Precision: When the AI found a label, was it correct?
    # Recall: Out of all labels in the text, how many did the AI actually find?
    # F1 Score: The 'Average' of Precision and Recall.
    print(f"  Final Precision : {scores.get('ents_p', 0.0):.4f}")
    print(f"  Final Recall    : {scores.get('ents_r', 0.0):.4f}")
    print(f"  Final F1 Score  : {scores.get('ents_f', 0.0):.4f}")

# ---------------------------------------------------------------------------
# [CLI INTERFACE] - The Terminal Controls
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    """Allows you to run 'python train_ner.py --dataset original' from the terminal."""
    parser = argparse.ArgumentParser(description="NER Training CLI")
    # choices=["original", "processed"] ensures the user doesn't type a typo
    parser.add_argument("--dataset", choices=["original", "processed"], required=True)
    parser.add_argument("--n_iter", type=int, default=30, help="Epochs")
    parser.add_argument("--dropout", type=float, default=0.2, help="Prevention of overfitting")
    parser.add_argument("--train_pct", type=float, default=0.8, help="Split ratio")
    parser.add_argument("--eval", action="store_true", default=True, help="Auto-run evaluation")
    return parser.parse_args()

# This part only runs if you launch the script directly (not if you import it)
if __name__ == "__main__":
    args = parse_args()

    # Step 1: Run the training
    saved_model_dir = train_ner(args.dataset, args.n_iter, args.dropout, args.train_pct)

    # Step 2: Run the evaluation if the --eval flag is True
    if args.eval:
        annotations = load_annotations(args.dataset)
        _, dev_data = split_annotations(annotations, train_ratio=args.train_pct)
        if dev_data:
            evaluate_on_dev(saved_model_dir, dev_data)