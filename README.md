# YouTube Sentiment Analyzer

Systeme MLOps complet qui analyse automatiquement le sentiment des commentaires YouTube : extension Chrome, API FastAPI, modele scikit-learn, deploiement cloud via Docker sur GitHub Codespaces.

TP3 - Projet ML Complet - Marouan Ezbakhe - Filiere INDIA, ENSAM Rabat - Prof. Maria Zemzami

## Description du projet

Les createurs de contenu YouTube recoivent des centaines de commentaires par video, trop nombreux pour etre analyses manuellement. Ce projet automatise l'analyse de sentiment :

1. L'utilisateur ouvre une video YouTube
2. L'extension Chrome extrait les commentaires visibles
3. Les commentaires sont envoyes par batch a une API cloud
4. Un modele TF-IDF + Logistic Regression predit le sentiment (positif / neutre / negatif)
5. L'extension affiche les resultats : statistiques globales, onglets de filtre, liste des commentaires par categorie, bouton de copie des resultats et mode sombre/clair

## Architecture technique

| Composant | Technologie |
|---|---|
| Frontend | Extension Chrome (Manifest V3, JavaScript, HTML, CSS) |
| Backend | API REST FastAPI |
| ML Engine | scikit-learn (TF-IDF + Logistic Regression) |
| Deploiement | Docker, execute dans un GitHub Codespace |
| Version control | Git + GitHub |

```
chrome-extension/        extension Chrome (manifest, popup, content script)
  manifest.json
  popup.html / popup.css / popup.js
  content.js
data/
  raw/                   dataset brut telecharge (reddit.csv)
  processed/              train.csv / test.csv apres nettoyage
models/                   modele + vectoriseur entraines (.joblib)
src/
  data/                   scripts de telechargement et nettoyage
    download.py
    clean.py
  models/
    train.py              entrainement TF-IDF + Logistic Regression
  api/
    main.py                application FastAPI
tests/
  test_model.py            tests du modele (accuracy, cas limites, temps d'inference)
  test_api.py               tests de l'API (endpoints, erreurs, temps de reponse)
Dockerfile
requirements.txt
```

## Resultats du modele

- Accuracy sur le test set : **87%** (critere minimal : 80%)
- F1-score par classe : 0.80 (negatif) / 0.91 (neutre) / 0.88 (positif)
- Dataset : 37 249 commentaires Reddit labelises (positif/neutre/negatif), split 80/20 stratifie

## Installation et utilisation

### Pre-requis

- Python 3.10+
- Google Chrome
- Docker (pour le deploiement)
- Un compte GitHub (pour Codespaces)

### 1. Cloner le repo et installer les dependances

```bash
git clone https://github.com/Marouan333/youtube-sentiment-api.git
cd youtube-sentiment-api
pip install -r requirements.txt
```

### 2. Reproduire le pipeline de donnees et d'entrainement

```bash
python src/data/download.py
python src/data/clean.py
python src/models/train.py
```

### 3. Lancer l'API en local

```bash
uvicorn src.api.main:app --port 8000
```

Teste avec :

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/predict_batch -H "Content-Type: application/json" -d '{"comments":["i love this","this is bad"]}'
```

### 4. Deployer sur GitHub Codespaces

1. Sur la page GitHub du depot : **Code** -> onglet **Codespaces** -> **Create codespace on main**
2. Dans le terminal du Codespace :
   ```bash
   docker build -t youtube-sentiment-api .
   docker run -d -p 7860:7860 youtube-sentiment-api
   ```
3. Onglet **Ports** : clic droit sur le port 7860 -> **Port Visibility** -> **Public**
4. Copier l'URL publique (`https://<nom>-7860.app.github.dev`)

Attention : le Codespace s'arrete automatiquement apres ~30 minutes d'inactivite. Il faut le relancer et refaire `docker run` avant chaque demonstration.

### 5. Installer l'extension Chrome

1. Mettre a jour `API_URL` dans `chrome-extension/popup.js` avec l'URL de production
2. Ouvrir `chrome://extensions`
3. Activer le **Mode developpeur**
4. Cliquer **Charger l'extension non empaquetee**
5. Selectionner le dossier `chrome-extension/`

### 6. Utiliser l'extension

1. Ouvrir une video YouTube et faire defiler jusqu'aux commentaires (pour qu'ils se chargent)
2. Cliquer sur l'icone de l'extension dans la barre d'outils
3. Cliquer **Analyser les commentaires**
4. Consulter les statistiques en haut, puis filtrer par onglet (Tous / Positif / Neutre / Negatif)
5. Bouton &#9789; en haut a droite : bascule mode sombre/clair (preference sauvegardee via `chrome.storage`)
6. Bouton &#128203; a cote d'Analyser : copie les resultats (stats + liste des commentaires avec leur sentiment) dans le presse-papiers

## Documentation API

### `GET /health`

Verifie que l'API et le modele sont charges.

```json
{"status": "ok"}
```

### `POST /predict_batch`

Analyse un batch de commentaires.

Requete :

```json
{"comments": ["this video is great", "i did not like it"]}
```

Reponse :

```json
{
  "predictions": [1, -1],
  "stats": {"positive": 1, "neutral": 0, "negative": 1}
}
```

Labels : `1` = positif, `0` = neutre, `-1` = negatif.

## Tests

```bash
pytest tests/ -v
```

12 tests couvrant : accuracy du modele, cas limites (texte vide, tres long, emojis, langues melangees), temps d'inference, endpoints `/health` et `/predict_batch`, gestion d'erreurs (batch vide, payload invalide), temps de reponse.

## Difficultes rencontrees

- **Hugging Face Spaces** exige desormais un abonnement payant pour heberger un Space Docker -> bascule sur **GitHub Codespaces**, gratuit et sans carte bancaire
- **Shadow DOM** de YouTube : l'extraction des commentaires via `querySelectorAll` classique ne fonctionnait pas car les commentaires sont dans des composants avec Shadow DOM -> traversee recursive du Shadow DOM
- **Messaging Chrome Extension** : l'envoi de message a un content script injecte avant le chargement de l'extension echouait (`Could not establish connection`) -> injection directe d'une fonction d'extraction via `chrome.scripting.executeScript`
- **Batch vide** : le vectoriseur TF-IDF plantait sur une liste vide -> cas special gere explicitement dans l'API

## Ameliorations futures possibles

- Ajouter un score de confiance par prediction (proba du modele, pas seulement la classe)
- Gerer les reponses (threads) de commentaires separement des commentaires racine
- Export des resultats en fichier (CSV/JSON), au-dela de la copie presse-papiers actuelle
- Remplacer Codespaces (ephemere) par un hebergement PaaS permanent (Render, Railway) pour une URL stable
