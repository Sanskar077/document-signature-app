import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* Rehydrate from localStorage on mount */
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { token: t } = res.data;

    /* Decode basic payload from JWT (no sensitive info stored) */
    const payload = JSON.parse(atob(t.split(".")[1]));
    const me: User = { id: payload.id, name: payload.name ?? email, email };

    /* Try fetching the user profile if name wasn't in token */
    try {
      const profileRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (profileRes.data?.user) {
        me.name = profileRes.data.user.name;
        me.email = profileRes.data.user.email;
      }
    } catch {
      /* /api/auth/me may not exist yet — use fallback */
    }

    setToken(t);
    setUser(me);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(me));
  };

  const register = async (name: string, email: string, password: string) => {
    await axios.post(`${API}/auth/register`, { name, email, password });
    /* Auto-login after register */
    await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
