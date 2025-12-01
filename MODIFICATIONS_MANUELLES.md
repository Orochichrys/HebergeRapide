# Modifications Manuelles Requises

## Fichiers Créés ✅

### 1. DeployForm.tsx (Simplifié)
- ✅ Suppression des éditeurs de code
- ✅ Upload de fichiers uniquement
- ✅ Affichage des fichiers uploadés

### 2. CodeEditorPage.tsx (Nouveau)
- ✅ Éditeurs à onglets (HTML/CSS/JS)
- ✅ Chat IA intégré
- ✅ Bouton Sauvegarder
- ✅ Navigation retour

### 3. Dashboard.tsx (Mis à jour)
- ✅ Bouton "Éditer" ajouté pour chaque site

---

## Modifications Manuelles Nécessaires

### 1. App.tsx - Ajouter l'import et la route

**Ligne 9 - Ajouter l'import :**
```tsx
import CodeEditorPage from './components/CodeEditorPage';
```

**Après la ligne 189 - Ajouter la route :**
```tsx
<Route path="/edit/:id" element={
  <CodeEditorPage token={token} />
} />
```

### 2. Créer l'endpoint API PUT

**Créer le fichier : `api/v1/sites/[id].ts`**

Modifier la fonction handler existante pour supporter PUT :

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid deployment ID' });
  }

  // Vérifier l'authentification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const userId = decoded.userId;

  // GET - Récupérer un déploiement
  if (req.method === 'GET') {
    try {
      const deploymentData = await kv.get(`deployment:${id}`);
      if (!deploymentData) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      const deployment = typeof deploymentData === 'string' 
        ? JSON.parse(deploymentData) 
        : deploymentData;

      if (deployment.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this deployment' });
      }

      return res.status(200).json(deployment);
    } catch (error) {
      console.error('Error fetching deployment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT - Mettre à jour un déploiement
  if (req.method === 'PUT') {
    try {
      const deploymentData = await kv.get(`deployment:${id}`);
      if (!deploymentData) {
        return res.status(404).json({ error: 'Deployment not found' });
      }

      const deployment = typeof deploymentData === 'string' 
        ? JSON.parse(deploymentData) 
        : deploymentData;

      if (deployment.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this deployment' });
      }

      const { code, css, js } = req.body;

      // Mettre à jour le déploiement
      const updatedDeployment = {
        ...deployment,
        code: code !== undefined ? code : deployment.code,
        css: css !== undefined ? css : deployment.css,
        js: js !== undefined ? js : deployment.js
      };

      await kv.set(`deployment:${id}`, JSON.stringify(updatedDeployment));

      return res.status(200).json(updatedDeployment);
    } catch (error) {
      console.error('Error updating deployment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE - Supprimer un déploiement (déjà implémenté)
  if (req.method === 'DELETE') {
    // ... code existant pour DELETE
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

## Résumé

**Fichiers prêts :**
- ✅ `components/DeployForm.tsx`
- ✅ `components/CodeEditorPage.tsx`
- ✅ `components/Dashboard.tsx`

**Modifications manuelles :**
1. Ajouter import et route dans `App.tsx`
2. Ajouter méthode PUT dans `api/v1/sites/[id].ts`

Une fois ces modifications faites, vous pourrez :
1. Uploader des fichiers HTML/CSS/JS
2. Cliquer sur "Éditer" dans le dashboard
3. Modifier le code avec l'aide de l'IA
4. Sauvegarder les changements
