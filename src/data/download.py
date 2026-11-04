"""Telecharge le dataset Reddit et l'enregistre dans data/raw/reddit.csv."""
import requests
import pandas as pd

URL = "https://raw.githubusercontent.com/Himanshu-1703/reddit-sentiment-analysis/refs/heads/main/data/reddit.csv"
OUTPUT_PATH = "data/raw/reddit.csv"


def download():
    response = requests.get(URL)
    response.raise_for_status()
    with open(OUTPUT_PATH, "wb") as f:
        f.write(response.content)

    df = pd.read_csv(OUTPUT_PATH)
    print(f"Lignes : {len(df)}")
    print("Distribution des labels :")
    print(df["category"].value_counts())


if __name__ == "__main__":
    download()
