"""Model evaluation module for computing test set metrics, curves, and figures."""

import json
from pathlib import Path
from typing import Dict, Any
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    classification_report,
)

from src.config import MODELS_DIR, METRICS_DIR, FIGURES_DIR


def evaluate_models_on_test() -> pd.DataFrame:
    """Evaluate trained candidate models on the held-out test set."""
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)

    # Load artifacts
    all_models = joblib.load(MODELS_DIR / "all_models.joblib")
    X_test = pd.read_csv(MODELS_DIR / "X_test.csv")
    y_test = pd.read_csv(MODELS_DIR / "y_test.csv").values.ravel()

    comparison_records = []
    test_metrics = {}

    plt.figure(figsize=(8, 6))
    
    for name, model in all_models.items():
        y_prob = model.predict_proba(X_test)[:, 1]
        
        # Calculate optimal threshold for F1 / Recall
        thresholds = np.linspace(0.2, 0.7, 51)
        f1_scores = [f1_score(y_test, (y_prob >= t).astype(int), zero_division=0) for t in thresholds]
        best_t_idx = int(np.argmax(f1_scores))
        best_threshold = float(thresholds[best_t_idx])

        # Standard 0.5 predictions and threshold-adjusted predictions
        y_pred = (y_prob >= 0.5).astype(int)
        y_pred_opt = (y_prob >= best_threshold).astype(int)

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_prob))

        # Metrics at optimal threshold
        opt_prec = float(precision_score(y_test, y_pred_opt, zero_division=0))
        opt_rec = float(recall_score(y_test, y_pred_opt, zero_division=0))
        opt_f1 = float(f1_score(y_test, y_pred_opt, zero_division=0))

        record = {
            "Model": name,
            "Accuracy": round(acc, 4),
            "Precision": round(prec, 4),
            "Recall": round(rec, 4),
            "F1-Score": round(f1, 4),
            "ROC-AUC": round(auc, 4),
            "Optimal_Threshold": round(best_threshold, 2),
            "Recall_at_Optimal": round(opt_rec, 4),
            "F1_at_Optimal": round(opt_f1, 4),
        }
        comparison_records.append(record)
        test_metrics[name] = record

        # ROC Curve Plotting
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        plt.plot(fpr, tpr, lw=2, label=f"{name} (AUC = {auc:.3f})")

    # Finalize ROC plot
    plt.plot([0, 1], [0, 1], "k--", lw=1.5, label="Random Guess (AUC = 0.500)")
    plt.xlabel("False Positive Rate", fontsize=11)
    plt.ylabel("True Positive Rate (Recall)", fontsize=11)
    plt.title("ROC Curves Comparison - Held-Out Test Set", fontsize=13, fontweight="bold")
    plt.legend(loc="lower right", frameon=True)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "roc_curves_comparison.png", dpi=300)
    plt.close()

    # Precision-Recall Curves
    plt.figure(figsize=(8, 6))
    for name, model in all_models.items():
        y_prob = model.predict_proba(X_test)[:, 1]
        p, r, _ = precision_recall_curve(y_test, y_prob)
        plt.plot(r, p, lw=2, label=f"{name}")
    plt.xlabel("Recall", fontsize=11)
    plt.ylabel("Precision", fontsize=11)
    plt.title("Precision-Recall Curves - Held-Out Test Set", fontsize=13, fontweight="bold")
    plt.legend(loc="lower left", frameon=True)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "precision_recall_curves.png", dpi=300)
    plt.close()

    # Generate Confusion Matrix for the best model (XGBoost)
    xgb_model = all_models["XGBoost"]
    y_prob_xgb = xgb_model.predict_proba(X_test)[:, 1]
    y_pred_xgb = (y_prob_xgb >= 0.5).astype(int)
    cm = confusion_matrix(y_test, y_pred_xgb)

    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Retained (0)", "Churned (1)"],
        yticklabels=["Retained (0)", "Churned (1)"],
    )
    plt.title("Confusion Matrix - XGBoost (Threshold = 0.50)", fontsize=12, fontweight="bold")
    plt.ylabel("Actual Label", fontsize=11)
    plt.xlabel("Predicted Label", fontsize=11)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "confusion_matrix_xgboost.png", dpi=300)
    plt.close()

    # Save metrics table
    comparison_df = pd.DataFrame(comparison_records)
    comparison_df.to_csv(METRICS_DIR / "model_comparison.csv", index=False)
    
    with open(METRICS_DIR / "test_metrics.json", "w") as f:
        json.dump(test_metrics, f, indent=2)

    # Classification report for XGBoost
    rep = classification_report(y_test, y_pred_xgb, target_names=["Retained", "Churned"], output_dict=True)
    with open(METRICS_DIR / "classification_report_xgboost.json", "w") as f:
        json.dump(rep, f, indent=2)

    print("\n=== Model Comparison on Test Set ===")
    print(comparison_df.to_string(index=False))
    print(f"\nSaved figures to {FIGURES_DIR} and metrics to {METRICS_DIR}")
    return comparison_df


if __name__ == "__main__":
    evaluate_models_on_test()
