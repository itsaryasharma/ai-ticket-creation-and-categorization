"""
TEAM A: DATA PREPARATION & ANNOTATION
Members: Sathya Sree K | Thiruvikraman S.B
"""

import pandas as pd
import os
from preprocessing import preprocess_text

# ==============================================================================
# [START OF SATHYA SREE K] - DATA INGESTION & DEDUPLICATION
# Implementation: Handles raw CSV loading and removes duplicate user inputs.
# ==============================================================================
def ingest_raw_data(file_path):
    """Step 1: Raw Data Ingestion and Deduplication."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CRITICAL ERROR: Raw data not found at {file_path}.")
        
    df = pd.read_csv(file_path)
    initial_count = len(df)
    
    # Remove duplicates to prevent data leakage and model overfitting
    df = df.drop_duplicates(subset=["user_input_text"])
    print(f"Ingestion Complete: Removed {initial_count - len(df)} duplicate records.")
    
    return df
# ==============================================================================
# [END OF SATHYA SREE K]
# ==============================================================================