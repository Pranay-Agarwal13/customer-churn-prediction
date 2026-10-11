"""Exploratory Data Analysis script for generating visualizations and insights."""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

from src.config import FIGURES_DIR
from src.data_loader import load_raw_data
from src.preprocessing import clean_raw_data


def run_eda():
    """Generate and save comprehensive EDA figures."""
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="muted")

    raw_df = load_raw_data()
    df = clean_raw_data(raw_df)

    # 1. Overall Churn Rate Pie / Count Chart
    plt.figure(figsize=(7, 5))
    churn_counts = df["Churn"].value_counts()
    churn_labels = ["Retained (No)", "Churned (Yes)"]
    colors = ["#38bdf8", "#ffb2b7"]
    plt.pie(
        churn_counts,
        labels=churn_labels,
        autopct="%1.1f%%",
        startangle=140,
        colors=colors,
        explode=(0, 0.08),
        shadow=True,
    )
    plt.title("Telco Customer Churn Distribution (Baseline 26.5%)", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "churn_distribution.png", dpi=300)
    plt.close()

    # 2. Churn by Contract Type
    plt.figure(figsize=(8, 5))
    contract_churn = df.groupby("Contract")["Churn"].mean() * 100
    ax = contract_churn.plot(kind="bar", color=["#ffb2b7", "#38bdf8", "#56e5a9"])
    plt.title("Churn Rate by Contract Type (%)", fontsize=12, fontweight="bold")
    plt.ylabel("Churn Percentage (%)")
    plt.xlabel("Contract Commitment")
    for p in ax.patches:
        ax.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2.0, p.get_height() + 1), ha="center")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "churn_by_contract.png", dpi=300)
    plt.close()

    # 3. Churn by Payment Method
    plt.figure(figsize=(9, 5))
    pay_churn = df.groupby("PaymentMethod")["Churn"].mean().sort_values(ascending=False) * 100
    ax = pay_churn.plot(kind="bar", color="#38bdf8")
    plt.title("Churn Rate by Payment Rail (%)", fontsize=12, fontweight="bold")
    plt.ylabel("Churn Percentage (%)")
    plt.xticks(rotation=25, ha="right")
    for p in ax.patches:
        ax.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2.0, p.get_height() + 1), ha="center")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "churn_by_payment_method.png", dpi=300)
    plt.close()

    # 4. Churn by Internet Service
    plt.figure(figsize=(8, 5))
    net_churn = df.groupby("InternetService")["Churn"].mean() * 100
    ax = net_churn.plot(kind="bar", color=["#38bdf8", "#ffb2b7", "#56e5a9"])
    plt.title("Churn Rate by Internet Service Tier (%)", fontsize=12, fontweight="bold")
    plt.ylabel("Churn Percentage (%)")
    plt.xticks(rotation=0)
    for p in ax.patches:
        ax.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2.0, p.get_height() + 1), ha="center")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "churn_by_internet_service.png", dpi=300)
    plt.close()

    # 5. Tenure Distribution by Churn Status (KDE plot)
    plt.figure(figsize=(9, 5))
    sns.kdeplot(data=df, x="tenure", hue="Churn", common_norm=False, fill=True, palette=["#38bdf8", "#ffb2b7"])
    plt.title("Tenure Life-Cycle Distribution by Churn Status", fontsize=12, fontweight="bold")
    plt.xlabel("Tenure (Months)")
    plt.ylabel("Density")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "tenure_distribution_by_churn.png", dpi=300)
    plt.close()

    # 6. Monthly Charges vs Churn (Boxplot)
    plt.figure(figsize=(7, 5))
    sns.boxplot(data=df, x="Churn", y="MonthlyCharges", palette=["#38bdf8", "#ffb2b7"])
    plt.title("Monthly Recurring Charges vs Churn Status", fontsize=12, fontweight="bold")
    plt.xticks([0, 1], ["Retained", "Churned"])
    plt.ylabel("Monthly Charges ($)")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "monthly_charges_vs_churn.png", dpi=300)
    plt.close()

    # 7. Correlation Matrix of Numerical Features
    plt.figure(figsize=(6, 5))
    num_cols = ["tenure", "MonthlyCharges", "TotalCharges", "Churn"]
    corr = df[num_cols].corr()
    sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f", vmin=-1, vmax=1)
    plt.title("Numerical Correlation Matrix", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "correlation_matrix.png", dpi=300)
    plt.close()

    print(f"All EDA visualizations successfully generated and saved to {FIGURES_DIR}")


if __name__ == "__main__":
    run_eda()
