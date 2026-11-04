"""Nettoie le texte brut et cree un split train/test reproductible."""
import re
import pandas as pd
from sklearn.model_selection import train_test_split

RAW_PATH = "data/raw/reddit.csv"
TRAIN_PATH = "data/processed/train.csv"
TEST_PATH = "data/processed/test.csv"
RANDOM_STATE = 42


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean():
    df = pd.read_csv(RAW_PATH)
    df = df.rename(columns={"clean_comment": "text", "category": "label"})
    df["text"] = df["text"].apply(clean_text)
    df = df[df["text"].str.len() > 0]

    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=RANDOM_STATE, stratify=df["label"]
    )
    train_df.to_csv(TRAIN_PATH, index=False)
    test_df.to_csv(TEST_PATH, index=False)
    print(f"Train : {len(train_df)} lignes | Test : {len(test_df)} lignes")


if __name__ == "__main__":
    clean()
