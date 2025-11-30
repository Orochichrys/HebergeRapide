# Guide : Configurer Upstash Redis via Vercel Marketplace

## Étapes détaillées

### 1. Accéder à la Marketplace
1. Dans votre projet Vercel → **Storage**
2. Cliquez sur **"Create Database"** ou **"Browse Marketplace"**

### 2. Sélectionner Upstash
1. Dans la liste des fournisseurs, trouvez **"Upstash"**
2. Description : "Base de données sans serveur (Redis, Vector, Queue, Recherche)"
3. Cliquez sur **"Add Integration"** ou **"Create"**

### 3. Créer un compte Upstash (si nécessaire)
1. Si vous n'avez pas de compte, vous serez redirigé vers Upstash
2. Créez un compte gratuit (pas de carte de crédit requise)
3. Le plan gratuit inclut :
   - 10 000 commandes/jour
   - 256 MB de stockage
   - Parfait pour une démo !

### 4. Créer la base de données Redis
1. Dans Upstash, créez une nouvelle base de données Redis
2. Choisissez une région proche de vos utilisateurs
3. Donnez un nom (ex: `heberge-rapide-redis`)

### 5. Lier à Vercel
1. Retournez dans Vercel
2. Vercel détectera automatiquement votre base Upstash
3. Cliquez sur **"Link"** ou **"Connect"**
4. Les variables d'environnement seront automatiquement configurées :
   - `KV_REST_API_URL` (sera l'URL Upstash)
   - `KV_REST_API_TOKEN` (sera le token Upstash)

### 6. Redéployer
1. Vercel redéploiera automatiquement votre projet
2. Ou déclenchez manuellement un nouveau déploiement

## Compatibilité

✅ **Bonne nouvelle** : Votre code actuel avec `@vercel/kv` fonctionne directement avec Upstash Redis !
- Pas besoin de modifier le code
- `@vercel/kv` est compatible avec Upstash Redis
- Les variables d'environnement sont automatiquement mappées

## Test

Après configuration, testez :

```powershell
curl.exe -X POST https://heberge-rapide.vercel.app/api/v1/deploy `
  -H "Authorization: Bearer hr_live_jprlb2joi2p_1764513495321" `
  -H "Content-Type: application/json" `
  -d "{\"name\": \"test\", \"html\": \"<h1>Hello</h1>\"}"
```

## Alternative : Configuration manuelle

Si vous préférez configurer manuellement :

1. Créez un compte sur [upstash.com](https://upstash.com)
2. Créez une base Redis
3. Dans Vercel → Settings → Environment Variables, ajoutez :
   - `KV_REST_API_URL` = URL de votre base Upstash
   - `KV_REST_API_TOKEN` = Token de votre base Upstash

Votre code fonctionnera exactement de la même manière !

