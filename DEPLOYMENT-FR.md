# 🚀 Guide de Déploiement en Ligne (Sans PC)

## ⚠️ Important : ngrok vs Déploiement Cloud

**ngrok** nécessite que votre PC soit allumé et le serveur en cours d'exécution. Ce n'est **PAS** une solution pour un site accessible 24/7.

Pour avoir un site qui fonctionne **sans votre PC**, vous devez déployer sur un **serveur cloud**.

## 🎯 Solution Recommandée : Railway (Gratuit pour commencer)

Railway est la solution la plus simple pour déployer rapidement votre application.

### Étape 1 : Créer MongoDB Atlas (Base de données cloud)

1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un compte gratuit
3. Créer un cluster gratuit (M0 - Free)
4. Créer un utilisateur de base de données (username/password)
5. Whitelist IP : Cliquer sur "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
6. Cliquer sur "Connect" → "Connect your application"
7. Copier la connection string (elle ressemble à : `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/...`)

### Étape 2 : Déployer sur Railway

1. **Créer un compte** : https://railway.app (connectez-vous avec GitHub)

2. **Créer un nouveau projet** :
   - Cliquer sur "New Project"
   - Choisir "Deploy from GitHub repo"
   - Sélectionner votre repository GitLab (ou pousser le code sur GitHub)

3. **Déployer le Backend** :
   
   **a. Créer le service** :
   - Dans votre projet Railway, cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner votre repository
   - Railway va scanner le repo et peut détecter automatiquement le backend
   
   **b. Configurer le service** :
   - Si Railway n'a pas détecté automatiquement, aller dans **Settings** du service :
     - **Root Directory** : `backend`
     - **Build Command** : `npm install && npm run build`
     - **Start Command** : `npm start`
   
   **c. Configurer les variables d'environnement** :
   - Cliquer sur le service "Backend"
   - Aller dans l'onglet **"Variables"** (ou "Environment")
   - Cliquer sur **"+ New Variable"** pour chaque variable :
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
   
   **d. Obtenir l'URL HTTPS** :
   - Aller dans **Settings** → **Networking**
   - Cliquer sur **"Generate Domain"** si ce n'est pas déjà fait
   - Railway génère une URL comme : `votre-backend-production.up.railway.app`
   - **Copier cette URL** - vous en aurez besoin pour les autres services

4. **Déployer le service AI** :
   
   **a. Créer le service** :
   - Dans votre projet Railway, cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner le même repository
   
   **b. Configurer le service** :
   - Dans **Settings** :
     - **Root Directory** : `microservices/ai`
     - **Build Command** : `npm install && npm run build`
     - **Start Command** : `npm start`
   
   **c. Configurer les variables** :
   - Aller dans **Variables** :
     ```
     NODE_ENV=production
     PORT=4000
     OPENAI_API_KEY=votre-openai-api-key
     CORS_ORIGINS=https://votre-backend.railway.app
     ```
   
   **d. Obtenir l'URL HTTPS** :
   - Dans **Settings** → **Networking**
   - Cliquer sur **"Generate Domain"**
   - **Copier l'URL** (ex: `votre-ai-production.up.railway.app`)
   
   **e. Mettre à jour le Backend** :
   - Retourner au service Backend → **Variables**
   - Mettre à jour `AI_SERVICE_URL` avec l'URL du service AI
   - Railway redéploiera automatiquement le backend

5. **Déployer l'Admin** :
   
   **a. Créer le service** :
   - Cliquer sur **"+ New"** → **"GitHub Repo"**
   - Sélectionner le même repository
   
   **b. Configurer le service** :
   - Dans **Settings** :
     - **Root Directory** : `admin`
     - **Build Command** : `npm install && npm run build`
     - **Start Command** : Railway peut servir automatiquement les fichiers statiques, ou utiliser le Dockerfile fourni
   
   **c. Configurer les variables** :
   - Aller dans **Variables** :
     ```
     NODE_ENV=production
     VITE_API_URL=https://votre-backend.railway.app
     ```
   - **Important** : Les variables `VITE_*` doivent être définies au moment du build
   
   **d. Obtenir l'URL HTTPS** :
   - Dans **Settings** → **Networking**
   - Cliquer sur **"Generate Domain"**
   - **Copier l'URL** (ex: `votre-admin-production.up.railway.app`)
   
   **e. Mettre à jour le Backend** :
   - Retourner au service Backend → **Variables**
   - Mettre à jour :
     ```
     ADMIN_ORIGIN=https://votre-admin.railway.app
     CORS_ORIGINS=https://votre-admin.railway.app
     ```

### Étape 3 : Configurer Twilio

1. Aller sur https://console.twilio.com
2. Phone Numbers → Manage → Active Numbers
3. Cliquer sur votre numéro de téléphone
4. Dans "Voice & Fax" :
   - **A CALL COMES IN** : `https://votre-backend.railway.app/twilio/voice/incoming`
   - Cliquer sur "Save"

### Étape 4 : Vérifier les déploiements

1. **Vérifier les logs** :
   - Pour chaque service, aller dans l'onglet **"Deployments"**
   - Cliquer sur le dernier déploiement
   - Vérifier les logs pour s'assurer qu'il n'y a pas d'erreurs
   - Chercher des messages comme "✅ MongoDB connected" ou "🚀 Server running"

2. **Tester les endpoints** :
   ```bash
   # Tester le backend
   curl https://votre-backend.railway.app/health
   # Devrait retourner : {"status":"ok","timestamp":"..."}
   
   # Tester le service AI
   curl https://votre-ai.railway.app/health
   ```

### Étape 5 : Initialiser la Base de Données

1. **Ouvrir un terminal Railway** :
   - Aller sur le service Backend dans Railway
   - Cliquer sur l'onglet **"Deployments"**
   - Cliquer sur **"View Logs"** ou utiliser le terminal intégré (icône terminal en haut à droite)

2. **Exécuter le script de seed** :
   ```bash
   cd backend
   npm run seed
   ```
   Cela crée :
   - Un utilisateur admin : `username: admin`, `password: admin123`
   - Un restaurant par défaut
   - Des tables d'exemple

3. **Vérifier dans les logs** que le seed a réussi :
   - Vous devriez voir : "✅ Admin user created", "✅ Restaurant created", "✅ Created X tables"

### Étape 6 : Tester

1. **Tester l'API** :
   ```bash
   curl https://votre-backend.railway.app/health
   ```

2. **Tester l'admin** :
   - Ouvrir `https://votre-admin.railway.app`
   - Se connecter avec `admin` / `admin123`

3. **Tester un appel** :
   - Appeler votre numéro Twilio
   - L'IA devrait répondre (en français ou anglais selon votre langue)
   - Faire une réservation (ex: "Je voudrais réserver une table pour 4 personnes demain à 19h")
   - Confirmer la réservation quand l'IA demande confirmation
   - Vérifier qu'elle apparaît **instantanément** dans l'admin dashboard (grâce à Socket.io)

## 📸 Structure du Dashboard Railway

Après déploiement, votre projet Railway devrait ressembler à ceci :

```
📁 Projet: restaurant-reservations
├── 🔧 Service: backend
│   ├── Variables (environnement)
│   ├── Deployments (historique des déploiements)
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

## 🔄 Mettre à jour le code

Quand vous modifiez le code et voulez le déployer :

1. **Pousser sur GitHub/GitLab** :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push
   ```

2. **Railway détecte automatiquement** le nouveau commit et redéploie tous les services concernés

3. **Vérifier les déploiements** :
   - Aller dans l'onglet "Deployments" de chaque service
   - Vérifier que le nouveau déploiement est en cours
   - Attendre que le statut passe à "Success"

## 🔧 Alternative : Render.com

Si Railway ne fonctionne pas, vous pouvez utiliser Render :

1. Créer un compte : https://render.com
2. Créer un "New Web Service"
3. Connecter votre repository GitLab/GitHub
4. Root Directory : `backend`
5. Build Command : `npm install && npm run build`
6. Start Command : `npm start`
7. Configurer les variables d'environnement (comme pour Railway)
8. Répéter pour AI et Admin

## 📝 Checklist

- [ ] MongoDB Atlas créé et connection string obtenue
- [ ] Backend déployé sur Railway/Render
- [ ] Service AI déployé
- [ ] Admin déployé
- [ ] Toutes les variables d'environnement configurées
- [ ] URLs HTTPS copiées et mises à jour
- [ ] Twilio webhooks configurés
- [ ] Base de données initialisée (seed)
- [ ] Test de l'API réussi
- [ ] Test de l'admin réussi
- [ ] Test d'appel téléphonique réussi

## 💰 Coûts

- **Railway** : Gratuit jusqu'à 500$ de crédit/mois (suffisant pour commencer)
- **MongoDB Atlas** : Gratuit (cluster M0)
- **Twilio** : Pay-as-you-go (~0.01$/minute)
- **OpenAI** : Pay-as-you-go (~0.006$/minute de transcription)

**Total** : ~0-5$/mois pour un usage modéré

## 🆘 Problèmes Courants

**Le backend ne démarre pas** :
- Vérifier que `USE_HTTPS=false` et `NODE_ENV=production`
- Vérifier que `PORT` est défini (Railway le définit automatiquement)

**Les webhooks Twilio ne fonctionnent pas** :
- Vérifier que l'URL est en HTTPS
- Vérifier que l'URL est accessible publiquement
- Vérifier les logs Railway pour voir les erreurs

**L'admin ne se connecte pas** :
- Vérifier que `VITE_API_URL` pointe vers le bon backend
- Vérifier les CORS dans le backend
- Vérifier la console du navigateur pour les erreurs

## ✅ Résultat

Une fois déployé, votre site sera accessible 24/7 sans avoir besoin de votre PC ! 🎉

