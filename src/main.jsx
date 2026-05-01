import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { UserProvider } from "./context/UserContext"
import { ThemeProvider } from "@material-tailwind/react";
import myTheme from "./myTheme";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HashRouter>
            <ThemeProvider value={myTheme}>
                <UserProvider>
                    <App />
                </UserProvider>
            </ThemeProvider>
        </HashRouter>
    </React.StrictMode>
);
