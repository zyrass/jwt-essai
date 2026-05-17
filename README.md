# 🍌 jwt-essai : Authentification JWT Robuste & Sécurisée

![Bannière Cyber-Banane JWT](docs/assets/jwt_banana_showcase.png)

> [!NOTE]
> **Attribution de l'illustration** : L'image de présentation ci-dessus combinant les concepts de cybersécurité JWT et une banane futuriste en 3D a été **générée avec l'intelligence artificielle Banana** (conformément aux directives créatives du projet).

---

## 📝 Présentation du Projet

**jwt-essai** est un projet d'apprentissage de référence démontrant l'implémentation de bout en bout d'un système d'authentification robuste et moderne. Développé en **Node.js** avec le framework **Express**, il intègre la persistance des données via **MongoDB** (grâce à **Mongoose**) et la gestion de sessions sécurisées sans état via les **JSON Web Tokens (JWT)**.

Ce projet met en pratique les règles fondamentales de la cybersécurité moderne, telles que le hachage sécurisé unilatéral avec **Bcrypt** et le stockage imperméable des jetons dans des cookies de session HTTP-Only.

---

## ⚡ Fonctionnalités Clés

- **Inscription Pédagogique** : Enregistrement robuste avec validation des adresses email et salage/hachage asynchrone des mots de passe avec `bcrypt`.
- **Authentification Stateless** : Connexion de l'utilisateur, vérification cryptographique et signature du token JWT.
- **Stockage Ultra-Sécurisé** : Jeton stocké dans un cookie de session client pour neutraliser les attaques de type injection de scripts (XSS).
- **Protection par Interception (Middleware)** : Filtrage automatisé des accès aux profils privés via un middleware d'analyse de validité du token.
- **Déconnexion Sécurisée** : Suppression propre et complète des cookies sur le navigateur client.

---

## 📂 Index de la Suite Documentaire (docs/)

Pour vous permettre d'appréhender le projet sans aucun stress et de le reproduire en toute sécurité, une suite documentaire complète et numérotée est disponible :

1. 🚀 **[01. Introduction Générale](docs/01-introduction.md)** : Objectifs du projet, contexte et enjeux d'une architecture sans état.
2. 🗺️ **[02. Architecture & Ordre de Création](docs/02-architecture-et-structure.md)** : Cartographie des répertoires, rôle de chaque composant et **ordre chronologique précis pour recréer le projet de A à Z**.
3. 🛡️ **[03. Concepts de Cybersécurité & Config](docs/03-securite-et-configuration.md)** : Mécanismes détaillés de Bcrypt (salage), structure interne des JWT, sécurité des cookies et isolation environnementale.
4. 📊 **[04. Diagrammes & Cinématiques](docs/04-diagrammes.md)** : Modélisation visuelle avec diagrammes **Mermaid** (Diagramme de Séquence, Diagramme de Flux / Flowchart et Diagramme d'État).
5. 🏁 **[05. Guide de Reproduction sans Stress](docs/05-guide-reproduction.md)** : Tutoriel pas-à-pas pour configurer MongoDB Atlas, remplir votre `.env` local, installer et tester l'application sereinement.

---

## 🚀 Démarrage Rapide

### 1. Prérequis
Assurez-vous d'avoir installé **Node.js (v18+)** et d'avoir un accès à un cluster MongoDB Atlas.

### 2. Cloner et Installer les Dépendances
```bash
# Installer toutes les dépendances mises à jour
npm install
```

### 3. Configurer l'Environnement
Copiez le modèle `.env.sample` vers un nouveau fichier `.env` et complétez vos secrets :
```bash
cp .env.sample .env
```

### 4. Lancer le Serveur local
```bash
npm run start
```
> Le serveur sera accessible à l'adresse suivante : [http://localhost:3000](http://localhost:3000)
