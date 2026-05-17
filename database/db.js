// Importer la bibliothèque ODM (Object Document Mapper) Mongoose pour modéliser les données MongoDB dans Node.js
const mongoose = require('mongoose')

// Récupérer les variables d'environnement chargées par dotenv dans le fichier principal `app.js`
const PSEUDO = process.env.MONGODB_PSEUDO             // Identifiant de l'utilisateur de la base de données
const PASSWORD = process.env.MONGODB_PASSWORD         // Mot de passe de sécurité de l'utilisateur
const CLIENT_NAME = process.env.MONGODB_CLIENT_NAME     // Nom du cluster MongoDB Atlas (hôte)
const DATABASE_NAME = process.env.MONGODB_DATABASE_NAME // Nom de la base de données spécifique du projet

// Se connecter au cluster MongoDB Atlas en utilisant la chaîne de connexion sécurisée (SRV URI)
mongoose
    .connect(
        `mongodb+srv://${PSEUDO}:${PASSWORD}@${CLIENT_NAME}.d51otgm.mongodb.net/${DATABASE_NAME}`,
        {} // Dans Mongoose v8.x, les options obsolètes comme useNewUrlParser et useUnifiedTopology sont supprimées car toujours activées par défaut.
    )
    .then(() => console.log('Connexion réussie à la base de données MongoDB !'))
    .catch((error) => {
        // En cas d'erreur de connexion, journaliser le message d'erreur et la pile d'exécution pour le débogage
        console.error('Erreur lors de la connexion à MongoDB :')
        console.error(error.message)
        console.error(error.stack)
    })
