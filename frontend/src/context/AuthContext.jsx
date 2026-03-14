import { createContext, useContext, useState, useEffect } from "react";

// Create context
export const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage
  useEffect(() => {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

    if (token && role && email) {
      setUser({
        token: token,
        role: role,
        email: email
      });
    }

    setLoading(false);

  }, []);

  // Login function
  const login = (token, role, email) => {

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);

    setUser({
      token: token,
      role: role,
      email: email
    });

  };

  // Logout function
  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setUser(null);

  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};