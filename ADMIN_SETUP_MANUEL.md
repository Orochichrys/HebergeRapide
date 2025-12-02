# Guide de modification manuelle

Les modifications automatiques du fichier `auth.ts` causent malheureusement des corruptions de fichier. Voici le guide pour les appliquer **manuellement en toute sécurité** :

## Étape 1 : Ouvrir auth.ts

Ouvrez `api/v1/auth.ts` dans votre éditeur.

## Étape 2 : Ajouter l'import (ligne 6)

Après la ligne 5 (`import bcrypt from 'bcryptjs';`), ajoutez :

```typescript
import { logActivity } from '../utils/activityLogger';
```

## Étape 3 : Ajouter la configuration admin (après ligne 8)

Après `const JWT_SECRET = ...`, ajoutez ces lignes :

```typescript
// Admin emails configuration
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'emmanuelbissa0000@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

// Helper to check if email is admin
const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
```

## Étape 4 : Modifier handleLogin (autour de la ligne 140)

Trouvez cette section :
```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const { password: _, ...userWithoutPassword } = user;

console.log(`[LOGIN] Success for: ${email}`);

return res.json({ token, user: userWithoutPassword });
```

Remplacez par :
```typescript
// Déterminer le rôle
const role = isAdminEmail(user.email) ? 'admin' : 'user';

const token = jwt.sign(
  { userId: user.id, email: user.email, role },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const { password: _, ...userWithoutPassword } = user;

console.log(`[LOGIN] Success for: ${email}`);

// Log activity
await logActivity('login', { email, method: 'password' }, req, { 
  id: user.id, 
  email: user.email, 
  name: user.name 
});

return res.json({ token, user: { ...userWithoutPassword, role } });
```

## Étape 5 : Modifier handleRegister (autour de la ligne 190)

Après `console.log(\`[REGISTER] Success for: ${email}\`);`, ajoutez :

```typescript
// Log activity
await logActivity('register', { email, name }, req, { id: userId, email, name });
```

## Étape 6 : Modifier handleGoogleCallback (autour de la ligne 320)

Trouvez :
```typescript
const token = jwt.sign(
  { userId, email: googleUser.email },
  JWT_SECRET,
  { expiresIn: '30d' }
);

console.log(`[GOOGLE_CALLBACK] Redirecting to frontend with token`);

res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
```

Remplacez par :
```typescript
// Déterminer le rôle
const role = isAdminEmail(googleUser.email) ? 'admin' : 'user';

const token = jwt.sign(
  { userId, email: googleUser.email, role },
  JWT_SECRET,
  { expiresIn: '30d' }
);

// Log activity
const activityType = userIdFromEmail ? 'login' : 'register';
await logActivity(activityType, { email: googleUser.email, method: 'google' }, req, { 
  id: userId, 
  email: googleUser.email, 
  name: user.name 
});

console.log(`[GOOGLE_CALLBACK] Redirecting to frontend with token`);

// Add role to user object
const userWithRole = { ...user, role };
res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithRole))}`);
```

## Étape 7 : Modifier Navbar.tsx

Ouvrez `components/Navbar.tsx` et trouvez la ligne ~85 (après la boucle `NAV_ITEMS.map()`).

Juste avant `</div>` qui ferme la div de navigation, ajoutez :

```typescript
{/* Admin Link - Only visible to admins */}
{user?.role === 'admin' && (
  <NavLink
    to="/admin"
    className={({ isActive }) =>
      `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-brand-500/10 text-brand-400'
          : 'text-gray-300 hover:bg-border hover:text-foreground'
      }`
    }
  >
    <Settings className="w-4 h-4" />
    <span className="hidden md:inline">Admin</span>
  </NavLink>
)}
```

## Vérification

Après avoir appliqué ces modifications :
1. Vérifiez qu'il n'y a pas d'erreurs TypeScript
2. Testez la compilation : `npm run build`
3. Si OK, déployez avec `git push`

✅ Vous avez terminé !
