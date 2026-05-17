# 05. Guide de Reproduction sans Stress

Ce guide vous accompagne pas-à-pas pour recréer ou déployer ce projet chez vous, de manière totalement sécurisée et sereine. Suivez chaque étape avec attention !

---

## 🛠️ Étape 1 : Prérequis système
Avant de démarrer, assurez-vous d'avoir installé sur votre ordinateur :
- **Node.js** (Version 18 ou supérieure recommandée)
- Un terminal (PowerShell, Bash, Git Bash ou CMD)
- Un éditeur de code (VS Code est idéal)
- Un compte gratuit sur **MongoDB Atlas** (pour héberger votre base de données dans le cloud)

---

## 🗄️ Étape 2 : Configuration de MongoDB Atlas (Cloud)
Pour que l'application puisse stocker les utilisateurs :
1. Connectez-vous sur votre console **MongoDB Atlas**.
2. Créez un nouveau cluster gratuit (Shared Cluster).
3. Dans l'onglet **Database Access**, créez un utilisateur de base de données :
   - Choisissez un nom d'utilisateur (ex: `admin_jwt`).
   - Générez un mot de passe sécurisé et notez-le.
   - Accordez-lui les droits de lecture/écriture (`Read and write to any database`).
4. Dans l'onglet **Network Access**, cliquez sur **Add IP Address** :
   - Ajoutez votre adresse IP actuelle ou choisissez d'autoriser l'accès depuis n'importe où (`0.0.0.0/0`) si vous êtes en phase d'apprentissage.
5. Dans l'onglet **Database** (ou Clusters), cliquez sur **Connect** ➔ **Drivers** (Node.js) :
   - Récupérez votre chaîne de connexion SRV. Elle ressemble à ceci :
     `mongodb+srv://<username>:<password>@<cluster-name>.d51otgm.mongodb.net/?retryWrites=true&w=majority`
   - Isolez les différentes parties de cette chaîne pour les reporter dans votre fichier d'environnement.

---

## ⚙️ Étape 3 : Fichier d'environnement `.env`
À la racine de votre projet, créez un fichier nommé **`.env`** (à partir du modèle `.env.sample`) et complétez les informations isolées à l'étape précédente.

```ini
# --- CONFIGURATION MONGODB ATLAS ---
MONGODB_PSEUDO=votre_pseudo_db         # Remplacer par le nom d'utilisateur DB Atlas
MONGODB_PASSWORD=votre_mot_de_passe   # Remplacer par le mot de passe généré
MONGODB_CLIENT_NAME=votre_cluster     # Exemple : cluster0 (identifiant unique dans votre SRV)
MONGODB_DATABASE_NAME=jwt-essai       # Nom de la BDD de votre choix (sera créée automatiquement)
MONGODB_USER_COLLECTION_NAME=users    # Nom de la collection Mongoose qui stockera les utilisateurs

# --- CONFIGURATION DES SECRETS ---
# Générez une clé secrète robuste et unique (ex: une longue chaîne de caractères aléatoires)
JWT_SECRET=super_secret_jwt_random_key_123456!

# Facteur de salage Bcrypt (10 est la valeur par défaut recommandée en termes de sécurité/vitesse)
BCRYPT_SALT_ROUNDS=10
```

> [!IMPORTANT]
> Ne poussez JAMAIS votre fichier `.env` sur Git ! Vérifiez que `.env` est bien mentionné dans votre fichier `.gitignore` à la racine.

---

## 📦 Étape 4 : Installation des Dépendances
Dans votre terminal, placez-vous à la racine du projet et exécutez la commande suivante pour installer proprement tous les packages listés dans `package.json` :

```bash
npm install
```

Cette commande va créer le dossier `node_modules` et verrouiller les versions exactes installées dans `package-lock.json`.

---

## 🚀 Étape 5 : Lancement et Tests de Validation

### A. Démarrer le serveur local en mode développement
Exécutez le script prédéfini qui utilise `nodemon` pour relancer automatiquement le serveur à chaque modification :

```bash
npm run start
```

Si tout est correctement configuré, vous devez voir apparaître ces messages dans votre console :
```text
[nodemon] starting `node app.js`
Connexion réussie à la base de données MongoDB !
Serveur démarré sur cette url: http://localhost:3000
```

---

## 🔍 Étape 6 : Validation Fonctionnelle
Ouvrez votre navigateur sur `http://localhost:3000` et testez la cinématique pas-à-pas :

1. **Inscription** :
   - Cliquez sur "Inscription" (`/api/v1/signup`).
   - Saisissez un email et un mot de passe, puis validez.
   - Vous devez être redirigé vers la page de connexion.
   - **Vérification BDD** : Allez sur MongoDB Atlas. Dans *Browse Collections*, vérifiez que votre collection `users` contient bien un nouveau document avec l'email et un mot de passe haché sous la forme `$2b$10$...`.

2. **Connexion** :
   - Cliquez sur "Connexion" (`/api/v1/signin`).
   - Saisissez l'email et le mot de passe créés.
   - Vous devez être redirigé vers votre profil privé (`/api/v1/profile/id_utilisateur`).
   - **Vérification Cookies** : Dans l'inspecteur du navigateur (F12) ➔ onglet *Application* (ou *Stockage*) ➔ *Cookies*, vous devez voir deux cookies :
     - `access_token` : Le JWT signé (cryptographié).
     - `userID` : L'identifiant de l'utilisateur.

3. **Accès et Déconnexion** :
   - Tentez d'accéder directement à la page de profil sans cookie dans un autre onglet en navigation privée : le serveur doit vous rejeter avec une erreur 401.
   - Sur votre profil connecté, cliquez sur "Se déconnecter". Les cookies sont supprimés et vous êtes redirigé en toute sécurité vers l'accueil.
