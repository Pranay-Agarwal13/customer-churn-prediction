# ChurnLens - Customer Churn Prediction & Retention Analytics

An end-to-end, portfolio-quality Machine Learning and Customer Intelligence project predicting telecom subscriber attrition, explaining churn drivers with TreeSHAP, and providing interactive decision-support tools for retention teams.

---

## 1. Business Problem
In the telecommunications industry, customer acquisition costs (CAC) are 5x to 7x higher than retention costs. When high-MRR customers churn—particularly on fiber optic lines and multi-service plans—it creates severe Monthly Recurring Revenue (MRR) drag and degrades Annual Recurring Revenue (ARR).

**Business Objectives:**
1. **Early Risk Detection:** Flag at-risk subscribers 30 to 60 days before contract expiration or billing cancellation.
2. **Explainable AI (XAI):** Dissect the exact factors pushing up churn probability for every individual subscriber using TreeSHAP.
3. **Prescriptive Interventions:** Equip retention leads with automated intervention playbooks and an interactive What-If Counterfactual Simulator to model retention yield and Net Lifetime Value (LTV) recovery.

---

## 2. Dataset Overview
- **Dataset:** IBM Telco Customer Churn (Kaggle / Public IBM dataset)
- **Observations:** 7,043 customers, 21 attributes
- **Target Variable:** `Churn` (Binary: `1` = Churned, `0` = Retained)
- **Baseline Churn Rate:** 26.54% (1,869 churners, 5,174 retained)
- **Key Feature Categories:**
  - **Account & Billing:** `tenure`, `Contract`, `PaperlessBilling`, `PaymentMethod`, `MonthlyCharges`, `TotalCharges`
  - **Services Enrolled:** `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`, `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`
  - **Demographics:** `gender`, `SeniorCitizen`, `Partner`, `Dependents`

---

## 3. Project Architecture

```
customer-churn-retention-analytics/
├── data/
│   ├── raw/
│   │   └── Telco-Customer-Churn.csv
│   └── processed/
│       └── telco_churn_clean.csv
├── notebooks/
│   └── 01_eda_and_modeling.ipynb
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── eda.py
│   ├── train.py
│   ├── evaluate.py
│   └── explain.py
├── app/
│   └── streamlit_app.py
├── models/
│   ├── best_model.joblib
│   ├── feature_pipeline.joblib
│   └── all_models.joblib
├── reports/
│   ├── figures/
│   │   ├── churn_distribution.png
│   │   ├── churn_by_contract.png
│   │   ├── churn_by_payment_method.png
│   │   ├── churn_by_internet_service.png
│   │   ├── tenure_distribution_by_churn.png
│   │   ├── confusion_matrix_xgboost.png
│   │   ├── roc_curves_comparison.png
│   │   ├── precision_recall_curves.png
│   │   ├── shap_feature_importance.png
│   │   └── shap_summary_beeswarm.png
│   └── metrics/
│       ├── model_comparison.csv
│       ├── test_metrics.json
│       ├── classification_report_xgboost.json
│       └── shap_feature_importance.csv
├── tests/
│   └── test_preprocessing.py
├── requirements.txt
├── README.md
├── PLAN.md
└── .gitignore
```

---

## 4. Model Evaluation & Benchmark Results

The models were evaluated on an 80/20 stratified hold-out test set (1,409 customers; 374 churners, 1,035 retained). Metrics reflect the actual trained models:

| Model | Test Accuracy | Test Precision | Test Recall (0.50) | Test F1-Score | Test ROC-AUC | Optimal Threshold | Recall @ Opt | F1 @ Opt |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Selected)** | **76.30%** | **53.82%** | **75.40%** | **0.6281** | **0.8445** | **0.43** | **81.02%** | **0.6352** |
| **Random Forest** | 75.94% | 53.19% | 78.07% | 0.6327 | 0.8440 | 0.55 | 74.87% | 0.6400 |
| **Logistic Regression** | 74.31% | 51.04% | 78.61% | 0.6189 | 0.8470 | 0.57 | 75.40% | 0.6409 |

*Prioritization rationale: Because customer retention focuses on minimizing undetected churners, recall and ROC-AUC are prioritized while maintaining robust precision. XGBoost with tuned `scale_pos_weight` and threshold 0.43 achieves 81.02% recall with 0.845 ROC-AUC.*

---

## 5. Top 5 Churn Drivers (TreeSHAP Insights)

1. **`Contract_Month-to-month` (Strongest Risk Driver)**: Subscribers on Month-to-Month contracts have an average churn rate of **42.7%**, compared to **11.2%** for 1-Year and **2.8%** for 2-Year contracts.
2. **`tenure` (Tenure Life Cycle Window)**: Attrition peaks in months 0–12 (**48.2% drop-off**). Once a customer reaches 24+ months, churn drops below 15%.
3. **`MonthlyCharges` (Price Elasticity)**: High monthly bills ($70–$100+) without protective service bundles correlate with heightened attrition.
4. **`InternetService_Fiber optic` (Broadband Vulnerability)**: Fiber subscribers experience higher expectations and intense competitor targeting.
5. **`PaymentMethod_Electronic check` (Friction Rail)**: Electronic check users show a **45.2% churn rate** due to monthly manual invoice friction, versus ~15% for automated credit card / bank transfer debit mandates.

---

## 6. Installation & Execution Guide

### Prerequisites
- Python 3.9+ installed
- Virtual environment recommended

### 1. Clone & Install Dependencies
```bash
cd customer-churn-retention-analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Data Pipeline & Exploratory Analysis
```bash
python -m src.eda
```

### 3. Train Candidate Models & Run 5-Fold Stratified Cross Validation
```bash
python -m src.train
```

### 4. Evaluate Models on Test Set & Generate Performance Curves
```bash
python -m src.evaluate
```

### 5. Generate TreeSHAP Global & Local Waterfall Explanations
```bash
python -m src.explain
```

### 6. Run Automated Test Suite
```bash
pytest tests/ -v
```

### 7. Launch the Streamlit Dashboard
```bash
streamlit run app/streamlit_app.py
```

---

## 7. Strategic Retention Playbooks

Based on model triggers, four algorithmic playbooks were codified:
1. **Month-to-Month Commitment Shift:** Target subscribers with M2M contracts with a 10% bill credit guarantee for 6 months upon ratifying a 12-month agreement.
2. **Frictionless Autopay Migration:** Incentivize Electronic Check users with a one-time ₹500 digital wallet credit and 5% recurring autopay discount upon registering Credit Card / UPI mandates.
3. **Early-Tenure 90-Day VIP Onboarding:** Proactive concierge checkup calls and complimentary 90-Day Tech Shield for subscribers in months 1–3.
4. **Gigabit Fiber Value & Reliability Lock:** Free Wi-Fi 6 Mesh Router unit or symmetrical speed bump in exchange for a 1-year renewal commitment.

---

## 8. Future Improvements
- Implement survival analysis (Cox Proportional Hazards / Kaplan-Meier) to estimate exact expected time-to-churn.
- Incorporate customer service call transcripts and sentiment embeddings using NLP.
- Multi-armed bandit (MAB) allocation for real-time incentive optimization.
