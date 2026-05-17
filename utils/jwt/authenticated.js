// Importer la bibliothèque jsonwebtoken pour la vérification et le décryptage du token
const jwt = require('jsonwebtoken')

/**
 * Middleware de sécurité : authenticated
 * Ce middleware intercepte la requête HTTP vers une route protégée.
 * 1. Il extrait le cookie nommé 'access_token'.
 * 2. Si le token est manquant, il interrompt la requête et renvoie une réponse d'erreur 401 (Non autorisé).
 * 3. Si le token est présent, il vérifie sa signature et sa validité temporelle avec jwt.verify() et JWT_SECRET.
 * 4. Si la vérification réussit, les informations décodées de l'utilisateur (id, email) sont injectées dans `req.user`.
 *    Un cookie d'assistance client `userID` est généré/rafraîchi pour simplifier les redirections côté client.
 *    Le middleware appelle ensuite next() pour autoriser l'accès au contrôleur suivant.
 * 5. Si le token a été altéré ou a expiré, le bloc catch attrape l'erreur et renvoie une erreur 401.
 */
const authenticated = (req, res, next) => {
    // Récupérer le token d'authentification depuis les cookies de la requête entrante
    const token = req.cookies.access_token

    // Si le token est absent (non connecté)
    if (!token) {
        console.warn("Accès refusé : Cookie 'access_token' manquant.")
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' })
    }

    try {
        // Valider le token en utilisant la clé secrète JWT_SECRET définie dans le .env
        // Si le token est expiré ou invalide, cette fonction lève immédiatement une exception (catch)
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Injecter les données de l'utilisateur décodées (ex: _id, email) dans l'objet de requête `req`
        // Cela permet aux contrôleurs suivants (ex: getProfile) d'avoir un accès immédiat à ces informations
        req.user = decoded

        // Définir un cookie utilitaire non crypté "userID" contenant l'identifiant MongoDB de l'utilisateur
        // Ce cookie aide le navigateur à savoir quel profil afficher sans avoir à décoder le JWT côté client.
        // Il est sécurisé via les attributs Secure et SameSite.
        res.cookie('userID', req.user._id, {
            httpOnly: false,                               // Ce cookie d'assistance peut être lu par le JS client pour orienter les redirections
            secure: process.env.NODE_ENV === 'production', // Envoyé uniquement sur HTTPS en production
            sameSite: 'strict',                            // Protection contre les fuites inter-sites
            maxAge: 3600000                                // Coordonné sur 1 heure de validité (en millisecondes)
        })

        // --- Rotation de Jeton Actif (Sliding Session JWT Rotation) ---
        // Les dates d'émission (iat) et d'expiration (exp) décodées du JWT sont en secondes
        const nowInSeconds = Math.floor(Date.now() / 1000)
        const totalDuration = decoded.exp - decoded.iat
        const timeElapsed = nowInSeconds - decoded.iat

        // Si plus de la moitié du temps s'est écoulé (ex: plus de 30 minutes passées sur 1 heure de validité)
        if (timeElapsed > totalDuration / 2) {
            // Générer un nouveau jeton d'accès prolongé d'une heure
            const rotatedToken = jwt.sign(
                {
                    _id: decoded._id,
                    email: decoded.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1h',
                }
            )

            // Réémettre le cookie access_token blindé avec le nouveau JWT
            res.cookie('access_token', rotatedToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000 // Rallongé pour 1 heure (en millisecondes)
            })

            console.log(`[Rotation JWT] Le jeton de session pour l'utilisateur ${decoded.email} a été renouvelé avec succès (sliding window).`)
        }

        // Autoriser le passage au middleware ou contrôleur suivant de la route
        next()
    } catch (error) {
        console.error("Accès refusé : Le token JWT est invalide ou expiré.", error.message)
        // En cas de token altéré ou expiré, renvoyer une erreur 401 (Non autorisé)
        return res.status(401).json({ error: 'Session expirée ou token invalide. Veuillez vous reconnecter.' })
    }
}

// Exporter le middleware sous forme d'objet contenant la fonction "authenticated"
module.exports = {
    authenticated,
}
