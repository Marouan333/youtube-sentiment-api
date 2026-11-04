"""Tests du modele : performance, cas limites, temps d'inference."""
import time
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score

model = joblib.load("models/model.joblib")
vectorizer = joblib.load("models/vectorizer.joblib")


def predict(texts):
    return model.predict(vectorizer.transform(texts))


def test_accuracy_on_test_set():
    test_df = pd.read_csv("data/processed/test.csv").dropna()
    preds = predict(test_df["text"])
    acc = accuracy_score(test_df["label"], preds)
    assert acc >= 0.80


def test_empty_string_does_not_crash():
    preds = predict([""])
    assert preds[0] in (-1, 0, 1)


def test_very_long_text_does_not_crash():
    preds = predict(["bad " * 2000])
    assert preds[0] in (-1, 0, 1)


def test_emoji_text_does_not_crash():
    preds = predict(["this is great 😀🔥👍"])
    assert preds[0] in (-1, 0, 1)


def test_mixed_language_does_not_crash():
    preds = predict(["this video is bon et très intéressant"])
    assert preds[0] in (-1, 0, 1)


def test_inference_time_under_100ms_for_50_comments():
    comments = ["this is a sample comment"] * 50
    start = time.perf_counter()
    predict(comments)
    elapsed_ms = (time.perf_counter() - start) * 1000
    assert elapsed_ms < 100
