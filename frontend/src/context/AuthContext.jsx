import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('crmAuthUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const nextUser = { uid: response.data.uid, email: response.data.email };
    localStorage.setItem('crmAuthToken', response.data.token);
    localStorage.setItem('crmAuthUser', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    localStorage.removeItem('crmAuthToken');
    localStorage.removeItem('crmAuthUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
