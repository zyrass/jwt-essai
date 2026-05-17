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
    },
    {
        // timestamps: true génère automatiquement les champs "createdAt" et "updatedAt" à chaque document
        timestamps: true,
    },
)

// Exporter le modèle Mongoose associé à la collection configurée dans le .env
module.exports = mongoose.model(USER_COLLECTION_NAME, userSchema)
