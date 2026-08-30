import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score

def main():
    # 1. Dataset Inspection & Loading
    dataset_path = 'dataset/simulated_mems_vibration_hazard_dataset.csv'
    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    # 2. Feature / Target Separation
    features = [
        "rms_acceleration_mps2",
        "dominant_frequency_hz",
        "peak_acceleration_mps2"
    ]
    target = "vibration_hazard_label"
    
    X = df[features]
    y = df[target]
    
    # 3. Train / Test Split
    print("Splitting data (80/20, stratified, random_state=42)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    # 4. Model Implementation
    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(random_state=42)
    clf.fit(X_train, y_train)
    
    # 5. Model Validation
    print("Validating model on held-out test set...")
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)
    
    print("\n--- Validation Metrics ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc:.4f}")
    print(f"Confusion Matrix:\n{cm}")
    
    # 6. Feature Importance
    print("\n--- Feature Importance ---")
    for name, importance in zip(features, clf.feature_importances_):
        print(f"{name}: {importance:.4f}")
        
    # 7. Save the Trained Model
    model_path = 'vibration_rf_model.joblib'
    joblib.dump(clf, model_path)
    print(f"\nModel saved successfully to {model_path}")

if __name__ == '__main__':
    main()
