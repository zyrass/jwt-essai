# 02. Architecture & Ordre de Création

Pour reproduire un projet d'authentification robuste de manière sécurisée et sans stress, il est crucial de comprendre la cartographie des composants et de suivre un ordre de développement logique. Cette méthode permet de tester chaque brique de façon unitaire et incrémentale.

---

## 🗺️ Cartographie Structurée du Projet

Voici l'organisation du projet avec le rôle précis de chaque répertoire :

```text
jwt-essai/
├── .env.sample                 # Modèle de configuration des variables d'environnement (Bases de données, Secrets, Sels)
├── .gitignore                  # Fichier d'exclusion Git pour éviter de pousser les secrets et dépendances en ligne
├── app.js                      # Point d'entrée principal (Configuration du serveur Express, Middlewares et Démarrage)
├── package.json                # Fiche d'identité du projet (Dépendances système, scripts et métadonnées)
├── database/
│   └── db.js                   # Gestionnaire de connexion asynchrone Mongoose vers MongoDB Atlas
├── models/
│   └── UserModel.js            # Définition du schéma de données utilisateur (Champs, Contraintes Mongoose)
├── controllers/
│   └── UserController.js       # Logique métier (Formulaires, Hachage Bcrypt, Génération JWT, Cookies, Redirections)
├── router/
│   └── api.routes.js           # Déclaration des endpoints d'API (Mapping des méthodes HTTP et protection des routes)
├── utils/
│   └── jwt/
│       └── authenticated.js    # Middleware de sécurité interceptant les requêtes et vérifiant les signatures JWT
└── views/                      # Répertoire des gabarits (Pug) générant les rendus HTML côté serveur
    ├── index.pug               # Page d'accueil publique
    ├── signin.pug              # Formulaire de connexion
    ├── signup.pug              # Formulaire d'inscription
    └── profile.pug             # Page de profil sécurisée (privée)
```

---

## 🛠️ Chronologie Pédagogique de Création

Lors de la reproduction du projet, **ne créez pas tout en même temps**. Suivez cette séquence ordonnée :

### Étape 1 : Initialisation & Dépendances
1. **`package.json`** : Initialiser le projet Node.js (`npm init -y`) et y déclarer l'ensemble des dépendances nécessaires. C'est le contrat de base.
2. **`.gitignore`** & **`.env.sample`** : Définir immédiatement les règles d'exclusion Git et documenter les variables d'environnement requises avant d'écrire la moindre ligne de code.

### Étape 2 : Connectivité & Base de Données
3. **`database/db.js`** : Configurer la connexion avec MongoDB Atlas en utilisant les variables d'environnement. Cela permet de valider instantanément la communication avec le serveur de données au lancement.
4. **`models/UserModel.js`** : Définir la structure de la table utilisateur. Le modèle doit inclure les contraintes d'unicité sur l'adresse email et l'activation des `timestamps` pour historiser les créations.

### Étape 3 : Squelette du Serveur
5. **`app.js`** : Créer le fichier d'entrée de l'Express, y configurer les middlewares d'analyse (`express.json()`, `express.urlencoded()`, `cookieParser()`) et le moteur de template `Pug`. Lancer le serveur local pour vérifier le bon démarrage général.

### Étape 4 : Gabarits Graphiques (Front-End)
6. **`views/` (`index.pug`, `signup.pug`, `signin.pug`, `profile.pug`)** : Écrire les interfaces utilisateurs minimales nécessaires pour soumettre les requêtes d'inscription, de connexion et afficher les profils.

### Étape 5 : Logique Métier & Contrôleurs
7. **`controllers/UserController.js`** : Implémenter en premier lieu l'action d'inscription (`postSignUp`) avec le salage/hachage `bcrypt` et l'enregistrement BDD. Tester l'inscription en vérifiant que le compte apparaît haché dans MongoDB Atlas.
8. Implémenter ensuite l'action de connexion (`postSignIn`) pour vérifier le mot de passe, générer le token JWT via `jwt.sign()` et le placer dans les cookies.

### Étape 6 : Interception de Sécurité (Middleware)
9. **`utils/jwt/authenticated.js`** : Coder le middleware d'interception. Il doit pouvoir intercepter n'importe quelle requête, lire le cookie de session, vérifier la signature cryptographique du JWT et bloquer les intrus avec un code 401.

### Étape 7 : Routage & Finalisation
10. **`router/api.routes.js`** : Brancher tous les points d'entrée sur les fonctions correspondantes du contrôleur. Protéger explicitement la route `/profile/:id` en insérant le middleware `check.authenticated` en paramètre d'interception.
11. Raccorder ce routeur à **`app.js`** sous le préfixe `/api/v1`. L'application est alors 100% fonctionnelle !

---

## 💎 Importance de Chaque Fichier

- **`app.js` (L'Animateur)** : Sans lui, l'application n'existe pas. Il orchestre l'arrivée des requêtes, applique les middlewares généraux de parsing, et lance le port d'écoute réseau.
- **`db.js` (La Passerelle)** : Assure la liaison vitale et sécurisée entre le code JS et MongoDB Atlas.
- **`UserModel.js` (Le Gardien de Données)** : Définit et valide la structure des comptes utilisateurs. C'est lui qui rejette une inscription si l'email n'a pas un format valide ou s'il est déjà pris.
- **`UserController.js` (Le Cerveau)** : Contient l'intelligence métier. C'est ici que s'effectue la transition délicate entre un mot de passe en clair et un mot de passe cryptographié, ainsi que la signature numérique d'identification.
- **`authenticated.js` (La Sentinelle)** : Le fichier le plus sensible du point de vue de la sécurité d'accès. Il contrôle chaque entrée de profil et garantit qu'aucun utilisateur non authentifié ne puisse accéder aux données personnelles.
- **`api.routes.js` (L'Aiguilleur)** : Documente l'API en liant chaque requête URL à son action respective.
