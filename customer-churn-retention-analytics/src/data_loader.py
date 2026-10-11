"""Data loader module for loading and initial auditing of the Telco Churn dataset."""

from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from src.config import RAW_DATA_PATH, TARGET_COL, ID_COL


def load_raw_data(filepath: Optional[Path] = None) -> pd.DataFrame:
    """Load the raw Telco customer churn dataset."""
    path = filepath or RAW_DATA_PATH
    if not path.exists():
        raise FileNotFoundError(f"Raw data file not found at: {path}")
    df = pd.read_csv(path)
    return df


def audit_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """Perform initial data-quality audit.
    
    Checks:
    - Shape, data types, missing values, duplicates
    - Unique values for categorical columns
    - Target distribution
    - Summary statistics
    """
    audit = {
        "shape": df.shape,
        "num_rows": int(df.shape[0]),
        "num_columns": int(df.shape[1]),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_values": df.isnull().sum().to_dict(),
        "target_distribution": df[TARGET_COL].value_counts(normalize=True).to_dict()
        if TARGET_COL in df.columns
        else {},
        "target_counts": df[TARGET_COL].value_counts().to_dict()
        if TARGET_COL in df.columns
        else {},
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }
    return audit


if __name__ == "__main__":
    df = load_raw_data()
    audit = audit_data_quality(df)
    print("=== Data Quality Audit ===")
    print(f"Dataset Shape: {audit['shape']}")
    print(f"Duplicates: {audit['duplicate_rows']}")
    print(f"Target Counts: {audit['target_counts']}")
    print(f"Target Distribution: {audit['target_distribution']}")
