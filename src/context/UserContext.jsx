import { createContext, useContext, useState } from 'react';

// 1. Initialize the context
const UserContext = createContext(null);

// 2. Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// 3. Create a custom hook for easy access
export const useUser = () => useContext(UserContext);
