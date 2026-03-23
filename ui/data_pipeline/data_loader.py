import pandas as pd
import os
from preprocessing import preprocess_text

def ingest_raw_data(file_path):
    """Step 1: Raw Data Ingestion and Deduplication."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CRITICAL ERROR: Raw data not found at {file_path}.")
        
    df = pd.read_csv(file_path)
    initial_count = len(df)
    
    df = df.drop_duplicates(subset=["user_input_text"])
    print(f"Ingestion Complete: Removed {initial_count - len(df)} duplicate records.")
    
    return df


def export_cleaned_dataset(df, output_path):
    """Step 2: Preprocessing Application and CSV Export."""
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("Applying text preprocessing...")
    df["cleaned_text"] = df["user_input_text"].apply(preprocess_text)

    df.to_csv(output_path, index=False)
    print(f"Export Complete: Cleaned dataset saved as {output_path}")


if __name__ == "__main__":
    current_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(current_dir, '..'))
    
    RAW_DATA_PATH = os.path.join(project_root, "data", "raw", "Master_IT_10k_Final.csv")
    PROCESSED_DATA_PATH = os.path.join(project_root, "data", "processed", "Master_IT_Cleaned.csv")
    
    try:
        raw_df = ingest_raw_data(RAW_DATA_PATH)
        export_cleaned_dataset(raw_df, PROCESSED_DATA_PATH)
    except Exception as e:
        print(f"Pipeline Error: {e}")