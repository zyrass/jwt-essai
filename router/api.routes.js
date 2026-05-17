// Créer un routeur Express indépendant pour regrouper les endpoints de notre API
const router = require('express').Router()

// Importer le contrôleur contenant la logique métier associée à chaque endpoint
const UserController = require('../controllers/UserController')

// Importer le middleware d'authentification par JWT pour sécuriser l'accès aux pages privées
const check = require('../utils/jwt/authenticated')

// Importer express-rate-limit pour se prémunir du brute-force réseau et des robots
const rateLimit = require('express-rate-limit')

// Limiteur de taux IP personnalisé avec détection du format attendu (HTML ou JSON)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Fenêtre de blocage de 15 minutes
    max: 20,                  // Limite stricte de 20 requêtes par adresse IP
    standardHeaders: true,    // Renvoie les en-têtes de limitation RateLimit-*
    legacyHeaders: false,     // Désactive les anciens en-têtes X-RateLimit-*
    handler: (req, res, next, options) => {
        // Si le client s'attend à recevoir du HTML (soumission de formulaire Pug standard)
        if (req.accepts('html')) {
            const isSignin = req.path.includes('signin')
            res.status(429).render(isSignin ? 'signin' : 'signup', {
                error: "Trop de requêtes de connexion détectées depuis votre adresse IP. Veuillez patienter 15 minutes."
            })
        } else {
            // Réponse JSON standard pour d'éventuels clients d'API REST
            res.status(429).json({ error: "Trop de requêtes. IP bloquée temporairement pour 15 minutes." })
        }
    }
})

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

// Soumission du formulaire d'inscription (protégée par limitation réseau)
router.post('/signup', authLimiter, UserController.postSignUp)

// Soumission du formulaire de connexion (Authentification protégée par limitation réseau)
router.post('/signin', authLimiter, UserController.postSignIn)

// Exporter le routeur d'API pour qu'il soit importé dans le fichier central `app.js`
module.exports = router
