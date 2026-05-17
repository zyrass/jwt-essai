// Charger les variables d'environnement à partir du fichier `.env` via la bibliothèque `dotenv`
require('dotenv').config()

// Connecter l'application à la base de données MongoDB en chargeant le script de connexion
require('./database/db')

// Importer les modules et middlewares nécessaires
const cookieParser = require('cookie-parser') // Middleware pour analyser les cookies envoyés par le client dans les en-têtes HTTP
const express = require('express')           // Framework web rapide, minimaliste et flexible pour Node.js
const morgan = require('morgan')             // Middleware d'enregistrement des requêtes HTTP (logger de requêtes)
const apiRoutes = require('./router/api.routes') // Importer le routeur d'API principal

// Instancier l'application Express
const app = express()

// Configurer le moteur de rendu de templates "Pug" pour générer les vues HTML dynamiques
app.set('view engine', 'pug')

// --- Configuration des Middlewares Globaux ---

// 1. cookieParser() : Permet de lire les cookies attachés aux requêtes (req.cookies)
app.use(cookieParser())

// 2. morgan('dev') : Journalise de manière lisible les requêtes entrantes dans la console de développement (ex: GET /api/v1 200 4.120 ms)
app.use(morgan('dev'))

// 3. express.json() : Analyse le corps des requêtes entrantes au format JSON (req.body)
app.use(express.json())

// 4. express.urlencoded() : Analyse les corps de requêtes codés en URL, typiquement envoyés par les formulaires HTML standard
app.use(express.urlencoded({ extended: true }))

// --- Définition des Routes ---

// Redirection systématique de la racine '/' et '/api' vers la version courante de l'API (/api/v1)
app.get(['/', '/api'], (_, res) => {
    res.redirect('/api/v1')
})

// Associer toutes les routes de l'API au préfixe versionné '/api/v1' pour assurer la pérennité du routage
app.use('/api/v1', apiRoutes)

// --- Démarrage du Serveur ---

// Écouter sur le port 3000 et confirmer le bon démarrage dans la console de développement
app.listen(3000, () =>
    console.log(`Serveur démarré sur cette url: http://localhost:3000`),
)
