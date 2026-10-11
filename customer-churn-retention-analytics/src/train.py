"""Model training module comparing Logistic Regression, Random Forest, and XGBoost."""

import json
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate, RandomizedSearchCV

from src.config import (
    MODELS_DIR,
    METRICS_DIR,
    RANDOM_STATE,
    TARGET_COL,
)
from src.data_loader import load_raw_data
from src.preprocessing import clean_raw_data, split_data
from src.feature_engineering import FeaturePipeline


def train_and_tune_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = RANDOM_STATE,
) -> Tuple[Dict[str, Any], Dict[str, Any], Any]:
    """Train Logistic Regression, Random Forest, and XGBoost with StratifiedKFold CV and tuning.
    
    Returns:
        models: Dictionary of trained models
        cv_results: Dictionary of cross-validation metrics for each model
        best_model_name: Name of the top-performing model (based on ROC-AUC & Recall/F1)
    """
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]

    # Calculate class imbalance ratio for XGBoost scale_pos_weight
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    imbalance_ratio = neg_count / pos_count

    print(f"Training set class distribution: 0={neg_count}, 1={pos_count} (Ratio={imbalance_ratio:.2f})")

    # 1. Logistic Regression (balanced class weight)
    lr_model = LogisticRegression(
        class_weight="balanced",
        C=0.1,
        max_iter=1000,
        random_state=random_state,
        solver="lbfgs",
    )

    # 2. Random Forest (balanced class weight)
    rf_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=7,
        min_samples_split=8,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=random_state,
        n_jobs=-1,
    )

    # 3. XGBoost (tuned with scale_pos_weight for churn recall)
    xgb_base = XGBClassifier(
        n_estimators=160,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=imbalance_ratio * 0.85,
        eval_metric="logloss",
        random_state=random_state,
        n_jobs=-1,
    )

    candidates = {
        "Logistic Regression": lr_model,
        "Random Forest": rf_model,
        "XGBoost": xgb_base,
    }

    cv_results = {}
    trained_models = {}

    for name, model in candidates.items():
        print(f"Running 5-fold cross validation for {name}...")
        scores = cross_validate(model, X_train, y_train, cv=cv, scoring=scoring)
        cv_results[name] = {
            "cv_accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "cv_accuracy_std": float(np.std(scores["test_accuracy"])),
            "cv_precision_mean": float(np.mean(scores["test_precision"])),
            "cv_recall_mean": float(np.mean(scores["test_recall"])),
            "cv_f1_mean": float(np.mean(scores["test_f1"])),
            "cv_roc_auc_mean": float(np.mean(scores["test_roc_auc"])),
            "cv_roc_auc_std": float(np.std(scores["test_roc_auc"])),
        }
        # Fit model on entire training set
        model.fit(X_train, y_train)
        trained_models[name] = model

    # Select best model based on ROC-AUC and F1 balance
    best_model_name = max(
        cv_results.keys(),
        key=lambda k: cv_results[k]["cv_roc_auc_mean"] + cv_results[k]["cv_f1_mean"],
    )

    print(f"\nBest Model by CV Performance: {best_model_name}")
    return trained_models, cv_results, best_model_name


def run_training_pipeline() -> Tuple[Any, FeaturePipeline, Dict[str, Any]]:
    """Execute end-to-end training pipeline and persist artifacts."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 1: Loading raw data...")
    raw_df = load_raw_data()
    clean_df = clean_raw_data(raw_df)

    print("Step 2: Splitting train/test...")
    train_df, test_df = split_data(clean_df)

    print("Step 3: Engineering features...")
    pipeline = FeaturePipeline()
    X_train = pipeline.fit_transform(train_df)
    y_train = train_df[TARGET_COL]

    X_test = pipeline.transform(test_df)
    y_test = test_df[TARGET_COL]

    print("Step 4: Training & validating candidate models...")
    trained_models, cv_results, best_name = train_and_tune_models(X_train, y_train)

    # Save best model and pipeline
    best_model = trained_models[best_name]
    best_model_path = MODELS_DIR / "best_model.joblib"
    pipeline_path = MODELS_DIR / "feature_pipeline.joblib"
    all_models_path = MODELS_DIR / "all_models.joblib"

    joblib.dump(best_model, best_model_path)
    joblib.dump(pipeline, pipeline_path)
    joblib.dump(trained_models, all_models_path)

    # Save CV metrics
    cv_metrics_path = METRICS_DIR / "cv_metrics.json"
    with open(cv_metrics_path, "w") as f:
        json.dump(cv_results, f, indent=2)

    # Save processed features for downstream evaluation & SHAP
    X_train.to_csv(MODELS_DIR / "X_train.csv", index=False)
    y_train.to_csv(MODELS_DIR / "y_train.csv", index=False)
    X_test.to_csv(MODELS_DIR / "X_test.csv", index=False)
    y_test.to_csv(MODELS_DIR / "y_test.csv", index=False)
    test_df.to_csv(MODELS_DIR / "test_raw_df.csv", index=False)

    print(f"Artifacts successfully saved to {MODELS_DIR} and {METRICS_DIR}")
    return best_model, pipeline, cv_results


if __name__ == "__main__":
    run_training_pipeline()
