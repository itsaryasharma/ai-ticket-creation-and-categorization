"""
SVM Training Pipeline: Production Version (Sync'd with Colab)
------------------------------------------------------------
This script builds the 'Brain' of the classification system. 
It utilizes a Dual-Feature Pipeline:
1. Word-level TF-IDF: Captures semantic meaning (1-2 word sequences).
2. Character-level TF-IDF: Captures spelling patterns and typos (3-5 char sequences).

The model is a LinearSVC wrapped in a CalibratedClassifier to provide 
probability scores (Confidence %) for the final report.
"""

import pandas as pd
import joblib
import sys
from pathlib import Path

# ML Libraries from your Colab
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report

# --- PATH LOGIC ---
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parents[1]
pipeline_path = project_root / "data_pipeline"

if str(pipeline_path) not in sys.path:
    sys.path.insert(0, str(pipeline_path))

try:
    # We MUST use the same preprocessing function used in Colab
    from preprocessing import preprocess_text
except ImportError:
    print(f"ERROR: Could not find preprocessing.py in {pipeline_path}")
    sys.exit(1)

def train_production_model(csv_path):
    print(f"--- Starting Training Pipeline ---")
    
    # 1. LOAD DATA
    df = pd.read_csv(csv_path)
    # We use 'user_input_text' as raw and 'category' as the label
    X = df['user_input_text']
    y = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 2. FEATURE ENGINEERING (The 'FeatureUnion' from your Colab)
    # This combines Word patterns and Character patterns to beat typos.
    word_vectorizer = TfidfVectorizer(
        preprocessor=preprocess_text,
        analyzer="word",
        ngram_range=(1,2),
        max_features=8000,
        min_df=2,
        sublinear_tf=True
    )

    char_vectorizer = TfidfVectorizer(
        preprocessor=preprocess_text,
        analyzer="char_wb", # Word-boundary character n-grams
        ngram_range=(3,5),
        max_features=5000
    )

    combined_features = FeatureUnion([
        ("word_tfidf", word_vectorizer),
        ("char_tfidf", char_vectorizer)
    ])

    # 3. MODEL SELECTION (Calibrated SVM)
    # LinearSVC doesn't have .predict_proba() by default. 
    # CalibratedClassifierCV adds the 'Sigmoid' math needed for confidence scores.
    svm_model = CalibratedClassifierCV(
        LinearSVC(class_weight="balanced", C=1.0),
        method="sigmoid"
    )

    # 4. FULL PIPELINE
    pipeline = Pipeline([
        ("features", combined_features),
        ("clf", svm_model)
    ])

    # 5. TRAINING
    print("Training SVM with FeatureUnion (Word + Char)...")
    pipeline.fit(X_train, y_train)

    # 6. EVALUATION
    y_pred = pipeline.predict(X_test)
    print("\n--- Model Performance Report ---")
    print(classification_report(y_test, y_pred))

    # 7. EXPORT FOR PRODUCTION
    model_filename = "svm_ticket_classifier_v1.pkl"
    joblib.dump(pipeline, current_dir / model_filename)
    print(f" Success! Model saved to: {current_dir / model_filename}")

if __name__ == "__main__":
    # Path to your master dataset
    data_file = project_root / "Master_IT_10k_Final.csv"
    train_production_model(data_file)