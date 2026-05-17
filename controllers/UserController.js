// Importer le modèle utilisateur pour interagir avec la base de données MongoDB
const UserModel = require('../models/UserModel')

// Importer bcrypt pour le hachage sécurisé des mots de passe (salage unilatéral)
const bcrypt = require('bcrypt')

// Importer jsonwebtoken pour générer et signer des jetons d'accès cryptographiques
const jwt = require('jsonwebtoken')

/**
 * Affiche la page d'accueil de l'application.
 * Rendu du template Pug 'index'.
 */
const getHome = (req, res) => res.render('index')

/**
 * Redirige les accès bruts à '/profile' vers le formulaire de connexion.
 */
const getRedirectProfile = (req, res) => res.redirect('/api/v1/signin')

/**
 * Affiche le profil de l'utilisateur authentifié.
 * Récupère les données décodées depuis le middleware (req.user) et les injecte dans le template Pug 'profile'.
 */
const getProfile = (req, res) => {
    // Journalise les données utilisateur décodées du JWT dans la console
    console.log('Données utilisateur dans la requête (req.user) :', req.user)
    res.render('profile', {
        id: req.params.id,
        email: req.user.email,
    })
}

/**
 * Affiche le formulaire d'inscription.
 * Si l'utilisateur possède déjà un cookie de token valide, il est automatiquement redirigé vers son profil.
 */
const getSignUp = (req, res) => {
    // Vérification de la présence du token JWT
    if (req.cookies.access_token) {
        // Redirection directe vers la page profil en utilisant l'ID stocké dans le cookie d'assistance userID
        res.redirect(`/api/v1/profile/${req.cookies.userID}`)
    } else {
        res.render('signup')
    }
}

/**
 * Gère la soumission du formulaire d'inscription.
 * 1. Vérifie si l'email existe déjà dans la base de données.
 * 2. Si oui, renvoie une erreur visuelle.
 * 3. Si non, crée une nouvelle instance d'utilisateur.
 * 4. Génère un "sel" (salt) et hache le mot de passe en asynchrone avec bcrypt.
 * 5. Enregistre le nouvel utilisateur en base de données et le redirige vers la connexion.
 */
const postSignUp = async (req, res) => {
    try {
        const { email, password } = req.body

        // Rechercher un utilisateur existant avec cet email exact
        // Note : findOne() renvoie un objet unique (ou null), contrairement à find() qui renvoie un tableau
        const checkUser = await UserModel.findOne({ email })

        console.log('Vérification inscription :', {
            email,
            existeDeja: !!checkUser,
        })

        // Si l'utilisateur existe déjà
        if (checkUser) {
            res.render('signup', {
                response: 'Cet email existe déjà',
            })
        } else {
            // Initialiser une nouvelle instance utilisateur (email nettoyé automatiquement par le schéma)
            const newUser = new UserModel({
                email,
            })
            
            // Hacher le mot de passe de manière asynchrone avec bcrypt
            // Le paramètre de "salt rounds" est fixé à 10 par défaut pour assurer un bon ratio vitesse/sécurité
            const hash = await bcrypt.hash(password, 10)
            
            // Assigner le mot de passe haché de manière sécurisée
            newUser.password = hash
            
            // Sauvegarder dans MongoDB (opération asynchrone)
            await newUser.save()
            
            // Rediriger vers la page de connexion
            res.redirect('/api/v1/signin')
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error)
        res.status(500).render('signup', {
            response: "Une erreur interne s'est produite lors de l'inscription.",
        })
    }
}

/**
 * Gère la soumission du formulaire de connexion (Authentification).
 * 1. Recherche l'utilisateur dans MongoDB par son email.
 * 2. Si trouvé, compare le mot de passe en clair soumis avec le hash stocké en BDD (bcrypt.compare).
 * 3. Si correspondance, génère un token JWT signé avec la clé privée (JWT_SECRET) et une durée de vie d'1 heure.
 * 4. Stocke ce JWT dans un cookie nommé "access_token" sur le navigateur du client avec les paramètres de sécurité optimaux.
 * 5. Redirige vers la page de profil privée.
 */
const postSignIn = async (req, res) => {
    try {
        const { email, password } = req.body
        
        // Rechercher l'utilisateur par email
        const checkUser = await UserModel.findOne({ email })

        if (checkUser !== null) {
            // 1. Protection Brute-Force : Vérifier si le compte est actuellement verrouillé
            if (checkUser.lockUntil && checkUser.lockUntil > Date.now()) {
                const minutesRemaining = Math.ceil((checkUser.lockUntil - Date.now()) / (60 * 1000))
                return res.status(403).render('signin', {
                    response: `Compte temporairement verrouillé. Réessayez dans ${minutesRemaining} minute(s).`,
                })
            }

            // 2. Comparer de manière sécurisée les hashs de mot de passe (évite les attaques temporelles)
            const matchPassword = await bcrypt.compare(password, checkUser.password)

            if (matchPassword) {
                // Si la connexion réussit, réinitialiser le compteur de tentatives infructueuses si nécessaire
                if (checkUser.loginAttempts > 0 || checkUser.lockUntil) {
                    await checkUser.resetAttempts()
                }

                // Générer le jeton JWT contenant l'ID et l'email comme "Payload" de confiance
                const tokenJWT = jwt.sign(
                    {
                        _id: checkUser._id,
                        email: checkUser.email,
                    },
                    process.env.JWT_SECRET, // Clé privée d'authentification
                    {
                        expiresIn: '1h', // Validité du token fixée à 1 heure
                    },
                )
                
                // Envoyer le token sous forme de cookie ultra-sécurisé (HTTP-Only, HTTPS en production, SameSite strict)
                const cookieOptions = {
                    httpOnly: true,                          // Neutralise les attaques XSS (JavaScript ne peut pas lire le cookie)
                    secure: process.env.NODE_ENV === 'production', // Cookie envoyé uniquement via HTTPS chiffré en production
                    sameSite: 'strict',                      // Immunise contre le vol CSRF (pas d'envoi lors de requêtes de sites tiers)
                    maxAge: 3600000                          // Expire après 1 heure (en millisecondes)
                }
                res.cookie('access_token', tokenJWT, cookieOptions)
                
                // Rediriger l'utilisateur connecté vers sa page de profil sécurisée
                res.redirect(`/api/v1/profile/${checkUser._id}`)
            } else {
                // Mauvais mot de passe : incrémenter le compteur de tentatives infructueuses
                await checkUser.incLoginAttempts()
                
                if (checkUser.loginAttempts >= 5) {
                    res.status(401).render('signin', {
                        response: 'Compte verrouillé pour 15 minutes suite à 5 échecs consécutifs.',
                    })
                } else {
                    res.status(401).render('signin', {
                        response: `Mot de passe incorrect. Tentatives restantes : ${5 - checkUser.loginAttempts}/5.`,
                    })
                }
            }
        } else {
            // Utilisateur inexistant dans la base de données
            res.status(401).render('signin', {
                response: 'Utilisateur inexistant',
            })
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error)
        res.status(500).render('signin', {
            response: "Une erreur interne s'est produite lors de la connexion.",
        })
    }
}

/**
 * Affiche le formulaire de connexion.
 * Si un token JWT valide est détecté, l'utilisateur est redirigé vers son profil.
 */
const getSignIn = (req, res) => {
    if (req.cookies.access_token) {
        res.redirect(`/api/v1/profile/${req.cookies.userID}`)
    } else {
        res.render('signin')
    }
}

/**
 * Gère la déconnexion de l'utilisateur.
 * 1. Supprime les cookies 'userID' et 'access_token' du navigateur client via res.clearCookie().
 * 2. Nettoie les propriétés correspondantes dans l'objet de requête req.cookies.
 * 3. Redirige l'utilisateur vers la page d'accueil publique.
 */
const getLogout = (req, res) => {
    // Supprimer activement les cookies stockés dans le navigateur
    res.clearCookie('userID')
    res.clearCookie('access_token')
    
    // Nettoyer localement les variables de requête pour éviter tout état résiduel
    delete req.cookies.userID
    delete req.cookies.access_token
    
    // Rediriger vers l'accueil public
    res.redirect('/api/v1')
}

// Exporter l'ensemble des contrôleurs de routage utilisateur
module.exports = {
    getHome,
    getRedirectProfile,
    getProfile,
    getLogout,
    getSignIn,
    getSignUp,
    postSignUp,
    postSignIn,
}
