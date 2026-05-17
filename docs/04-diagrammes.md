# 04. Diagrammes et Cinématiques (Mis à Jour)

Pour bien comprendre comment les fichiers interagissent et comment les requêtes circulent à travers l'application avec nos nouvelles mesures de protection (IP Rate Limiting, Account Lockout et Sliding Session), voici trois diagrammes mis à jour modélisant précisément les flux de sécurité et les états du système.

---

## 1. Diagramme de Flux (Flowchart)

Ce diagramme montre le cheminement d'une requête HTTP arrivant sur le serveur. Il met en évidence les interceptions par l'IP Rate Limiter au niveau réseau, le verrouillage de compte en base de données, et la rotation de jeton à mi-parcours de la session.

```mermaid
flowchart TD
    A["Client lance une requête HTTP"] --> B{"Vérifier la Route demandée"}
    
    %% Routes Publiques %%
    B -->|Route Publique : /, /signin, /signup, /logout| C{"Est-ce un POST /signin ou /signup ?"}
    C -->|Oui| C1{"Interception par le Rate Limiter"}
    C1 -->|IP Bloquée (requêtes > 20 en 15m)| C2["Retourner HTTP 429 : Trop de requêtes"]
    C1 -->|IP Autorisée| D1["Appel du contrôleur UserController"]
    C -->|Non| D1
    
    D1 --> D["Rendu de la vue Pug ou Redirection"]
    D --> E["Réponse HTML/HTTP envoyée au Client"]
    C2 --> E
    
    %% Routes Protégées %%
    B -->|Route Protégée : /profile/:id| F["Interception par le Middleware : check.authenticated"]
    F --> G{"Le cookie 'access_token' existe ?"}
    
    G -->|Non| H["Retourner HTTP 401 : Token manquant"]
    H --> E
    
    G -->|Oui| I{"Décoder & Vérifier la signature du JWT avec la clé secrète"}
    I -->|Signature Invalide ou Expire| J["Retourner HTTP 401 : Session expirée ou token invalide"]
    J --> E
    
    I -->|Signature Valide| K{"Vérifier la validité restante du JWT"}
    K -->|"> 50% du temps écoulé (> 30 min)"| K1["Générer un nouveau JWT (Sliding Session) & Réémettre le cookie"]
    K -->|"< 50% du temps écoulé"| K2["Continuer sans modification"]
    
    K1 --> L["Injecter les infos dans req.user & rafraîchir cookie userID"]
    K2 --> L
    
    L --> M["Appel du contrôleur UserController.getProfile"]
    M --> N["Rendu de la vue profile.pug avec email & id"]
    N --> E
```

---

## 2. Diagramme de Séquence : Connexion Secouée, Verrouillage & Rotation

Ce diagramme modélise l'échange de messages dans le temps entre tous les participants, illustrant :
- Le filtrage par le Rate Limiter réseau.
- L'incrémentation des tentatives et le verrouillage Mongoose en cas d'erreurs répétées.
- Le renouvellement automatique du jeton par le middleware (Sliding Session).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Navigateur)
    participant Limiter as Rate Limiter (express-rate-limit)
    participant Routeur as Router (api.routes.js)
    participant Middleware as Middleware (authenticated.js)
    participant Ctrl as Controller (UserController.js)
    participant DB as Database (UserModel.js)

    %% PHASE 1: CONNEXION %%
    Note over Client, DB: Phase 1 : Authentification de l'utilisateur (Connexion)
    Client->>Routeur: Requête POST /api/v1/signin (email, mot de passe)
    Routeur->>Limiter: Interception réseau (adresse IP)
    alt Limite IP dépassée (> 20 requêtes en 15m)
        Limiter-->>Client: Rejet HTTP 429 (Affichage de l'alerte sur la vue signin)
    else Limite IP respectée
        Limiter->>Ctrl: Appel de postSignIn(req, res)
        Ctrl->>DB: Rechercher l'utilisateur : findOne({ email })
        DB-->>Ctrl: Retourne l'utilisateur (avec loginAttempts, lockUntil, password)
        alt Compte verrouillé (lockUntil > Date.now())
            Ctrl-->>Client: Rejet HTTP 403 (Compte bloqué temporairement)
        else Compte déverrouillé
            Ctrl->>Ctrl: Comparer les mots de passe (bcrypt.compare)
            alt Mot de passe incorrect
                Ctrl->>DB: Incrémenter les tentatives (incLoginAttempts)
                DB-->>Ctrl: Enregistrement effectué
                Ctrl-->>Client: Rejet HTTP 401 (Mot de passe incorrect + tentatives/5)
            else Mot de passe correct
                Ctrl->>DB: Réinitialiser les tentatives (resetAttempts)
                DB-->>Ctrl: Enregistrement effectué
                Ctrl->>Ctrl: Signer un JWT (jwt.sign) avec la clé secrète (expire dans 1h)
                Ctrl-->>Client: Définir Cookie access_token blindé & Rediriger vers /profile/:id
            end
        end
    end

    %% PHASE 2: ACCÈS PROFIL & ROTATION %%
    Note over Client, DB: Phase 2 : Accès à la ressource protégée & Rotation
    Client->>Routeur: Requête GET /api/v1/profile/:id (Cookie 'access_token' joint)
    Routeur->>Middleware: Appel de check.authenticated(req, res, next)
    Note over Middleware: Extraction & vérification du JWT
    Middleware->>Middleware: jwt.verify(token, JWT_SECRET)
    alt Signature invalide ou expirée
        Middleware-->>Client: Rejet HTTP 401 (Redirection ou JSON d'erreur)
    else Signature valide
        Note over Middleware: Analyse de la validité restante (iat et exp)
        alt Plus de 50% du temps écoulé (> 30 minutes)
            Middleware->>Middleware: Signer un nouveau JWT (durée 1h)
            Middleware->>Client: Déposer le cookie 'access_token' mis à jour (Rotation)
        end
        Middleware->>Middleware: Injecter décodé dans req.user & rafraîchir cookie userID
        Middleware->>Ctrl: next() -> Appel de getProfile(req, res)
        Ctrl-->>Client: Rendu de profile.pug (HTML dynamique avec email & id)
    end
```

---

## 3. Diagramme d'État : Cycle de vie de la Session

Ce schéma intègre le nouvel état de **Compte Verrouillé (Lockout)** suite aux échecs successifs de mot de passe, ainsi que la prolongation dynamique.

```mermaid
stateDiagram-v2
    [*] --> VisiteurAnonyme : Arrivée sur le site

    state VisiteurAnonyme {
        [*] --> AccueilPublic
        AccueilPublic --> SignupForm : Clic sur Inscription
        SignupForm --> SigninForm : Inscription réussie (Redirection)
        AccueilPublic --> SigninForm : Clic sur Connexion
    }

    VisiteurAnonyme --> CompteVerrouille : Connexion échouée 5 fois consécutives (lockUntil)
    CompteVerrouille --> VisiteurAnonyme : Libération automatique après 15 minutes
    
    VisiteurAnonyme --> ClientAuthentifie : Connexion réussie (POST /signin avec mot de passe valide)
    
    state ClientAuthentifie {
        [*] --> ProfilPrive : Génération & Stockage du Cookie JWT
        ProfilPrive --> ProfilPrive : Navigation active (Prolongation transparente par Rotation)
    }

    ClientAuthentifie --> VisiteurAnonyme : Déconnexion volontaire (GET /logout -> suppression des cookies)
    ClientAuthentifie --> VisiteurAnonyme : Expiration de session (Inactivité prolongée > 1h)
```

