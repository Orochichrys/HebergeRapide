# Guide : Activer Vercel KV

## Étape 1 : Accéder au Dashboard Vercel

1. Allez sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **HebergeRapide** (ou le nom de votre projet)

## Étape 2 : Créer une base de données KV

1. Dans votre projet, cliquez sur l'onglet **"Storage"** dans le menu de gauche
2. Cliquez sur le bouton **"Create Database"**
3. Sélectionnez **"KV"** (Key-Value store basé sur Redis)
4. Choisissez un nom pour votre base de données (ex: `heberge-rapide-kv`)
5. Sélectionnez la région la plus proche de vos utilisateurs
6. Cliquez sur **"Create"**

## Étape 3 : Lier la base de données au projet

Une fois la base de données créée :

1. Vercel vous proposera automatiquement de la lier à votre projet
2. Cliquez sur **"Link"** ou **"Connect"**
3. Les variables d'environnement seront automatiquement ajoutées à votre projet :
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

## Étape 4 : Vérifier la configuration

1. Allez dans **Settings** → **Environment Variables**
2. Vérifiez que les variables KV sont présentes (elles sont automatiquement configurées)

## Étape 5 : Redéployer votre projet

1. Après avoir créé et lié la base de données, Vercel peut redéployer automatiquement
2. Sinon, allez dans **Deployments** et déclenchez un nouveau déploiement
3. Ou poussez un commit vers votre dépôt Git

## Vérification

Une fois déployé, testez l'API :

```powershell
curl.exe -X POST https://heberge-rapide.vercel.app/api/v1/deploy `
  -H "Authorization: Bearer hr_live_votre_cle" `
  -H "Content-Type: application/json" `
  -d "{\"name\": \"test\", \"html\": \"<h1>Hello</h1>\"}"
```

Si vous obtenez une erreur concernant la base de données, vérifiez que :
- La base de données KV est bien créée
- Elle est liée à votre projet
- Le projet a été redéployé après la création de la base de données

## Alternative : Utiliser Vercel CLI

Si vous préférez utiliser la ligne de commande :

```bash
# Installer Vercel CLI (si pas déjà installé)
npm i -g vercel

# Se connecter
vercel login

# Créer une base de données KV
vercel kv create heberge-rapide-kv

# Lier au projet
vercel kv link heberge-rapide-kv
```

## Coûts

- **Plan Hobby (gratuit)** : 256 MB de stockage, 30 000 requêtes/jour
- **Plan Pro** : 1 GB de stockage, 1 million de requêtes/jour

Pour une démo, le plan gratuit est largement suffisant !

