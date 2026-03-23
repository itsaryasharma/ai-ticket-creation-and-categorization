import os
import pandas as pd
from preprocessing import preprocess_text

# ==============================================================================
# [START OF THIRUVIKRAMAN S.B] - DATA EXPORT & PREPROCESSING APPLICATION
# Implementation: Applies the cleaning logic and saves the 'Gold' dataset.
# ==============================================================================

def export_cleaned_dataset(df, output_path):
    """Step 2: Preprocessing Application and CSV Export."""
    
    # Create directory if it doesn't exist
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # Apply standardized cleaning logic
    print("Applying text preprocessing...")
    df["cleaned_text"] = df["user_input_text"].apply(preprocess_text)
    
    # Save processed dataset
    df.to_csv(output_path, index=False)
    print(f"Export Complete: Cleaned dataset saved as {output_path}")

# ==============================================================================
# [END OF THIRUVIKRAMAN S.B]
# ==============================================================================