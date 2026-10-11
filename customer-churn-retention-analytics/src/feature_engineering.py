"""Feature engineering module for creating domain-driven features and encoding."""

from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from src.config import TARGET_COL, ID_COL, SERVICE_COLS


class FeaturePipeline:
    """Feature engineering and transformation pipeline for Telco Churn."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_columns: List[str] = []
        self.categorical_columns: List[str] = []
        self.numeric_columns: List[str] = []
        self.is_fitted = False

    def add_domain_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create domain-driven telecom retention features."""
        df_feat = df.copy()

        # 1. Tenure Groups
        df_feat["tenure_group"] = pd.cut(
            df_feat["tenure"],
            bins=[-1, 12, 24, 48, 72],
            labels=["0-12m", "13-24m", "25-48m", "49-72m"],
        ).astype(str)

        # 2. Monthly Charge Bands
        df_feat["monthly_charges_band"] = pd.cut(
            df_feat["MonthlyCharges"],
            bins=[-1, 35, 70, 95, 200],
            labels=["Low", "Medium", "High", "Very_High"],
        ).astype(str)

        # 3. Total Services Count
        # Count affirmative services: 'Yes' across security, backup, protection, support, streaming
        service_presence = [
            (df_feat["PhoneService"] == "Yes").astype(int),
            (df_feat["MultipleLines"] == "Yes").astype(int),
            (df_feat["OnlineSecurity"] == "Yes").astype(int),
            (df_feat["OnlineBackup"] == "Yes").astype(int),
            (df_feat["DeviceProtection"] == "Yes").astype(int),
            (df_feat["TechSupport"] == "Yes").astype(int),
            (df_feat["StreamingTV"] == "Yes").astype(int),
            (df_feat["StreamingMovies"] == "Yes").astype(int),
        ]
        df_feat["total_services_count"] = sum(service_presence)

        # 4. Protective Services (Tech Support and Online Security reduce churn dramatically)
        df_feat["has_tech_support"] = (df_feat["TechSupport"] == "Yes").astype(int)
        df_feat["has_online_security"] = (df_feat["OnlineSecurity"] == "Yes").astype(int)
        df_feat["has_protective_bundle"] = (
            (df_feat["TechSupport"] == "Yes") & (df_feat["OnlineSecurity"] == "Yes")
        ).astype(int)

        # 5. Average Charge per Tenure Month (Charge velocity / ratio)
        df_feat["avg_charge_per_tenure_month"] = df_feat["TotalCharges"] / (df_feat["tenure"] + 1)
        df_feat["charge_ratio"] = df_feat["MonthlyCharges"] / (df_feat["avg_charge_per_tenure_month"] + 1e-5)

        # 6. High Risk Indicators
        df_feat["is_month_to_month"] = (df_feat["Contract"] == "Month-to-month").astype(int)
        df_feat["is_electronic_check"] = (df_feat["PaymentMethod"] == "Electronic check").astype(int)
        df_feat["is_fiber_optic"] = (df_feat["InternetService"] == "Fiber optic").astype(int)
        
        # High-risk vulnerability interaction
        df_feat["high_risk_combo"] = (
            (df_feat["is_month_to_month"] == 1) & (df_feat["is_electronic_check"] == 1)
        ).astype(int)

        # Early-tenure high-charge vulnerability
        df_feat["early_tenure_high_charge"] = (
            (df_feat["tenure"] <= 12) & (df_feat["MonthlyCharges"] >= 70)
        ).astype(int)

        return df_feat

    def fit(self, train_df: pd.DataFrame) -> "FeaturePipeline":
        """Fit one-hot encoding columns and numeric scaler on training data."""
        df_feat = self.add_domain_features(train_df)

        # Drop ID and Target for feature matrix
        drop_cols = [col for col in [ID_COL, TARGET_COL] if col in df_feat.columns]
        X_raw = df_feat.drop(columns=drop_cols)

        # Identify categorical columns to one-hot encode
        self.categorical_columns = X_raw.select_dtypes(include=["object", "category"]).columns.tolist()
        
        # Perform get_dummies to learn feature columns
        X_encoded = pd.get_dummies(X_raw, columns=self.categorical_columns, drop_first=True)
        self.feature_columns = X_encoded.columns.tolist()

        # Identify numeric columns to scale
        self.numeric_columns = [
            "tenure",
            "MonthlyCharges",
            "TotalCharges",
            "avg_charge_per_tenure_month",
            "charge_ratio",
            "total_services_count",
        ]
        self.scaler.fit(X_encoded[self.numeric_columns])
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform input DataFrame into encoded, scaled feature matrix."""
        if not self.is_fitted:
            raise RuntimeError("Pipeline must be fitted before calling transform.")

        df_feat = self.add_domain_features(df)
        drop_cols = [col for col in [ID_COL, TARGET_COL] if col in df_feat.columns]
        X_raw = df_feat.drop(columns=drop_cols, errors="ignore")

        # One-hot encode with existing categories
        X_encoded = pd.get_dummies(X_raw, columns=self.categorical_columns, drop_first=True)

        # Align columns with training feature columns (fill missing with 0)
        X_aligned = X_encoded.reindex(columns=self.feature_columns, fill_value=0)

        # Scale numerical columns
        X_aligned[self.numeric_columns] = self.scaler.transform(X_aligned[self.numeric_columns])

        return X_aligned

    def fit_transform(self, train_df: pd.DataFrame) -> pd.DataFrame:
        """Fit on train and transform."""
        return self.fit(train_df).transform(train_df)
