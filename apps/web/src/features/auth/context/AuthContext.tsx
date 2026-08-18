import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from 'react';

import { flushSync } from 'react-dom';

import type { AuthUser, LoginResponseData } from '@medscreen/types';

import {

  apiClient,

  ApiClientError,

  clearAuthToken,

  getAuthToken,

  setAuthToken,

} from '../../../shared/lib/api-client';

import { clearStoredActiveCampaignId } from '../../campaign/lib/campaign-storage';

import { clearStoredActivePatientId } from '../../patients/lib/patient-storage';



const USER_STORAGE_KEY = 'medscreen_user';



interface AuthContextValue {

  user: AuthUser | null;

  token: string | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;

  establishSession: (data: LoginResponseData, rememberMe?: boolean) => void;

  logout: () => Promise<void>;

}



const AuthContext = createContext<AuthContextValue | undefined>(undefined);



function loadStoredUser(): AuthUser | null {

  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) return null;



  try {

    return JSON.parse(raw) as AuthUser;

  } catch {

    localStorage.removeItem(USER_STORAGE_KEY);

    return null;

  }

}



function persistUser(user: AuthUser | null, remember: boolean): void {

  if (remember && user) {

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  } else {

    localStorage.removeItem(USER_STORAGE_KEY);

  }

}



function clearStoredAuthSession(): void {

  clearAuthToken();

  localStorage.removeItem(USER_STORAGE_KEY);

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthUser | null>(null);

  const [token, setTokenState] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    const storedToken = getAuthToken();

    if (!storedToken) {

      setIsLoading(false);

      return;

    }



    setTokenState(storedToken);



    const storedUser = loadStoredUser();

    if (storedUser) {

      setUser(storedUser);

    }



    apiClient

      .getMe()

      .then(({ user: currentUser }) => {

        setUser(currentUser);

        if (localStorage.getItem(USER_STORAGE_KEY)) {

          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));

        }

      })

      .catch(() => {

        clearStoredAuthSession();

        setTokenState(null);

        setUser(null);

      })

      .finally(() => {

        setIsLoading(false);

      });

  }, []);



  const establishSession = useCallback((data: LoginResponseData, rememberMe = false) => {

    flushSync(() => {

      setAuthToken(data.token, rememberMe);

      setTokenState(data.token);

      setUser(data.user);

      persistUser(data.user, rememberMe);

    });

  }, []);



  const login = useCallback(async (email: string, password: string, rememberMe = false) => {

    clearStoredAuthSession();

    setTokenState(null);

    setUser(null);



    const data = await apiClient.login({ email, password });

    establishSession(data, rememberMe);

  }, [establishSession]);



  const logout = useCallback(async () => {

    try {

      await apiClient.logout();

    } catch {

      // Local session is cleared even if the audit request fails.

    }



    if (user) {

      clearStoredActiveCampaignId(user.id);

      clearStoredActivePatientId(user.id);

    }

    clearStoredAuthSession();

    setTokenState(null);

    setUser(null);

  }, [user]);



  const value = useMemo<AuthContextValue>(

    () => ({

      user,

      token,

      isAuthenticated: Boolean(token && user),

      isLoading,

      login,

      establishSession,

      logout,

    }),

    [user, token, isLoading, login, establishSession, logout],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth(): AuthContextValue {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error('useAuth must be used within AuthProvider');

  }

  return context;

}



export { ApiClientError };


