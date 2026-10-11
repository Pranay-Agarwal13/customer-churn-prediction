# Customer Churn Prediction & Retention Analytics Plan (PLAN.md)

## 1. Problem Statement
Customer attrition in telecommunications is a multi-million-dollar challenge. Acquiring a new subscriber is typically 5 to 7 times more expensive than retaining an existing customer. When high-value customers churn (especially high-MRR fiber optic and multi-service users), the loss directly impacts Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR).
The goal of this project is to build an end-to-end, production-grade churn intelligence system ("ChurnLens") that:
1. Predicts individual customer churn probability using machine learning (Logistic Regression, Random Forest, XGBoost).
2. Explains the global and individual churn drivers with TreeSHAP.
3. Provides an interactive decision-support dashboard enabling retention leads to simulate counterfactual interventions (contract extension, payment method shift, tech support add-ons) and calculate Net LTV recovery.

## 2. Dataset Source & Columns
- **Dataset**: IBM Telco Customer Churn dataset (Public domain / Kaggle / IBM Community).
- **Size**: 7,043 rows, 21 columns.
- **Attributes**:
  - Customer demographics: `gender`, `SeniorCitizen`, `Partner`, `Dependents`
  - Account info: `tenure`, `Contract`, `PaperlessBilling`, `PaymentMethod`, `MonthlyCharges`, `TotalCharges`
  - Subscribed services: `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`, `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`
  - Identifier: `customerID`
  - Target: `Churn` ('Yes' / 'No')

## 3. Target Variable Definition
- Binary target: `Churn`
  - `1`: Customer cancelled service within the last month ('Yes')
  - `0`: Customer retained ('No')
- Baseline distribution: ~26.5% positive churn rate (imbalanced ~1:3 ratio).

## 4. EDA Plan
1. **Univariate Analysis**: Churn distribution, distribution of continuous variables (`tenure`, `MonthlyCharges`, `TotalCharges`).
2. **Bivariate Analysis**:
   - Churn rate across contract types (Month-to-Month vs 1-Year vs 2-Year)
   - Churn rate across payment methods (Electronic Check vs Credit Card / Bank Transfer)
   - Churn rate by Internet Service (Fiber Optic vs DSL vs No Internet)
   - Churn rate across tenure deciles (high attrition during months 0–12)
3. **Correlation Analysis**: Spearman and Pearson correlations between charges, tenure, and churn indicator.
4. **Exported EDA Figures**:
   - `churn_distribution.png`
   - `churn_by_contract.png`
   - `churn_by_payment_method.png`
   - `tenure_distribution_by_churn.png`
   - `correlation_matrix.png`

## 5. Feature Engineering Plan
1. **Data Cleaning**:
   - `TotalCharges`: Convert string representations to numeric; replace 11 whitespace entries (where `tenure == 0`) with 0.0 or median.
   - Clean categorical values ('No internet service' and 'No phone service' standardized).
2. **Derived Domain Features**:
   - `tenure_group`: '0-12m', '13-24m', '25-48m', '49-72m'
   - `monthly_charges_group`: 'Low (<$35)', 'Medium ($35-$70)', 'High ($70-$95)', 'Very High (>$95)'
   - `total_services_count`: Count of active value-add services (Security, Backup, Protection, TechSupport, StreamTV, StreamMovies)
   - `has_support_addons`: Binary flag indicating presence of TechSupport or OnlineSecurity
   - `avg_charges_per_tenure_month`: `TotalCharges / (tenure + 1)`
   - `is_month_to_month`: Fast flag for highest contract vulnerability
   - `is_electronic_check`: Flag for highest-friction payment method
   - `high_risk_combo`: Customer has Month-to-Month contract AND Electronic Check
3. **Encoding & Scaling**:
   - One-hot encoding for nominal categories (`Contract`, `PaymentMethod`, `InternetService`, etc.)
   - StandardScaler / RobustScaler for numerical inputs (`tenure`, `MonthlyCharges`, `TotalCharges`, `avg_charges_per_tenure_month`)
4. **Leakage Prevention**: Stratified 80/20 train/test split executed prior to scaler fitting and feature encodings.

## 6. Modeling Plan
1. **Algorithms to Compare**:
   - Baseline: Logistic Regression (balanced class weights, L2 regularization)
   - Non-linear ensemble: Random Forest Classifier
   - Gradient boosted trees: XGBoost Classifier (with `scale_pos_weight` tuned for class imbalance)
2. **Handling Class Imbalance**:
   - Compare `class_weight='balanced'` / `scale_pos_weight` vs SMOTE oversampling. Select based on Stratified 5-Fold Cross Validation.
3. **Hyperparameter Tuning**:
   - StratifiedKFold (k=5, shuffle=True, random_state=42)
   - GridSearchCV / RandomizedSearchCV for XGBoost (`max_depth`, `learning_rate`, `n_estimators`, `subsample`, `colsample_bytree`, `scale_pos_weight`).
4. **Reproducibility**: Global `RANDOM_SEED = 42`.

## 7. Evaluation Strategy
Since customer retention prioritizes early intervention on churners without spamming stable subscribers:
- **Primary Metrics**: Recall (identifying maximum churners) and ROC-AUC (discrimination power across probability thresholds).
- **Secondary Metrics**: F1-Score, Precision, PR-AUC, Brier score / Calibration.
- **Decision Threshold Optimization**: Determine optimal threshold (e.g., ~0.38 - 0.42) maximizing F1 / expected profit instead of default 0.5.
- **Evaluation Outputs**:
   - Confusion matrices (raw counts and normalized)
   - ROC curves with AUC annotations
   - Precision-Recall curves
   - Classification reports saved to `reports/metrics/` and figures saved to `reports/figures/`.

## 8. Explainability Plan
- **SHAP (SHapley Additive exPlanations)**:
  - TreeExplainer on the best XGBoost model
  - Global Feature Importance (mean |SHAP value|)
  - Summary Beeswarm Plot showing directional effects
  - Partial Dependence Plots for `Contract_Month-to-month`, `tenure`, `MonthlyCharges`, `InternetService_Fiber optic`
  - Local Waterfall Attribution for individual customers (e.g. high-risk Fiber customer `7590-VHVEG`) showing exact positive/negative contributions to calibrated log-odds.

## 9. Dashboard Features (Streamlit & Interactive Web App)
- **Executive Overview**: Total active base, churn cycle rate, critical risk counts, MRR exposure at risk, Predictive Churn Radar Matrix, Priority Intervention Queue.
- **Customer Risk Inspector**: Deep-dive account diagnostic with real-time TreeSHAP waterfall decomposition and customer segmentation.
- **What-If Counterfactual Simulator**: Real-time slider/switch simulator to compute probability shifts and Net LTV impact upon changing contracts, billing methods, and support bundles.
- **Retention Playbooks**: Algorithmic intervention campaigns with automated trigger rules, targeting cohorts, expected probability drops, and ROI tracking.
- **Model Performance**: Full model comparison (LR vs RF vs XGB), confusion matrix, ROC curve, precision-recall curve, calibration curve.

## 10. Folder Structure
```
customer-churn-retention-analytics/
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
│   └── 01_eda_and_modeling.ipynb
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── train.py
│   ├── evaluate.py
│   └── explain.py
├── app/
│   └── streamlit_app.py
├── models/
├── reports/
│   ├── figures/
│   └── metrics/
├── tests/
│   └── test_preprocessing.py
├── requirements.txt
├── README.md
├── PLAN.md
└── .gitignore
```

## 11. Milestones
- **M1**: Setup virtual env, requirements, directory structure, and download public dataset.
- **M2**: Clean data, perform EDA, and generate reports/figures/.
- **M3**: Build modular data loader, preprocessor, and feature engineering pipeline with unit tests.
- **M4**: Train Logistic Regression, Random Forest, and XGBoost; perform cross-validation and hyperparameter tuning.
- **M5**: Evaluate models, export metrics to `reports/metrics/`, save best model to `models/`.
- **M6**: Generate SHAP global and local waterfall explanations.
- **M7**: Build `streamlit_app.py` and the high-fidelity responsive web application matching the Obsidian Telemetry design system.
- **M8**: Write comprehensive README.md and finalize verification.
