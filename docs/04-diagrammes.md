# 04. Diagrammes et Cinématiques

Pour bien comprendre comment les fichiers interagissent et comment les requêtes circulent à travers l'application, voici trois diagrammes modélisant précisément les flux d'exécution et les états du système.

---

## 1. Diagramme de Flux (Flowchart)

Ce diagramme montre le cheminement d'une requête HTTP arrivant sur le serveur. Il met en évidence le filtrage effectué par le middleware de sécurité pour rejeter ou valider les accès.

```mermaid
flowchart TD
    A[Client lance une requête HTTP] --> B{Vérifier la Route demandée}
    
    %% Routes Publiques %%
    B -->|Route Publique : /, /signin, /signup, /logout| C[Appel direct du contrôleur UserController]
    C --> D[Rendu de la vue Pug correspondante ou Redirection]
    D --> E[Réponse HTML/HTTP envoyée au Client]
    
    %% Routes Protégées %%
    B -->|Route Protégée : /profile/:id| F[Interception par le Middleware : check.authenticated]
    F --> G{Le cookie 'access_token' existe ?}
    
    G -->|Non| H[Retourner HTTP 401 : Token manquant]
    H --> E
    
    G -->|Oui| I{Décoder & Vérifier la signature du JWT avec la clé secrète}
    I -->|Signature Invalide ou Expire| J[Retourner HTTP 401 : Session expirée ou token invalide]
    J --> E
    
    I -->|Signature Valide| K[Injecter les infos dans req.user & rafraîchir le cookie userID]
    K --> L[Appel du contrôleur UserController.getProfile]
    L --> M[Rendu de la vue Pug profile.pug avec les données injectées]
    M --> E
```

---

## 2. Diagramme de Séquence : Connexion & Accès Profil

Ce diagramme modélise l'échange de messages et d'informations dans le temps entre le Navigateur (Client), le Routeur, le Middleware, le Contrôleur et la Base de données Mongoose lors d'une connexion réussie suivie de l'accès à la page privée.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Navigateur)
    participant Routeur as Router (api.routes.js)
    participant Middleware as Middleware (authenticated.js)
    participant Ctrl as Controller (UserController.js)
    participant DB as Database (UserModel.js)

    %% PHASE 1: CONNEXION %%
    Note over Client, DB: Phase 1 : Authentification de l'utilisateur (Connexion)
    Client->>Routeur: Requête POST /api/v1/signin (email, mot de passe)
    Routeur->>Ctrl: Appel de postSignIn(req, res)
    Ctrl->>DB: Rechercher l'utilisateur : findOne({ email })
    DB-->>Ctrl: Retourne l'utilisateur (avec hash du mot de passe)
    Ctrl->>Ctrl: Comparer les mots de passe (bcrypt.compare)
    Note over Ctrl: Correspondance validée !
    Ctrl->>Ctrl: Signer un JWT (jwt.sign) avec la clé secrète
    Ctrl-->>Client: Définir le Cookie 'access_token' & Redirection vers /profile/:id

    %% PHASE 2: ACCÈS PROFIL %%
    Note over Client, DB: Phase 2 : Accès à la ressource protégée
    Client->>Routeur: Requête GET /api/v1/profile/:id (Cookie 'access_token' joint automatiquement)
    Routeur->>Middleware: Appel de check.authenticated(req, res, next)
    Note over Middleware: Extraction & vérification du JWT
    Middleware->>Middleware: jwt.verify(token, JWT_SECRET)
    Note over Middleware: Signature valide !
    Middleware->>Middleware: Injecter décodé dans req.user & créer cookie userID
    Middleware->>Ctrl: next() -> Appel de getProfile(req, res)
    Ctrl-->>Client: Rendu de profile.pug (HTML dynamique avec email & id)
```

---

## 3. Diagramme d'État : Cycle de vie de la Session

Ce schéma modélise les différents états de navigation et de session dans lesquels un visiteur peut se trouver, et les transitions associées aux actions utilisateur ou d'expiration de session.

```mermaid
stateDiagram-v2
    [*] --> VisiteurAnonyme : Arrivée sur le site

    state VisiteurAnonyme {
        [*] --> AccueilPublic
        AccueilPublic --> SignupForm : Clic sur Inscription
        SignupForm --> SigninForm : Inscription réussie (Redirection)
        AccueilPublic --> SigninForm : Clic sur Connexion
    }

    VisiteurAnonyme --> ClientAuthentifie : Connexion réussie (POST /signin avec mot de passe valide)
    
    state ClientAuthentifie {
        [*] --> ProfilPrive : Génération & Stockage du Cookie JWT
        ProfilPrive --> ProfilPrive : Rafraîchissement / Navigation active
    }

    ClientAuthentifie --> VisiteurAnonyme : Déconnexion volontaire (GET /logout -> suppression des cookies)
    ClientAuthentifie --> VisiteurAnonyme : Expiration de session (Vérification JWT échoue après 1h)
```
