"""Preprocessing module for data cleaning, type conversion, and stratified train/test split."""

from typing import Tuple, Dict, Any
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from src.config import (
    RAW_DATA_PATH,
    PROCESSED_DATA_PATH,
    TARGET_COL,
    ID_COL,
    RANDOM_STATE,
)


def clean_raw_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean raw Telco dataset:
    
    1. Strip whitespace from string columns.
    2. Convert TotalCharges to float; 11 records with tenure=0 have empty strings ' '.
       We impute TotalCharges=0.0 for tenure=0 customers.
    3. Convert Churn binary target: 'Yes' -> 1, 'No' -> 0.
    4. SeniorCitizen: convert 0/1 to 'No'/'Yes' for uniform categorical handling.
    """
    df_clean = df.copy()

    # Convert TotalCharges to numeric
    df_clean["TotalCharges"] = pd.to_numeric(df_clean["TotalCharges"].astype(str).str.strip(), errors="coerce")
    
    # Where tenure == 0 and TotalCharges is NaN, fill with 0.0
    df_clean["TotalCharges"] = df_clean["TotalCharges"].fillna(0.0)

    # Convert target if present
    if TARGET_COL in df_clean.columns:
        if df_clean[TARGET_COL].dtype == object or df_clean[TARGET_COL].dtype.name == "category":
            df_clean[TARGET_COL] = df_clean[TARGET_COL].map({"Yes": 1, "No": 0})

    # Standardize SeniorCitizen to string category
    if "SeniorCitizen" in df_clean.columns:
        df_clean["SeniorCitizen"] = df_clean["SeniorCitizen"].map({1: "Yes", 0: "No"})

    return df_clean


def split_data(
    df: pd.DataFrame, test_size: float = 0.20, random_state: int = RANDOM_STATE
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split data into train and test sets using stratification on the churn target."""
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found in dataframe.")

    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=random_state,
        stratify=df[TARGET_COL],
    )

    return train_df.reset_index(drop=True), test_df.reset_index(drop=True)


if __name__ == "__main__":
    from src.data_loader import load_raw_data

    raw_df = load_raw_data()
    clean_df = clean_raw_data(raw_df)
    train_df, test_df = split_data(clean_df)

    PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    clean_df.to_csv(PROCESSED_DATA_PATH, index=False)

    print(f"Cleaned data saved to {PROCESSED_DATA_PATH}")
    print(f"Train set shape: {train_df.shape}, Test set shape: {test_df.shape}")
    print(f"Train Churn Rate: {train_df[TARGET_COL].mean():.4f}")
    print(f"Test Churn Rate: {test_df[TARGET_COL].mean():.4f}")
