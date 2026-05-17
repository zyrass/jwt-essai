# 03. Concepts de Sécurité & Configuration

La sécurité d'une application d'authentification repose sur des principes cryptographiques et d'isolation stricts. Ce document explique de manière claire les technologies employées dans ce projet et comment les configurer de façon sécurisée.

---

## 🔑 1. Hachage des Mots de Passe avec Bcrypt

### Pourquoi ne JAMAIS stocker un mot de passe en clair ?
Si un attaquant réussit à obtenir un accès en lecture à votre base de données (injection SQL, fuite de sauvegarde, etc.), stocker les mots de passe en texte brut compromettrait instantanément la totalité des comptes de vos utilisateurs.

### Le principe du Hachage à Sens Unique
Un algorithme de hachage prend une entrée de n'importe quelle taille (ex: `"MonMotDePasse123"`) et génère une empreinte numérique de taille fixe (ex: `$2b$10$R9h/cIPz...`). Ce processus est **unilatéral** (mathématiquement impossible à inverser).

### L'apport du "Sel" (Salting) avec Bcrypt
Si deux utilisateurs choisissent le même mot de passe (ex: `"123456"`), un algorithme de hachage standard générera le même résultat exact. Un attaquant possédant des bases d'empreintes précalculées (tables arc-en-ciel / *rainbow tables*) pourrait alors retrouver les mots de passe d'origine en quelques secondes.

**Bcrypt résout ce problème par le Salting :**
1. Bcrypt génère une chaîne aléatoire unique appelée **Sel** (Salt).
2. Il fusionne ce sel avec le mot de passe de l'utilisateur.
3. Il applique ensuite l'algorithme de hachage plusieurs fois de suite (le facteur de coût, réglé ici à `10`).
4. Le sel est inclus dans l'empreinte finale stockée. Lors de la connexion, Bcrypt extrait le sel de l'empreinte stockée, l'applique au mot de passe saisi et compare les empreintes.
*Chaque hachage est unique, même pour deux mots de passe identiques !*

---

## 🪙 2. Anatomie d'un JSON Web Token (JWT)

Un JWT est un jeton auto-contenu encodé sous forme de chaîne de caractères divisée en 3 parties distinctes séparées par des points (`.`):

`HEADER.PAYLOAD.SIGNATURE`

### A. Le Header (L'en-tête)
Il contient le type de jeton (`JWT`) et l'algorithme de signature utilisé pour le sécuriser (typiquement `HS256`).
*Exemple encodé en Base64Url :* `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### B. Le Payload (La charge utile)
Il contient les affirmations de confiance (*claims*) concernant l'utilisateur. C'est ici que nous stockons l'identifiant MongoDB de l'utilisateur (`_id`) et son adresse `email`.
> [!WARNING]
> Le payload est simplement encodé en Base64Url et non chiffré ! N'importe qui peut lire son contenu en le décodant. **N'y stockez jamais de données confidentielles** (comme les mots de passe).
*Exemple encodé en Base64Url :* `eyJfaWQiOiI2NTA5YSIsImVtYWlsIjoidGVzdEBtYWlsLmNvbSJ9`

### C. La Signature (Le garant de l'intégrité)
Pour créer la signature, l'en-tête encodé, le payload encodé et une **clé secrète** locale (connue uniquement de votre serveur) sont passés à l'algorithme spécifié dans le Header.
*Si un pirate tente d'altérer le Payload (par exemple, pour modifier l'ID utilisateur et usurper une identité), la signature ne correspondra plus à la clé secrète, et le serveur rejettera immédiatement le jeton comme invalide.*

---

## 🍪 3. Stockage Sécurisé : Les Cookies HTTP-Only (Implémenté)

Beaucoup d'applications stockent leur JWT dans le `localStorage` du navigateur du client. C'est une vulnérabilité majeure : n'importe quel script JavaScript s'exécutant sur votre page (via des extensions de navigateur compromises ou des failles XSS) peut lire le `localStorage` et voler le token utilisateur.

### Des Cookies durcis pour la sécurité
Dans ce projet, le JWT est stocké de manière imperméable dans un cookie nommé `access_token`. 
Lors de l'appel à `res.cookie()`, les options suivantes sont **intégrées et configurées de manière stricte** :

| Paramètre | Statut | Rôle de Sécurité |
| :--- | :---: | :--- |
| **`httpOnly: true`** | **Actif** | **Indispensable**. Empêche tout code JavaScript côté client de lire le cookie (immunise contre le vol de session par faille XSS). |
| **`secure: true`** | **Auto** | Force le navigateur à envoyer le cookie uniquement via des connexions sécurisées cryptées en **HTTPS** (activé automatiquement en production). |
| **`sameSite: 'strict'`** | **Actif** | Protège l'utilisateur contre les attaques de type CSRF (Cross-Site Request Forgery) en bloquant l'envoi du cookie lors de requêtes initiées par des sites tiers. |
| **`maxAge: 3600000`** | **Actif** | Limite la durée de vie du cookie à 1 heure (3600000 millisecondes) pour réduire la fenêtre d'exposition. |

---

## 🛡️ 4. Protection contre la Force Brute (Rate Limiting & Lockout)

Pour bloquer les attaques automatisées par dictionnaire et de brute-force, l'application dispose d'une double barrière défensive :

### A. Limiteur de Taux au niveau Réseau (IP Rate Limiting)
Grâce à `express-rate-limit`, chaque adresse IP cliente est limitée à un maximum de **20 requêtes par tranche de 15 minutes** sur les routes sensibles d'authentification (POST `/signup` et POST `/signin`).
- Si la limite est dépassée : l'IP est temporairement rejetée (HTTP 429).
- Pour une expérience utilisateur premium, le limiteur détecte si l'IP attend une page web (HTML) et renvoie le formulaire de connexion Pug enrichi d'un message d'alerte rouge, ou du JSON si c'est un client d'API REST.

### B. Verrouillage du Compte Applicatif (Account Lockout)
Au niveau de la base de données Mongoose ([UserModel.js](file:///g:/www/projects/js/jwt-essai/models/UserModel.js)), chaque compte utilisateur suit son état de connexion :
1. Chaque mot de passe incorrect incrémente un champ `loginAttempts`.
2. À la **5ème tentative infructueuse**, le compte est automatiquement verrouillé pendant **15 minutes** (la date est inscrite dans `lockUntil`).
3. Toute tentative de connexion subséquente (même avec le bon mot de passe !) est immédiatement avortée avec une erreur **HTTP 403**, en informant l'utilisateur du temps restant avant la libération du compte.
4. Une connexion réussie réinitialise immédiatement le compteur `loginAttempts` à 0.

---

## 🔄 5. Rotation Active du Token (Sliding Session JWT Rotation)

Pour allier sécurité maximale et expérience utilisateur fluide, le middleware de sécurité [authenticated.js](file:///g:/www/projects/js/jwt-essai/utils/jwt/authenticated.js) implémente une **rotation glissante de jeton**.

### Comment ça marche ?
1. Un jeton JWT a une durée de vie fixe d'une heure.
2. Lorsque l'utilisateur navigue sur son profil privé, le middleware examine le token.
3. Si plus de la moitié de sa durée de vie s'est écoulée (30 minutes écoulées sur 1 heure) :
   - Le serveur génère instantanément et de manière transparente un **nouveau JWT** prolongé d'une heure.
   - Ce nouveau JWT écrase l'ancien cookie `access_token` côté navigateur.
4. **Bénéfice** : Un utilisateur actif ne sera jamais déconnecté pendant qu'il travaille (sa session "glisse" et se prolonge d'elle-même), tandis qu'un utilisateur inactif sera déconnecté d'office après exactement 1 heure d'inactivité.

---

## ⚙️ 6. Isolation de la Configuration : `.env`

Toutes les informations hautement sensibles d'une application de production (identifiants de bases de données, clés secrètes JWT, etc.) doivent être **déconnectées du code source**.

Le fichier `.env` est ajouté à votre `.gitignore` afin de ne jamais être poussé en ligne. Le fichier `.env.sample` sert de modèle vide pour les autres développeurs pour leur permettre de configurer leur environnement local en toute sécurité.
