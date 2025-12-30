# Guide de Déploiement

## 🚀 Déploiement en Production

Ce guide explique comment déployer l'application sur un serveur cloud pour qu'elle soit accessible 24/7 sans avoir besoin de votre PC.

## ⚠️ Important : ngrok vs Déploiement Cloud

- **ngrok** : Expose votre serveur local temporairement. Nécessite que votre PC soit allumé et le serveur en cours d'exécution.
- **Déploiement Cloud** : L'application tourne sur un serveur distant, accessible 24/7 sans votre PC.

## 🎯 Options de Déploiement Recommandées

### Option 1 : Railway (Recommandé - Gratuit pour commencer)

Railway est excellent pour déployer rapidement des applications avec MongoDB, Docker, etc.

**Avantages** :
- Gratuit pour commencer (500$ de crédit/mois)
- Support Docker et docker-compose
- MongoDB intégré
- HTTPS automatique
- Variables d'environnement faciles

**Étapes détaillées** :

### Étape 1 : Préparer votre code

1. **Pousser votre code sur GitHub ou GitLab** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/votre-repo.git
   git push -u origin main
   ```

### Étape 2 : Créer un compte Railway

1. Aller sur https://railway.app
2. Cliquer sur "Start a New Project"
3. Se connecter avec GitHub (recommandé) ou GitLab
4. Autoriser Railway à accéder à vos repositories

### Étape 3 : Créer un nouveau projet Railway

1. Dans le dashboard Railway, cliquer sur **"+ New Project"**
2. Choisir **"Deploy from GitHub repo"** (ou GitLab)
3. Sélectionner votre repository `Projet-MIGI-2026-Team-X`
4. Railway va créer un nouveau projet et détecter automatiquement les services

### Étape 4 : Déployer le service Backend

1. **Dans votre projet Railway**, vous verrez une liste de services
2. **Si Railway n'a pas détecté automatiquement le backend** :
   - Cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner le même repository
   - Railway va scanner le repo

3. **Configurer le service Backend** :
   - Railway devrait détecter automatiquement le dossier `backend/`
   - Si ce n'est pas le cas, dans les **Settings** du service :
     - **Root Directory** : `backend`
     - **Build Command** : `npm install && npm run build` (ou laisser vide, Railway détecte automatiquement)
     - **Start Command** : `npm start`

4. **Configurer les variables d'environnement** :
   - Cliquer sur le service "Backend"
   - Aller dans l'onglet **"Variables"**
   - Ajouter les variables suivantes une par une :
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant-reservations?retryWrites=true&w=majority
     NODE_ENV=production
     USE_HTTPS=false
     PORT=3443
     JWT_SECRET=votre-secret-jwt-tres-fort-minimum-32-caracteres
     JWT_EXPIRES_IN=2h
     ADMIN_ORIGIN=https://votre-admin.railway.app
     CORS_ORIGINS=https://votre-admin.railway.app
     TWILIO_ACCOUNT_SID=votre-account-sid
     TWILIO_AUTH_TOKEN=votre-auth-token
     TWILIO_PHONE_NUMBER=+1234567890
     TWILIO_WEBHOOK_BASE_URL=https://votre-backend.railway.app
     OPENAI_API_KEY=votre-openai-api-key
     AI_SERVICE_URL=https://votre-ai.railway.app
     ```
   - **Note** : Pour `TWILIO_WEBHOOK_BASE_URL` et `AI_SERVICE_URL`, vous devrez mettre à jour ces valeurs après avoir déployé les autres services

5. **Obtenir l'URL HTTPS du Backend** :
   - Dans l'onglet **"Settings"** du service Backend
   - Section **"Networking"**
   - Cliquer sur **"Generate Domain"** si ce n'est pas déjà fait
   - Railway génère une URL comme : `votre-backend-production.up.railway.app`
   - **Copier cette URL** - vous en aurez besoin pour les autres services

### Étape 5 : Déployer le service AI

1. **Créer un nouveau service** :
   - Dans votre projet Railway, cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner le même repository

2. **Configurer le service AI** :
   - Dans les **Settings** du nouveau service :
     - **Root Directory** : `microservices/ai`
     - **Build Command** : `npm install && npm run build`
     - **Start Command** : `npm start`

3. **Configurer les variables d'environnement** :
   - Aller dans l'onglet **"Variables"**
   - Ajouter :
     ```
     NODE_ENV=production
     PORT=4000
     OPENAI_API_KEY=votre-openai-api-key
     CORS_ORIGINS=https://votre-backend.railway.app
     ```

4. **Obtenir l'URL HTTPS du service AI** :
   - Dans **Settings** → **Networking**
   - Cliquer sur **"Generate Domain"**
   - **Copier l'URL** (ex: `votre-ai-production.up.railway.app`)

5. **Mettre à jour le Backend** :
   - Retourner au service Backend
   - Aller dans **Variables**
   - Mettre à jour `AI_SERVICE_URL` avec l'URL du service AI que vous venez de copier
   - Railway redéploiera automatiquement le backend

### Étape 6 : Déployer le service Admin

1. **Créer un nouveau service** :
   - Cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner le même repository

2. **Configurer le service Admin** :
   - Dans les **Settings** :
     - **Root Directory** : `admin`
     - **Build Command** : `npm install && npm run build`
     - **Start Command** : Railway peut utiliser un serveur statique automatiquement, ou vous pouvez utiliser :
       - **Nixpacks** (détection automatique) : Railway détectera que c'est une app Vite/React
       - **Docker** : Utiliser le Dockerfile fourni

3. **Pour une app React statique avec Nginx** :
   - Railway peut servir automatiquement les fichiers statiques
   - Ou utiliser le Dockerfile fourni qui utilise Nginx

4. **Configurer les variables d'environnement** :
   - Aller dans **Variables**
   - Ajouter :
     ```
     NODE_ENV=production
     VITE_API_URL=https://votre-backend.railway.app
     ```
   - **Important** : Les variables `VITE_*` doivent être définies au moment du build

5. **Obtenir l'URL HTTPS de l'Admin** :
   - Dans **Settings** → **Networking**
   - Cliquer sur **"Generate Domain"**
   - **Copier l'URL** (ex: `votre-admin-production.up.railway.app`)

6. **Mettre à jour le Backend** :
   - Retourner au service Backend → **Variables**
   - Mettre à jour :
     ```
     ADMIN_ORIGIN=https://votre-admin.railway.app
     CORS_ORIGINS=https://votre-admin.railway.app
     ```

### Étape 7 : Vérifier les déploiements

1. **Vérifier les logs** :
   - Pour chaque service, aller dans l'onglet **"Deployments"**
   - Cliquer sur le dernier déploiement
   - Vérifier les logs pour s'assurer qu'il n'y a pas d'erreurs

2. **Tester les endpoints** :
   ```bash
   # Tester le backend
   curl https://votre-backend.railway.app/health
   
   # Tester le service AI
   curl https://votre-ai.railway.app/health
   ```

### Étape 8 : Initialiser la base de données

1. **Ouvrir un terminal Railway** :
   - Aller sur le service Backend
   - Cliquer sur l'onglet **"Deployments"**
   - Cliquer sur **"View Logs"** ou utiliser le terminal intégré

2. **Exécuter le script de seed** :
   ```bash
   cd backend
   npm run seed
   ```
   Cela crée :
   - Un utilisateur admin : `username: admin`, `password: admin123`
   - Un restaurant par défaut
   - Des tables d'exemple

### Étape 9 : Configurer Twilio Webhooks

1. Aller sur https://console.twilio.com
2. **Phone Numbers** → **Manage** → **Active Numbers**
3. Cliquer sur votre numéro de téléphone
4. Dans la section **"Voice & Fax"** :
   - **A CALL COMES IN** : `https://votre-backend.railway.app/twilio/voice/incoming`
   - **STATUS CALLBACK URL** (optionnel) : `https://votre-backend.railway.app/twilio/voice/status`
5. Cliquer sur **"Save"**

### Étape 10 : Tester l'application complète

1. **Tester l'API Backend** :
   ```bash
   curl https://votre-backend.railway.app/health
   # Devrait retourner : {"status":"ok","timestamp":"..."}
   ```

2. **Tester l'authentification** :
   ```bash
   curl -X POST https://votre-backend.railway.app/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Tester l'Admin Dashboard** :
   - Ouvrir `https://votre-admin.railway.app` dans votre navigateur
   - Se connecter avec `admin` / `admin123`
   - Vérifier que le dashboard se charge

4. **Tester un appel téléphonique** :
   - Appeler votre numéro Twilio
   - L'IA devrait répondre
   - Faire une réservation
   - Vérifier qu'elle apparaît en temps réel dans l'admin dashboard

## 📸 Structure du Dashboard Railway

Après déploiement, votre projet Railway devrait ressembler à ceci :

```
📁 Projet: restaurant-reservations
├── 🔧 Service: backend
│   ├── Variables (environnement)
│   ├── Deployments (historique)
│   ├── Settings (Root Directory: backend)
│   └── Networking (URL: votre-backend.railway.app)
├── 🤖 Service: ai
│   ├── Variables
│   ├── Deployments
│   ├── Settings (Root Directory: microservices/ai)
│   └── Networking (URL: votre-ai.railway.app)
└── 🎨 Service: admin
    ├── Variables
    ├── Deployments
    ├── Settings (Root Directory: admin)
    └── Networking (URL: votre-admin.railway.app)
```

## 🔄 Mise à jour du code

Quand vous poussez du nouveau code :

1. **Pousser sur GitHub/GitLab** :
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```

2. **Railway détecte automatiquement** le nouveau commit et redéploie

3. **Vérifier les déploiements** dans l'onglet "Deployments" de chaque service

### Option 2 : Render (Gratuit avec limitations)

**Avantages** :
- Plan gratuit disponible
- Support Docker
- MongoDB Atlas intégré
- HTTPS automatique

**Étapes** :

1. **Créer un compte** : https://render.com
2. **Créer un nouveau Web Service** :
   - Connecter votre repository GitLab
   - Root Directory : `backend`
   - Build Command : `npm install && npm run build`
   - Start Command : `npm start`
3. **Configurer MongoDB** :
   - Utiliser MongoDB Atlas (gratuit) : https://www.mongodb.com/cloud/atlas
   - Créer un cluster gratuit
   - Obtenir la connection string
4. **Configurer les variables d'environnement**
5. **Répéter pour AI et Admin services**

### Option 3 : Heroku (Payant mais fiable)

**Avantages** :
- Très fiable et stable
- Excellent support
- Add-ons disponibles

**Note** : Heroku a supprimé son plan gratuit, mais offre un plan à partir de 5$/mois.

### Option 4 : DigitalOcean App Platform

**Avantages** :
- Plan à partir de 5$/mois
- Support Docker
- MongoDB disponible

## 📋 Configuration pour Déploiement Cloud

### 1. MongoDB Atlas (Base de données cloud)

1. Créer un compte : https://www.mongodb.com/cloud/atlas
2. Créer un cluster gratuit (M0)
3. Créer un utilisateur de base de données
4. Whitelist votre IP (ou 0.0.0.0/0 pour développement)
5. Obtenir la connection string :
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant-reservations?retryWrites=true&w=majority
   ```

### 2. Générer des Certificats SSL (si nécessaire)

Pour la production, utilisez des certificats valides (Let's Encrypt, Cloudflare, etc.). La plupart des plateformes cloud gèrent cela automatiquement.

### 3. Variables d'Environnement pour Production

```env
# MongoDB (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurant-reservations?retryWrites=true&w=majority

# HTTPS (géré automatiquement par la plateforme cloud)
HTTPS_CERT_PATH=/app/certs/cert.pem  # Généré automatiquement
HTTPS_KEY_PATH=/app/certs/privkey.pem  # Généré automatiquement
HTTPS_PORT=3443  # Ou le port fourni par la plateforme

# JWT (GÉNÉRER UN SECRET FORT !)
JWT_SECRET=generate-a-strong-random-secret-minimum-32-characters-long
JWT_EXPIRES_IN=2h

# CORS (URL de votre admin déployé)
ADMIN_ORIGIN=https://votre-admin.railway.app
CORS_ORIGINS=https://votre-admin.railway.app,https://votre-admin.render.com

# Twilio
TWILIO_ACCOUNT_SID=votre-account-sid
TWILIO_AUTH_TOKEN=votre-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_BASE_URL=https://votre-backend.railway.app  # URL HTTPS de votre backend déployé

# OpenAI
OPENAI_API_KEY=votre-openai-api-key

# AI Microservice (URL du service AI déployé)
AI_SERVICE_URL=https://votre-ai.railway.app
PORT=4000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Restaurant Defaults
DEFAULT_RESTAURANT_NAME=Le Restaurant
DEFAULT_RESTAURANT_PHONE=+1234567890
DEFAULT_TIMEZONE=Europe/Paris

NODE_ENV=production
```

### 4. Configurer Twilio Webhooks

Une fois votre backend déployé et accessible via HTTPS :

1. Aller sur https://console.twilio.com
2. Phone Numbers → Manage → Active Numbers
3. Cliquer sur votre numéro de téléphone
4. Dans "Voice & Fax" :
   - **A CALL COMES IN** : `https://votre-backend.railway.app/twilio/voice/incoming`
   - **STATUS CALLBACK URL** : `https://votre-backend.railway.app/twilio/voice/status` (optionnel)

## 🔧 Adaptation du Code pour le Cloud

### Backend - Adapter pour HTTPS automatique

Certaines plateformes gèrent HTTPS automatiquement. Vous devrez peut-être adapter `backend/src/server.ts` :

```typescript
// Si la plateforme gère HTTPS automatiquement (comme Railway, Render)
// Vous pouvez utiliser Express directement au lieu de HTTPS
const PORT = process.env.PORT || process.env.HTTPS_PORT || 3443;

// Pour les plateformes qui nécessitent HTTPS explicite
if (process.env.NODE_ENV === 'production' && process.env.USE_HTTPS !== 'false') {
  // Utiliser HTTPS
} else {
  // Utiliser HTTP (la plateforme gère HTTPS)
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
```

### Dockerfile - Optimisation pour Cloud

Les Dockerfiles sont déjà prêts, mais vous pouvez les optimiser pour le cloud.

## 📝 Checklist de Déploiement

- [ ] Créer un compte sur la plateforme cloud choisie
- [ ] Créer un cluster MongoDB Atlas
- [ ] Déployer le service Backend
- [ ] Déployer le service AI
- [ ] Déployer le service Admin
- [ ] Configurer toutes les variables d'environnement
- [ ] Tester les endpoints API
- [ ] Configurer les webhooks Twilio avec l'URL HTTPS du backend
- [ ] Tester un appel téléphonique
- [ ] Vérifier que les réservations apparaissent en temps réel dans l'admin
- [ ] Générer un JWT_SECRET fort et unique
- [ ] Configurer les CORS avec les bonnes URLs

## 🧪 Test après Déploiement

1. **Tester l'API** :
   ```bash
   curl https://votre-backend.railway.app/health
   ```

2. **Tester l'authentification** :
   ```bash
   curl -X POST https://votre-backend.railway.app/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Tester un appel Twilio** :
   - Appeler votre numéro Twilio
   - Vérifier que l'IA répond
   - Faire une réservation
   - Vérifier qu'elle apparaît dans l'admin

## 🔒 Sécurité en Production

- ✅ Utiliser des secrets forts (JWT_SECRET)
- ✅ Ne jamais commiter les `.env` dans Git
- ✅ Utiliser HTTPS uniquement
- ✅ Configurer CORS correctement
- ✅ Activer le rate limiting
- ✅ Utiliser MongoDB Atlas avec authentification
- ✅ Limiter les IPs autorisées dans MongoDB Atlas
- ✅ Utiliser des variables d'environnement sécurisées

## 💰 Coûts Estimés

- **Railway** : Gratuit jusqu'à 500$ de crédit/mois, puis ~5-10$/mois
- **Render** : Gratuit avec limitations, puis ~7$/mois
- **MongoDB Atlas** : Gratuit (M0 cluster), puis ~9$/mois
- **Twilio** : Pay-as-you-go (~0.01$/minute d'appel)
- **OpenAI** : Pay-as-you-go (~0.006$/minute de transcription)

**Total estimé** : 0-20$/mois selon l'usage

## 🆘 Support

En cas de problème :
1. Vérifier les logs dans le dashboard de votre plateforme
2. Vérifier que toutes les variables d'environnement sont configurées
3. Vérifier que MongoDB Atlas est accessible
4. Vérifier que les URLs Twilio sont correctes

