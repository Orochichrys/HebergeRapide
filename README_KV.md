# Configuration Vercel KV

Pour que l'API fonctionne, vous devez configurer Vercel KV (Redis) :

## Étapes de configuration

1. **Créer une base de données KV sur Vercel** :
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Sélectionnez votre projet
   - Allez dans l'onglet "Storage"
   - Cliquez sur "Create Database" → "KV"
   - Créez une nouvelle base de données KV

2. **Lier la base de données à votre projet** :
   - Une fois créée, la base de données sera automatiquement liée à votre projet
   - Les variables d'environnement seront automatiquement configurées

3. **Variables d'environnement** :
   - Vercel configure automatiquement :
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

## Test de l'API

Une fois déployé, testez avec :

```powershell
# Déployer un site
curl.exe -X POST https://heberge-rapide.vercel.app/api/v1/deploy `
  -H "Authorization: Bearer hr_live_votre_cle" `
  -H "Content-Type: application/json" `
  -d "{\"name\": \"test\", \"html\": \"<h1>Hello</h1>\"}"

# Lister vos sites
curl.exe https://heberge-rapide.vercel.app/api/v1/sites `
  -H "Authorization: Bearer hr_live_votre_cle"
```

## URLs courtes

Les URLs générées sont maintenant courtes :
- Avant : `https://heberge-rapide.vercel.app/#/s/test?d=JTdCJTIybmFtZSUyMiUzQSUyMnRlc3QlMjIlMkMlMjJjb2RlJTIyJTNBJTIyc2FsdXQlMjIlN0Q=`
- Maintenant : `https://heberge-rapide.vercel.app/#/s/test`

Les données sont stockées dans la base de données et récupérées automatiquement.

