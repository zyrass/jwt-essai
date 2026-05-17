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

## 🍪 3. Stockage Sécurisé : Les Cookies HTTP-Only

Beaucoup d'applications stockent leur JWT dans le `localStorage` du navigateur du client. C'est une vulnérabilité majeure : n'importe quel script JavaScript s'exécutant sur votre page (via des extensions de navigateur compromises ou des failles XSS) peut lire le `localStorage` et voler le token utilisateur.

### La parade des Cookies sécurisés
Dans ce projet, le JWT est stocké dans un cookie nommé `access_token`.
Pour garantir une sécurité de niveau production, les options suivantes doivent être idéalement activées sur le cookie lors de l'appel à `res.cookie()` :

| Paramètre | Rôle de Sécurité |
| :--- | :--- |
| **`httpOnly: true`** | **Indispensable**. Empêche tout code JavaScript côté client de lire le cookie (immunise contre le vol de session par faille XSS). |
| **`secure: true`** | Force le navigateur à envoyer le cookie uniquement via des connexions sécurisées cryptées en **HTTPS**. (À activer en production). |
| **`sameSite: 'strict'`** | Protège l'utilisateur contre les attaques de type CSRF (Cross-Site Request Forgery) en empêchant l'envoi du cookie lors de requêtes initiées par des sites tiers. |

---

## ⚙️ 4. Isolation de la Configuration : `.env`

Toutes les informations hautement sensibles d'une application de production (identifiants de bases de données, clés secrètes JWT, etc.) doivent être **déconnectées du code source**.

### Pourquoi utiliser `.env` ?
1. **Sécurité** : Évite de pousser par mégarde des secrets d'infrastructure sur des dépôts Git publics (comme GitHub).
2. **Souplesse** : Permet de modifier le comportement de l'application sans toucher au code (changement de mot de passe, de port ou de base de données).

Le fichier `.env` est ajouté à votre `.gitignore` afin de ne jamais être poussé en ligne. Le fichier `.env.sample` sert de modèle vide pour les autres développeurs pour leur permettre de configurer leur environnement local en toute sécurité.
