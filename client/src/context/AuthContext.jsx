import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import { tokenStore } from '../api/client';

const AuthContext = createContext(null);

export const ROLES = { STUDENT: 'student', INSTRUCTOR: 'instructor', ADMIN: 'admin' };

/** Where each role lands after logging in. */
export const homeFor = (role) =>
  role === ROLES.ADMIN ? '/admin' : role === ROLES.INSTRUCTOR ? '/instructor' : '/student';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `booting` is true only during the initial session restore, so the app can
  // show a splash instead of flashing the login page for a signed-in user.
  const [booting, setBooting] = useState(true);

  const restore = useCallback(async () => {
    if (!tokenStore.get()) {
      setBooting(false);
      return;
    }
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  // The axios interceptor fires this when a refresh fails for good.
  useEffect(() => {
    const onExpired = () => {
      setUser((current) => {
        if (current) toast.error('Your session expired. Please log in again.');
        return null;
      });
    };
    window.addEventListener('lumina:session-expired', onExpired);
    return () => window.removeEventListener('lumina:session-expired', onExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    tokenStore.set(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    tokenStore.set(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the local session is cleared regardless of what the server says */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  /** Merge fresh fields after a profile edit without a full refetch. */
  const patchUser = useCallback((fields) => {
    setUser((current) => (current ? { ...current, ...fields } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      isStudent: user?.role === ROLES.STUDENT,
      isInstructor: user?.role === ROLES.INSTRUCTOR,
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      patchUser,
      refresh: restore,
      home: user ? homeFor(user.role) : '/login',
    }),
    [user, booting, login, register, logout, patchUser, restore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
