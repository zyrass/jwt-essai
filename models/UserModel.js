// Importer Mongoose pour la définition du schéma et du modèle de données
const mongoose = require('mongoose')

// Récupérer le nom de la collection utilisateur défini dans le fichier d'environnement (.env), avec une valeur de secours par défaut
const USER_COLLECTION_NAME = process.env.MONGODB_USER_COLLECTION_NAME || 'User'

// Définir la structure (le schéma) de nos documents utilisateurs dans MongoDB
const userSchema = new mongoose.Schema(
    {
        // Pseudo facultatif de l'utilisateur
        username: {
            type: String,
        },
        // Adresse email unique, obligatoire et nettoyée
        email: {
            type: String,
            unique: true,      // Garantit qu'aucun autre utilisateur ne possède la même adresse email dans la base
            required: true,    // Rend ce champ obligatoire
            trim: true,        // Supprime les espaces blancs superflus au début et à la fin (ex: " test@gmail.com " -> "test@gmail.com")
            lowercase: true,   // Convertit automatiquement en minuscules pour éviter les doublons dus à la casse
        },
        // Mot de passe sécurisé (stocké sous forme hachée cryptographiquement)
        password: {
            type: String,
            required: true,    // Rend ce champ obligatoire
            trim: true,        // Supprime les espaces blancs
        },
        // Nombre de tentatives infructueuses de connexion pour la protection brute-force
        loginAttempts: {
            type: Number,
            required: true,
            default: 0,
        },
        // Heure jusqu'à laquelle le compte est verrouillé (blacklisté temporairement)
        lockUntil: {
            type: Date,
        },
    },
    {
        // timestamps: true génère automatiquement les champs "createdAt" et "updatedAt" à chaque document
        timestamps: true,
    },
)

// --- Méthodes d'instance de Schéma pour le verrouillage de compte (Account Lockout) ---

// Propriété virtuelle vérifiant si le compte est actuellement verrouillé
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Incrémente le nombre de tentatives échouées de connexion et applique un blocage si le seuil est franchi
userSchema.methods.incLoginAttempts = async function () {
    // Si un ancien verrou temporel est déjà expiré, repartir à 1 tentative
    if (this.lockUntil && this.lockUntil < Date.now()) {
        this.loginAttempts = 1
        this.lockUntil = undefined
    } else {
        this.loginAttempts += 1
        // Seuil fixé à 5 tentatives échouées
        if (this.loginAttempts >= 5) {
            // Verrouillage de sécurité pendant 15 minutes (15 * 60 * 1000 millisecondes)
            this.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        }
    }
    return this.save()
}

// Réinitialise les essais et supprime le verrou (appelé suite à une authentification réussie)
userSchema.methods.resetAttempts = async function () {
    this.loginAttempts = 0
    this.lockUntil = undefined
    return this.save()
}

// Exporter le modèle Mongoose associé à la collection configurée dans le .env
module.exports = mongoose.model(USER_COLLECTION_NAME, userSchema)
