import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { cors } from 'hono/cors';

type Bindings = {
  JWT_SECRET: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// JWT middleware for protected routes
const jwtMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET,
});

// Health check
app.get('/', (c) => c.text('Auth Service Ready'));

// Database test endpoint
app.get('/api/auth/test-db', async (c) => {
  try {
    // Try a simple SQLite system query first
    const tablesResult = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as any;
    
    const tableNames = tablesResult?.results?.map((t: any) => t.name) || [];
    
    return c.json({
      success: true,
      message: 'Database connection successful',
      tables: tableNames,
      tableCount: tableNames.length
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      simpleError: String(error)
    }, 500);
  }
});

// User registration
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Hash password (in production, use bcrypt or similar)
    // For demo purposes, we'll use a simple hash
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, name || null, now, now).run();

    // Generate JWT token
    const token = await sign(
      { userId, email, name: name || '' },
      c.env.JWT_SECRET,
      'HS256'
    );

    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name: name || '',
        created_at: now
      }
    }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// User login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const token = await sign(
      { userId: user.id, email: user.email, name: user.name || '' },
      c.env.JWT_SECRET,
      'HS256'
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user profile
app.get('/api/auth/me', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ success: true, user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Refresh token
app.post('/api/auth/refresh', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    
    // Generate new token
    const token = await sign(
      { userId: payload.userId, email: payload.email, name: payload.name || '' },
      c.env.JWT_SECRET,
      'HS256'
    );

    return c.json({
      success: true,
      token
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return c.json({ error: 'Failed to refresh token' }, 500);
  }
});

// Password reset request
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(email).first();

    if (user) {
      // In production, send reset email here
      // For demo, just return success
      return c.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent'
      });
    }

    // Return same message for security (don't reveal if user exists)
    return c.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to process reset request' }, 500);
  }
});

// Update password
app.put('/api/auth/update-password', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }

    // Get user with password hash
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(payload.userId).first() as any;

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(newPasswordHash, new Date().toISOString(), payload.userId).run();

    return c.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    return c.json({ error: 'Failed to update password' }, 500);
  }
});

// Helper functions for password hashing
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or Argon2
  // For demo, we'll use a simple SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// Users schema creation endpoint
app.post('/api/auth/init-schema', async (c) => {
  try {
    await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    return c.json({
      success: true,
      message: 'Auth schema initialized successfully'
    });
  } catch (error: any) {
    console.error('Schema init error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
