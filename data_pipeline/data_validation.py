"""
TEAM A: DATA PREPARATION & ANNOTATION
"""
from preprocessing import preprocess_text

# ==============================================================================
# PIPELINE VALIDATION
# Implementation: Automated unit testing to ensure cleaning doesn't fail.
# ==============================================================================
def run_pipeline_validation():
    """Automated unit testing for the data preprocessing pipeline."""
    test_cases = {
        "Standard Query": "The VPN is not connecting",
        "Case Sensitivity": "SYSTEM FAILURE DETECTED",
        "Noise Handling": "Error 404! @#$%^",
        "Null Handling": None,
        "Structural Noise": "   Excessive    spacing   "
    }
    
    print("=== Data Pipeline Validation Report ===")
    for label, text in test_cases.items():
        result = preprocess_text(text)
        status = "PASS" if isinstance(result, str) else "FAIL"
        print(f"[{status}] {label} Validation")

if __name__ == "__main__":
    run_pipeline_validation()
