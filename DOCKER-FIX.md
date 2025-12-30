# 🔧 Fix pour l'erreur Docker Build

## Problème rencontré

L'erreur suivante apparaissait lors du build Docker :
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Solution appliquée

### 1. Correction du package.json backend

Le package `@types/passport-local-mongoose@^8.0.0` n'existe pas sur npm. Il a été retiré du `package.json` car il n'est pas essentiel (TypeScript peut fonctionner sans).

### 2. Modification des Dockerfiles

Tous les Dockerfiles ont été modifiés pour utiliser `npm install` si `package-lock.json` n'existe pas :

**Avant** :
```dockerfile
RUN npm ci
```

**Après** :
```dockerfile
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
```

Cela permet au build de fonctionner avec ou sans `package-lock.json`.

### 3. Dockerfiles modifiés

- ✅ `backend/Dockerfile`
- ✅ `microservices/ai/Dockerfile`
- ✅ `admin/Dockerfile`

## Recommandation : Générer les package-lock.json

Pour des builds plus reproductibles, il est recommandé de générer les `package-lock.json` :

```bash
# Backend
cd backend
npm install
git add package-lock.json

# AI Microservice
cd ../microservices/ai
npm install
git add package-lock.json

# Admin
cd ../../admin
npm install
git add package-lock.json
```

Puis commiter :
```bash
git commit -m "Add package-lock.json files for reproducible builds"
git push
```

## Vérification

Pour vérifier que le build fonctionne maintenant :

```bash
# Test local du build backend
cd backend
docker build -t backend-test .

# Test local du build AI
cd ../microservices/ai
docker build -t ai-test .

# Test local du build Admin
cd ../../admin
docker build -t admin-test .
```

Les builds devraient maintenant réussir même sans `package-lock.json` dans le repo.

