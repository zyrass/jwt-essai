# 📊 Audit de Sécurité et Code : jwt-essai

Voici une évaluation technique transparente, honnête et approfondie du projet **jwt-essai**. Cet audit analyse la qualité du code, la robustesse de l'architecture, la maturité en cybersécurité et la conformité aux standards de production.

---

## 🏆 Note Globale : 16 / 20 (Excellent Modèle Pédagogique)

Le projet est d'une grande clarté. C'est un excellent socle académique et technique pour appréhender l'authentification par cookies. Pour atteindre une qualité de production industrielle (grade A+), quelques ajustements de sécurité et de robustesse sont recommandés.

---

## 📊 Grille d'Évaluation Détaillée

| Critère | Note | Appréciation Technique |
| :--- | :---: | :--- |
| **Structure & Architecture (MVC)** | **17/20** | Excellent découpage. La séparation des modèles, contrôleurs, routeurs et vues respecte parfaitement le patron MVC classique de Node.js. |
| **Sécurité Théorique (Bcrypt & JWT)** | **18/20** | Implémentation impeccable du hachage de mot de passe unilatéral (Bcrypt à 10 rounds) et de la signature JWT asymétrique (expiration d'1 heure). |
| **Sécurité Pratique (Transport Cookies)** | **12/20** | **Point faible à corriger**. Le token JWT est stocké dans un cookie standard, mais le code ne verrouille pas les options fondamentales (`httpOnly`, `secure`, `sameSite`). |
| **Robustesse & Gestion des Erreurs** | **15/20** | Code asynchrone propre. Les validations Mongoose (unique, lowercase) sont excellentes. Cependant, l'absence de `try/catch` global dans les contrôleurs peut entraîner des plantages non gérés si la BDD est indisponible. |
| **Documentation & Hygiène Git** | **20/20** | Niveau de référence. Documentation complète (Mermaid, reproduction sans stress, ordre des fichiers), commits structurés en Conventional Commits et hygiène de branches parfaite. |

---

## 🛡️ Audit de Cybersécurité : Forces et Vulnérabilités

### 🟢 Les Forces (Points Forts)
1. **Hachage Bcrypt Asynchrone** : L'utilisation de `await bcrypt.hash(password, 10)` garantit que le mot de passe est salé de manière unique et que le serveur ne bloque pas sa boucle d'événements (Event Loop) pendant le calcul du hachage.
2. **Comparaison Sécurisée** : L'utilisation de `await bcrypt.compare(password, user.password)` immunise l'application contre les attaques par canal auxiliaire basées sur le temps (Time Attacks).
3. **Payload JWT Léger** : Le payload du token ne transporte que les affirmations minimales (`_id`, `email`). Aucune information confidentielle (comme le hash de mot de passe) n'y est exposée, ce qui est conforme au principe du moindre privilège.

### 🔴 La Vulnérabilité Majeure : Options des Cookies
Dans [UserController.js](file:///g:/www/projects/js/jwt-essai/controllers/UserController.js) (l. 133) :
```javascript
res.cookie('access_token', tokenJWT)
```
> [!CAUTION]
> **VULNÉRABILITÉ CRITIQUE (XSS / Session Hijacking)** :
> Par défaut, sans options explicites, le cookie `access_token` est accessible en lecture par n'importe quel code JavaScript s'exécutant sur le client via `document.cookie`. Si un pirate réussit à injecter un script malveillant tiers (via une dépendance npm compromise ou une faille XSS sur le front), il pourra voler instantanément le token de votre utilisateur.

#### 💡 Correctif Recommandé :
Modifier l'envoi du cookie pour y ajouter des attributs de sécurité indispensables :
```javascript
res.cookie('access_token', tokenJWT, {
    httpOnly: true,                         // Interdit l'accès au cookie via JavaScript (neutralise XSS)
    secure: process.env.NODE_ENV === 'production', // Transmet uniquement le cookie sur des connexions HTTPS chiffrées
    sameSite: 'strict',                     // Protège contre les attaques Cross-Site Request Forgery (CSRF)
    maxAge: 3600000                         // Durée de vie d'une heure en millisecondes
})
```

---

## 💻 Qualité du Code et Résilience

### 1. Robustesse au Démarrage
*Nous avons déjà corrigé un point de fragilité dans cet audit :* initialement, sans fichier `.env` configuré avec exactitude, l'application levait une exception fatale Mongoose non gérée qui coupait instantanément le serveur. L'introduction d'un nom de modèle par défaut (`'User'`) dans [UserModel.js](file:///g:/www/projects/js/jwt-essai/models/UserModel.js) a résolu ce problème de démarrage.

### 2. Gestion des Rejets Asynchrones (Unhandled Rejections)
Dans [UserController.js](file:///g:/www/projects/js/jwt-essai/controllers/UserController.js), les fonctions comme `postSignUp` ou `postSignIn` effectuent des opérations asynchrones sur la base de données sans être enveloppées dans un bloc `try/catch`. 
Si MongoDB Atlas subit une micro-coupure réseau à ce moment-là :
- Le serveur lèvera une erreur `UnhandledPromiseRejection`.
- Sous Node.js moderne, cela peut provoquer un arrêt brutal du processus serveur.

#### 💡 Correctif Recommandé :
Envelopper le code des contrôleurs asynchrones dans des blocs `try/catch` classiques ou utiliser un middleware express d'assistance comme `express-async-errors`.
*Exemple dans `postSignUp` :*
```javascript
const postSignUp = async (req, res, next) => {
    try {
        const { email, password } = req.body
        // ... logique métier ...
    } catch (error) {
        next(error) // Transmet l'erreur réseau au gestionnaire d'erreurs global d'Express
    }
}
```

---

## 📐 Architecture Générale

### Le choix de la structure `/api/v1` pour du SSR (Server-Side Rendering)
Le projet utilise le préfixe `/api/v1` (géré par [api.routes.js](file:///g:/www/projects/js/jwt-essai/router/api.routes.js)) pour toutes ses routes, y compris celles qui font le rendu de formulaires HTML via Pug (`res.render('signup')`).

- **D'un côté**, c'est une excellente habitude pour versionner des points d'accès API.
- **D'un autre côté**, les routes servant du HTML (Front) et les endpoints d'API de données (Back) se retrouvent mélangées sous le même préfixe `/api/v1`. 

*Dans une architecture industrielle plus classique :*
- Les pages web (rendus Pug) sont servies sur des routes directes (`/`, `/signin`, `/signup`).
- Seules les actions de données pures (JSON) ou les appels asynchrones en arrière-plan transitent par le préfixe `/api/v1/...`.
