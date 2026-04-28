import { createContext, useContext, useState } from 'react';

// 1. Initialize the context
export const UserContext = createContext(null);

// 2. Create a provider component
export const UserProvider = ({ children }) => {
  const loggedOutUser = { isLoggedIn: false };

  const [user, setUser] = useState(loggedOutUser);

  const login = (userData) => {
    const updatedUserData = { ...userData, isLoggedIn: true };
    console.log("User Logged In", updatedUserData);
    setUser(updatedUserData);
  };
  const logout = () => setUser(loggedOutUser);

  return (
    <UserContext value={{ user, login, logout }}>
      {children}
    </UserContext>
  );
};

// 3. Access the user in subcomponents
// import { use } from "react";
// import { UserContext } from "./context/UserContext";
// const { user, login, logout } = use(UserContext);
// if (user.isLoggedIn) {
//     console.log(user.screenName)
//     logout();
// }
