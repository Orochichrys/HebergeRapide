const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'emmanuelbissa0000@gmail.com').split(',').map(e => e.trim().toLowerCase());
// Helper to check if email is admin
const isAdminEmail = (email: string): boolean => {
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Déterminer l'URL de redirection en fonction de l'environnement
const getRedirectUri = (req: VercelRequest): string => {
    const host = req.headers.host || 'localhost:5173';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}/api/v1/auth?action=google-callback`;
};

const getFrontendUrl = (req: VercelRequest): string => {
    const host = req.headers.host || 'localhost:5173';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
};

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Ajouter les en-têtes CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    console.log(`[AUTH] Action: ${action}, Method: ${req.method}`);

    // Handle different auth actions
    switch (action) {
        case 'login':
            return handleLogin(req, res);
        case 'register':
            return handleRegister(req, res);
        case 'google':
            return handleGoogleOAuth(req, res);
        case 'google-callback':
            return handleGoogleCallback(req, res);
        default:
            return res.status(400).json({ error: 'Invalid action' });
    }
}

// Login handler
async function handleLogin(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    console.log(`[LOGIN] Attempting login for: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        // Récupérer l'ID utilisateur depuis l'email
        const userId = await kv.get(`user:email:${email}`);

        if (!userId || typeof userId !== 'string') {
            console.log(`[LOGIN] User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Récupérer les données de l'utilisateur
        const userData = await kv.get(`user:${userId}`);

        if (!userData) {
            console.log(`[LOGIN] User data not found for ID: ${userId}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

        console.log(`[LOGIN] User found, checking password...`);

        // Vérifier si l'utilisateur a un mot de passe (peut être un compte Google uniquement)
        if (!user.password) {
            console.log(`[LOGIN] User has no password (Google-only account): ${email}`);
            return res.status(401).json({
                error: 'Ce compte utilise Google Auth. Veuillez vous connecter avec Google.'
            });
        }

        // Vérifier le mot de passe
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            console.log(`[LOGIN] Invalid password for: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[LOGIN] Password valid, generating token...`);

        // Générer le token JWT
        const role = isAdminEmail(user.email) ? 'admin' : 'user';
        const token = jwt.sign(
            { userId: user.id, email: user.email, role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        const { password: _, ...userWithoutPassword } = user;
        console.log(`[LOGIN] Success for: ${email}`);
        // Log activity
        await logActivity('login', { email, method: 'password' }, req, { id: user.id, email: user.email, name: user.name });
        return res.json({ token, user: { ...userWithoutPassword, role } });
    } catch (error: any) {
        console.error('[LOGIN] Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// Register handler
async function handleRegister(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, password } = req.body;

    console.log(`[REGISTER] Attempting registration for: ${email}`);

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validation du mot de passe
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Vérifier si l'email existe déjà
        const existingUser = await kv.get(`user:email:${email}`);

        if (existingUser) {
            console.log(`[REGISTER] Email already exists: ${email}`);
            return res.status(400).json({ error: 'Email already registered' });
        }

        console.log(`[REGISTER] Hashing password...`);

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = nanoid();

        const user = {
            id: userId,
            name,
            email,
            password: hashedPassword,
            createdAt: Date.now(),
        };

        console.log(`[REGISTER] Saving user data...`);

        // Sauvegarder l'utilisateur
        await kv.set(`user:${userId}`, JSON.stringify(user));
        await kv.set(`user:email:${email}`, userId);

        console.log(`[REGISTER] Success for: ${email}`);

        // Log activity
        await logActivity('register', { email, name }, req, { id: userId, email, name });

        return res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
        console.error('[REGISTER] Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// Google OAuth initiation
async function handleGoogleOAuth(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const redirectUri = getRedirectUri(req);
    console.log(`[GOOGLE_OAUTH] Redirect URI: ${redirectUri}`);

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'email profile');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');

    res.redirect(googleAuthUrl.toString());
}

// Google OAuth callback
async function handleGoogleCallback(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, error } = req.query;
    const frontendUrl = getFrontendUrl(req);
    const redirectUri = getRedirectUri(req);

    console.log(`[GOOGLE_CALLBACK] Frontend URL: ${frontendUrl}`);
    console.log(`[GOOGLE_CALLBACK] Redirect URI: ${redirectUri}`);

    if (error) {
        console.error(`[GOOGLE_CALLBACK] Error from Google: ${error}`);
        return res.redirect(`${frontendUrl}/?error=google_auth_failed`);
    }

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    try {
        console.log(`[GOOGLE_CALLBACK] Exchanging code for token...`);

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error(`[GOOGLE_CALLBACK] Token exchange failed:`, errorText);
            throw new Error('Failed to exchange code for token');
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        console.log(`[GOOGLE_CALLBACK] Getting user info...`);

        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();

        console.log(`[GOOGLE_CALLBACK] User info retrieved for: ${googleUser.email}`);

        let userIdFromEmail = await kv.get(`user:email:${googleUser.email}`);
        let userId: string;
        let user: any;

        if (!userIdFromEmail) {
            // Créer un nouvel utilisateur
            userId = nanoid();
            user = {
                id: userId,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                googleId: googleUser.id,
                createdAt: Date.now(),
            };

            await kv.set(`user:${userId}`, JSON.stringify(user));
            await kv.set(`user:email:${googleUser.email}`, userId);
            await kv.set(`user:google:${googleUser.id}`, userId);

            console.log(`[GOOGLE_CALLBACK] New user created: ${googleUser.email}`);
        } else {
            // Utilisateur existant - récupérer et mettre à jour avec les infos Google
            userId = typeof userIdFromEmail === 'string' ? userIdFromEmail : (userIdFromEmail as any).id;
            const userData = await kv.get(`user:${userId}`);
            user = typeof userData === 'string' ? JSON.parse(userData) : userData;

            console.log(`[GOOGLE_CALLBACK] Existing user found: ${googleUser.email}`);

            // Mettre à jour avec les informations Google si ce n'est pas déjà fait
            if (!user.googleId) {
                user.googleId = googleUser.id;
                user.picture = googleUser.picture;
                user.name = googleUser.name; // Mettre à jour le nom aussi

                await kv.set(`user:${userId}`, JSON.stringify(user));
                await kv.set(`user:google:${googleUser.id}`, userId);

                console.log(`[GOOGLE_CALLBACK] Updated existing user with Google data: ${googleUser.email}`);
            }
        }

        const role = isAdminEmail(googleUser.email) ? 'admin' : 'user';
        const token = jwt.sign(
            { userId, email: googleUser.email, role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        // Log activity
        const activityType = userIdFromEmail ? 'login' : 'register';
        await logActivity(activityType, { email: googleUser.email, method: 'google' }, req, { id: userId, email: googleUser.email, name: user.name });
        console.log(`[GOOGLE_CALLBACK] Redirecting to frontend with token`);
        // Add role to user object
        const userWithRole = { ...user, role };
        res.redirect(`${frontendUrl}/?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithRole))}`);
    } catch (error: any) {
        console.error('[GOOGLE_CALLBACK] Error:', error);
        res.redirect(`${frontendUrl}/?error=google_auth_failed`);
    }
}