import { AuthUser } from '../types';

const AUTH_USER_KEY = 'mineguard_auth_user';
const AUTH_TOKEN_KEY = 'isAuthenticated';

// Clean mock registry for development and role-based testing
const MOCK_USERS: Record<string, { passwords: string[]; user: AuthUser }> = {
  'controller@mineguard.com': {
    passwords: ['controller123', 'MineGuard@123'],
    user: {
      id: 'USR-MC-01',
      email: 'controller@mineguard.com',
      name: 'Mine Controller',
      role: 'MINE_CONTROLLER',
      gateway_id: 'GW-01',
      panel_id: 'P-01',
      mesh_id: 'MESH-01',
    }
  },
  'planner@mineguard.com': {
    passwords: ['planner123', 'MineGuard@123'],
    user: {
      id: 'USR-PLN-01',
      email: 'planner@mineguard.com',
      name: 'Mine Planner',
      role: 'PLANNER',
      gateway_id: 'GW-01',
      panel_id: 'P-01',
      mesh_id: 'MESH-01',
    }
  },
  'regulator@mineguard.com': {
    passwords: ['regulator123', 'MineGuard@123'],
    user: {
      id: 'USR-REG-01',
      email: 'regulator@mineguard.com',
      name: 'Safety Regulator',
      role: 'REGULATOR',
      gateway_id: 'UNASSIGNED',
      panel_id: 'UNASSIGNED',
    }
  },
  'admin@mineguard.com': {
    passwords: ['admin123', 'MineGuard@123'],
    user: {
      id: 'USR-ADM-01',
      email: 'admin@mineguard.com',
      name: 'System Admin',
      role: 'ADMIN',
      gateway_id: 'ALL',
      panel_id: 'ALL',
      mesh_id: 'ALL',
    }
  }
};

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private listeners: Set<AuthListener> = new Set();

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(user: AuthUser | null) {
    this.listeners.forEach(fn => fn(user));
  }

  public getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch (e) {
      console.error('Failed to parse auth user:', e);
    }
    return null;
  }

  public setCurrentUser(user: AuthUser): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, 'true');
    this.notify(user);
  }

  public isAuthenticated(): boolean {
    return localStorage.getItem(AUTH_TOKEN_KEY) === 'true' && this.getCurrentUser() !== null;
  }

  public isMineController(): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === 'MINE_CONTROLLER';
  }

  public async login(email: string, pass: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const account = MOCK_USERS[normalizedEmail];

    if (!account) {
      return {
        success: false,
        error: 'Account not found. Available test accounts: controller@mineguard.com, planner@mineguard.com, regulator@mineguard.com'
      };
    }

    if (!account.passwords.includes(pass)) {
      return {
        success: false,
        error: `Incorrect password for ${normalizedEmail}.`
      };
    }

    this.setCurrentUser(account.user);
    return {
      success: true,
      user: account.user
    };
  }

  public logout(): void {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.notify(null);
  }
}

export const authService = new AuthService();
