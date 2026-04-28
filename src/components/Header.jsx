import { use } from "react";
import { UserContext } from "../context/UserContext";
import { apiRequest } from "../lib/api";
import { Nav } from "./ui/Nav";
import { Button, Link } from "./ui";

export default function Header() {
    const { user, login, logout } = use(UserContext);

    async function handleLogout() {
        await apiRequest("/api/auth/logout", { method: "POST" });
        logout();
    }

    return (
        <header className="p-4">
            <h1>My Ukulele Songbook</h1>
            <Nav>
                <Link to="/">Home</Link>
                {user.isLoggedIn ? (
                    <>
                        <Link to="/song/new">Add Song</Link>
                        <Link to="/favorites">My Songbook</Link>
                        <Link to="/profile">My Profile</Link>
                        <Button variant="link" type="button" onClick={handleLogout}>
                            Log out
                        </Button>
                    </>
                ) : (
                    <>
                        <Link to="/auth">Login</Link>
                        <Link to="/auth/register">Register</Link>
                    </>
                )}
            </Nav>
        </header>
    );
};
