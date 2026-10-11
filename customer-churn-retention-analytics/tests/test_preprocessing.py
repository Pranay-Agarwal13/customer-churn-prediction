"""Unit tests for preprocessing and feature engineering."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import pandas as pd
import numpy as np

from src.data_loader import load_raw_data, audit_data_quality
from src.preprocessing import clean_raw_data, split_data
from src.feature_engineering import FeaturePipeline
from src.config import TARGET_COL, RAW_DATA_PATH


def test_raw_data_loading():
    """Test loading the raw dataset."""
    df = load_raw_data(RAW_DATA_PATH)
    assert not df.empty
    assert df.shape[0] == 7043
    assert df.shape[1] == 21
    assert "customerID" in df.columns
    assert "Churn" in df.columns


def test_clean_raw_data():
    """Test data cleaning: TotalCharges numeric conversion and target mapping."""
    df = load_raw_data(RAW_DATA_PATH)
    clean_df = clean_raw_data(df)
    
    # Check TotalCharges is float
    assert pd.api.types.is_float_dtype(clean_df["TotalCharges"])
    # Check no missing values remain in TotalCharges
    assert clean_df["TotalCharges"].isnull().sum() == 0
    # Check target mapping to 0 and 1
    assert set(clean_df[TARGET_COL].unique()).issubset({0, 1})


def test_split_data_stratification():
    """Test stratified split maintains class balance."""
    df = load_raw_data(RAW_DATA_PATH)
    clean_df = clean_raw_data(df)
    train_df, test_df = split_data(clean_df, test_size=0.20, random_state=42)

    total_churn_rate = clean_df[TARGET_COL].mean()
    train_churn_rate = train_df[TARGET_COL].mean()
    test_churn_rate = test_df[TARGET_COL].mean()

    # Stratification ensures churn rate is virtually identical in train and test
    assert pytest.approx(train_churn_rate, abs=0.01) == total_churn_rate
    assert pytest.approx(test_churn_rate, abs=0.01) == total_churn_rate
    assert len(train_df) + len(test_df) == len(clean_df)


def test_feature_engineering_pipeline():
    """Test domain feature addition and feature scaling pipeline."""
    df = load_raw_data(RAW_DATA_PATH)
    clean_df = clean_raw_data(df)
    train_df, test_df = split_data(clean_df, test_size=0.20, random_state=42)

    pipeline = FeaturePipeline()
    X_train = pipeline.fit_transform(train_df)
    X_test = pipeline.transform(test_df)

    assert pipeline.is_fitted
    assert not X_train.empty
    assert not X_test.empty
    assert X_train.shape[1] == X_test.shape[1]
    
    # Target and customerID must not be in feature columns
    assert "Churn" not in X_train.columns
    assert "customerID" not in X_train.columns
    
    # Domain features must exist
    assert "is_month_to_month" in X_train.columns
    assert "is_electronic_check" in X_train.columns
    assert "total_services_count" in X_train.columns
    assert "high_risk_combo" in X_train.columns
