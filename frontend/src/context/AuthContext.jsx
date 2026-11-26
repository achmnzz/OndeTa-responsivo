import { useState } from 'react';
import api, { STORAGE_KEY, getStoredSession } from '../services/api';
import { getErrorMessage } from '../services/apiErrors';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession()?.user ?? null);

  async function login(email, password, { reactivate = false } = {}) {
    try {
      const endpoint = reactivate ? '/auth/reactivate' : '/auth/login';
      const response = await api.post(endpoint, { email, password });
      const data = response.data;

      setUser(data.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      return data;
    } catch (error) {
      const err = new Error(getErrorMessage(error, 'Erro ao fazer login'), { cause: error });
      err.accountInactive =
        !reactivate &&
        error.response?.status === 409 &&
        String(error.response?.data?.message ?? '').includes('inactive');
      throw err;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
