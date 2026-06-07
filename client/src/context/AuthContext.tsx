import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Accept a pre-fetched token + user object and persist to localStorage. */
  login: (token: string, user: { id?: string; _id?: string; name: string; email: string }) => void;
  /** Register then login in one step (used only if called directly). */
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  /**
   * Accepts a server-returned token and user object, persists them.
   * Called by Login, Register, and any page that handles its own fetch.
   */
  const login = (
    t: string,
    serverUser: { id?: string; _id?: string; name: string; email: string }
  ) => {
    const me: User = {
      id: serverUser.id ?? serverUser._id ?? "",
      name: serverUser.name,
      email: serverUser.email,
    };
    setToken(t);
    setUser(me);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(me));
  };

  /**
   * Register + login in one step — kept for any caller using the context
   * method directly instead of fetching manually.
   */
  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    login(data.token, data.user);
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
