# 01. Introduction au Projet : jwt-essai

Bienvenue dans le guide d'apprentissage du projet **jwt-essai**. Ce projet a été conçu pour servir de modèle d'apprentissage pratique et robuste concernant la mise en œuvre de la sécurité d'authentification moderne pour les applications Web basées sur Node.js et Express.

---

## 🎯 Objectif du Projet

L'objectif principal est de concevoir un système d'authentification robuste de bout en bout qui respecte les meilleures pratiques de cybersécurité pour le Web. Ce projet met en œuvre deux piliers indispensables :
1. **Hachage à sens unique des mots de passe** en utilisant l'algorithme robuste de dérivation de clé `bcrypt`.
2. **Gestion de session sans état (stateless)** grâce aux **JSON Web Tokens (JWT)** signés cryptographiquement, puis stockés dans des cookies de navigateur (cookies de session HTTP-Only).

---

## 🛡️ Pourquoi cette Architecture ?

Dans le Web traditionnel, l'état de session est stocké côté serveur (sessions en mémoire ou en base de données) et identifié côté client par un ID de session. Bien que sécurisé, cela présente des limites d'extensibilité (scalabilité).

L'utilisation de **JWT** élimine le besoin pour le serveur de stocker les sessions actives. C'est l'utilisateur qui transporte sa preuve d'identité de manière sécurisée sous forme de jeton signé. Le serveur a uniquement besoin de valider la signature cryptographique du jeton grâce à sa clé privée locale pour vérifier instantanément l'identité du client.

Toutefois, le stockage du JWT côté client est sensible. Ce projet implémente la méthode la plus sûre à ce jour : stocker le JWT dans un cookie HTTP. Cela empêche les scripts malveillants tiers (attaques XSS) d'accéder au token en lecture, créant une barrière de sécurité de premier plan.

---

## 🚀 Ce que vous allez apprendre

En explorant cette suite documentaire ordonnée, vous comprendrez :
- **L'ordre logique de création de chaque fichier** et l'importance de son rôle dans l'écosystème de l'application.
- **Les flux de données** de l'inscription à la connexion et à la sécurisation des profils, illustrés par des diagrammes interactifs.
- **La mécanique interne des protocoles** (Bcrypt et JWT).
- **Une méthodologie de reproduction sereine et sécurisée**, étape par étape, pour appliquer ces concepts sur vos futurs projets sans stress.
