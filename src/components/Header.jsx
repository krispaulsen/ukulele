import { use, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import { Nav } from "./ui/Nav";
import { Flex, Link } from "./ui";
import { Button, IconButton } from "@material-tailwind/react";

export default function Header() {
    const { user, login, logout } = use(UserContext);
    const location = useLocation();

    // Normalize the location we pass in state (keeps pathname + search + hash for things like ?page=4).
    const from = location && typeof location === "object"
      ? { pathname: location.pathname || "/", search: location.search || "", hash: location.hash || "" }
      : { pathname: "/" };
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved; // try to use the theme in local storage
        return user.darkMode ? 'dark' : 'light'; // otherwise, use profile value or default value
    });

    async function handleLogout() {
        await apiRequest("/api/auth/logout", { method: "POST" });
        logout();
    }

    function handleThemeToggle() {
        document.documentElement.classList.remove(theme);
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    useEffect(() => {
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <header className="p-4">
            <Flex className="justify-between">
                <h1>My Ukulele Songbook</h1>
                <div>
                    <IconButton onClick={handleThemeToggle} color={theme === 'dark' ? "primary" : "secondary"}>
                        <i className={theme === 'dark' ? "fa-solid fa-moon" : "fa-regular fa-sun"}></i>
                    </IconButton>
                </div>
            </Flex>
            <Nav>
                <Link to="/">Home</Link>
                {/* <Link to="/theme">Theme</Link> */}
                {user.isLoggedIn ? (
                    <>
                        <Link to="/song/new">Add Song</Link>
                        <Link to="/favorites">My Songbook</Link>
                        <Link to="/tabs">Tab Editor</Link>
                        <Link to="/tuner">Tuner</Link>
                        <Link to="/profile">My Profile</Link>
                        <Button variant="link" type="button" onClick={handleLogout}>
                            Log out
                        </Button>
                    </>
                ) : (
                    <>
                        <Link to="/tabs">Tab Editor</Link>
                        <Link to="/tuner">Tuner</Link>
                        <Link to="/auth" state={{ from }}>Login</Link>
                        <Link to="/auth/register" state={{ from }}>Register</Link>
                    </>
                )}
            </Nav>
        </header>
    );
};
