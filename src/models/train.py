"""Entraine un modele TF-IDF + Logistic Regression et le sauvegarde."""
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix

TRAIN_PATH = "data/processed/train.csv"
TEST_PATH = "data/processed/test.csv"
MODEL_PATH = "models/model.joblib"
VECTORIZER_PATH = "models/vectorizer.joblib"


def train():
    train_df = pd.read_csv(TRAIN_PATH).dropna()
    test_df = pd.read_csv(TEST_PATH).dropna()

    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train = vectorizer.fit_transform(train_df["text"])
    X_test = vectorizer.transform(test_df["text"])

    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(X_train, train_df["label"])

    preds = model.predict(X_test)
    print("Accuracy :", accuracy_score(test_df["label"], preds))
    print("F1 par classe :", f1_score(test_df["label"], preds, average=None))
    print("Matrice de confusion :\n", confusion_matrix(test_df["label"], preds))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"Modele sauvegarde dans {MODEL_PATH} et {VECTORIZER_PATH}")


if __name__ == "__main__":
    train()
