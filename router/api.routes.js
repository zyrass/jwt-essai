// Créer un routeur Express indépendant pour regrouper les endpoints de notre API
const router = require('express').Router()

// Importer le contrôleur contenant la logique métier associée à chaque endpoint
const UserController = require('../controllers/UserController')

// Importer le middleware d'authentification par JWT pour sécuriser l'accès aux pages privées
const check = require('../utils/jwt/authenticated')

// --- ROUTES DE NAVIGATION (GET) ---

// Page d'accueil publique de l'API
router.get('/', UserController.getHome)

// Formulaire de connexion (signin)
router.get('/signin', UserController.getSignIn)

// Formulaire d'inscription (signup)
router.get('/signup', UserController.getSignUp)

// Redirection par défaut si l'accès à /profile est fait sans ID utilisateur
router.get('/profile', UserController.getRedirectProfile)

// Page de profil utilisateur sécurisée.
// Le middleware `check.authenticated` intercepte la requête, vérifie le jeton JWT.
// S'il est valide, la requête poursuit vers `UserController.getProfile`. Sinon, la requête est rejetée.
router.get('/profile/:id', check.authenticated, UserController.getProfile)

// Endpoint de déconnexion de l'utilisateur
router.get('/logout', UserController.getLogout)

// --- ROUTES DE TRAITEMENT (POST) ---

// Soumission du formulaire d'inscription
router.post('/signup', UserController.postSignUp)

// Soumission du formulaire de connexion (Authentification)
router.post('/signin', UserController.postSignIn)

// Exporter le routeur d'API pour qu'il soit importé dans le fichier central `app.js`
module.exports = router
