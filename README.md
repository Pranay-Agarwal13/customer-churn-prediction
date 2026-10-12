# 🔍 Customer Churn Prediction & Retention Analytics

An end-to-end machine learning project that predicts customer churn using Python, SQL, and XGBoost — with SHAP explainability and an interactive dashboard for customer risk analysis and retention insights.

---

## 📌 Problem Statement

Customer churn is one of the costliest problems for subscription-based businesses. Acquiring a new customer costs 5–7x more than retaining an existing one. This project builds a machine learning system that identifies customers at high risk of churning — before they leave — so retention teams can act proactively.

---

## 🎯 What This Project Does

- Ingests and cleans customer data using **Python and SQL**
- Performs **Exploratory Data Analysis (EDA)** to uncover churn drivers
- Trains and compares multiple ML models: **XGBoost, Random Forest, Logistic Regression**
- Explains model predictions using **SHAP values** — showing *why* a customer is flagged as high risk
- Delivers results through an **interactive Streamlit dashboard** for customer risk scoring, retention insights, and cohort analysis

---

## 🏗️ Architecture

```
Raw Customer Data (CSV / SQL)
        │
        ▼
  Data Preprocessing
  (Python, Pandas, SQL)
        │
        ▼
  Feature Engineering
  (tenure buckets, usage patterns,
   contract type encoding)
        │
        ▼
  Model Training & Evaluation
  (XGBoost, Random Forest,
   Logistic Regression)
        │
        ▼
  SHAP Explainability Layer
  (global feature importance +
   per-customer explanation)
        │
        ▼
  Streamlit Dashboard
  (churn risk scores, retention
   recommendations, cohort view)
```

---

## 📊 Model Results

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
|---|---|---|---|---|---|
| XGBoost | - | - | - | - | - |
| Random Forest | - | - | - | - | - |
| Logistic Regression | - | - | - | - | - |

> **Note:** Replace the dashes above with your actual metrics after running `src/train.py`.

---

## ✨ Key Features

- **Churn Risk Scoring** — every customer gets a probability score (0–100%) indicating their likelihood of churning
- **SHAP Explainability** — understand which features (contract type, tenure, monthly charges) are driving each prediction
- **Cohort Analysis** — segment customers by risk tier (High / Medium / Low) with retention action recommendations
- **Interactive Filters** — filter by contract type, tenure range, payment method, and monthly charges
- **Retention Insights** — actionable recommendations per customer segment based on churn drivers

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Language | Python 3.10+ |
| ML Models | XGBoost, scikit-learn (Random Forest, Logistic Regression) |
| Explainability | SHAP |
| Data Manipulation | Pandas, NumPy |
| Database / Queries | SQL, SQLite |
| Visualization | Matplotlib, Seaborn, Plotly |
| Dashboard | Streamlit |
| Frontend | React + Vite (TypeScript) |
| Version Control | Git, GitHub |

---

## 📁 Project Structure

```
customer-churn-prediction/
│
├── src/                          # Core ML pipeline
│   ├── data_preprocessing.py     # Data cleaning and feature engineering
│   ├── eda.py                    # Exploratory data analysis
│   ├── train.py                  # Model training and evaluation
│   ├── explain.py                # SHAP explainability
│   └── predict.py                # Inference pipeline
│
├── customer-churn-retention-analytics/  # Streamlit dashboard
│   └── app.py                    # Main Streamlit application
│
├── app/                          # React + Vite frontend
│   └── applet/
│       └── customer-churn-retention-analytics/
│
├── .env.example                  # Environment variable template
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Pranay-Agarwal13/customer-churn-prediction.git
cd customer-churn-prediction
```

### 2. Set Up Python Environment

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env and add your configuration
```

### 4. Run the ML Pipeline

```bash
# Preprocess data and train models
python src/train.py

# Generate SHAP explanations
python src/explain.py
```

### 5. Launch the Streamlit Dashboard

```bash
streamlit run customer-churn-retention-analytics/app.py
```

Open `http://localhost:8501` in your browser.

### 6. Run the React Frontend (optional)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📈 EDA Highlights

Key findings from exploratory data analysis:

- Customers on **month-to-month contracts** churn at significantly higher rates than annual contract holders
- **Tenure** is the strongest predictor — customers in their first 12 months are at highest risk
- **High monthly charges** combined with **low usage** is the clearest churn signal
- **Electronic check** payment method correlates with higher churn vs auto-payment methods
- **Senior citizens** without tech support show disproportionately high churn rates

---

## 🔎 SHAP Explainability

This project uses SHAP (SHapley Additive exPlanations) to make the model interpretable:

- **Global feature importance** — which features matter most across all customers
- **Per-customer waterfall plots** — exactly why a specific customer was flagged as high risk
- **Summary beeswarm plots** — distribution of feature impact across the full dataset

This makes the model actionable for business teams who need to understand and trust the predictions.

---

## 🎯 Business Impact

The churn prediction system enables retention teams to:

- **Prioritize outreach** — focus on the top 20% highest-risk customers first
- **Personalize retention offers** — tailor incentives based on each customer's specific churn drivers
- **Reduce churn rate** — proactive intervention before cancellation decisions are made
- **Optimize retention budget** — avoid spending on customers who weren't going to churn anyway

---

## 🔗 Live Demo

> Coming soon — deploying on Streamlit Cloud

---

## 👤 Author

**Pranay Agarwal**
- GitHub: [@Pranay-Agarwal13](https://github.com/Pranay-Agarwal13)
- LinkedIn: [linkedin.com/in/pranayagarwal13](https://www.linkedin.com/in/pranayagarwal13)

---

## 📄 License

This project is for educational and portfolio purposes.
