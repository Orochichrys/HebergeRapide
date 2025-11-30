# Guide : Activer Vercel KV via la Marketplace

## Option 1 : Utiliser Upstash Redis (Recommandé)

Upstash propose Redis sans serveur, compatible avec Vercel KV.

### Étapes :

1. **Dans Vercel Dashboard** → Votre projet → **Storage**
2. Cliquez sur **"Create Database"** ou **"Browse Marketplace"**
3. Cherchez **"Upstash"** dans la liste
4. Sélectionnez **"Upstash Redis"**
5. Cliquez sur **"Add Integration"** ou **"Create"**
6. Suivez les instructions pour créer un compte Upstash (gratuit)
7. Créez une nouvelle base de données Redis
8. Vercel liera automatiquement la base à votre projet

### Configuration du code

Si vous utilisez Upstash, le code reste le même car `@vercel/kv` fonctionne avec Upstash Redis !

## Option 2 : Utiliser Vercel KV natif

Vercel KV peut être disponible via la Marketplace :

1. **Dans Vercel Dashboard** → Votre projet → **Storage**
2. Cliquez sur **"Browse Marketplace"** ou **"Create Database"**
3. Cherchez **"Vercel KV"** ou **"KV"**
4. Si disponible, sélectionnez-le et créez la base de données

## Option 3 : Utiliser Redis directement (Upstash)

Si vous préférez utiliser Upstash directement :

1. Allez sur [upstash.com](https://upstash.com)
2. Créez un compte gratuit
3. Créez une base de données Redis
4. Dans Vercel, ajoutez les variables d'environnement manuellement :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Puis modifiez le code pour utiliser `@upstash/redis` au lieu de `@vercel/kv`.

## Vérification

Après configuration, les variables d'environnement suivantes seront disponibles :
- `KV_REST_API_URL` (ou `UPSTASH_REDIS_REST_URL`)
- `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_TOKEN`)

Votre code actuel avec `@vercel/kv` fonctionnera avec Upstash Redis sans modification !

