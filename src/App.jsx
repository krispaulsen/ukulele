import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { apiRequest } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import SearchPage from "./pages/SearchPage";
import SongPage from "./pages/SongPage";
import SongEditorPage from "./pages/SongEditorPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [songs, setSongs] = useState([]);
  const [favoriteSongIds, setFavoriteSongIds] = useState(new Set());
  const [popularSongs, setPopularSongs] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // useEffect(() => {
  //   async function loadSession() {
  //     try {
  //       const me = await apiRequest("/api/auth/me");
  //       setUser(me);
  //     } catch {
  //       setUser(null);
  //     } finally {
  //       setIsAuthLoading(false);
  //     }
  //   }

  //   loadSession();
  // }, []);

  async function refreshSongs() {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/songs");
      setSongs(data);
    } catch (error) {
      setLoadError(error.message || "Failed to load songs");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshFavorites() {
    try {
      const favorites = await apiRequest("/api/favorites");
      setFavoriteSongIds(new Set(favorites.songIds));
    } catch {
      setFavoriteSongIds(new Set());
    }
  }

  async function refreshPopular() {
    try {
      const top = await apiRequest("/api/favorites/top?limit=10");
      setPopularSongs(top);
    } catch {
      setPopularSongs([]);
    }
  }

  useEffect(() => {
    if (!user) {
      setFavoriteSongIds(new Set());
      setIsLoading(false);
    } else {
      refreshFavorites();
    }

    refreshSongs();
    refreshPopular();
  }, [user]);

  async function handleToggleFavorite(songId) {
    const isFavorite = favoriteSongIds.has(songId);
    try {
      if (isFavorite) {
        await apiRequest(`/api/favorites/${encodeURIComponent(songId)}`, { method: "DELETE" });
      } else {
        await apiRequest(`/api/favorites/${encodeURIComponent(songId)}`, { method: "POST" });
      }
      await refreshFavorites();
      await refreshPopular();
    } catch (error) {
      setLoadError(error.message || "Failed to update favorites");
    }
  }

  async function handleLogout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (isAuthLoading) {
    return (
      <main className="container">
        <p>Loading session...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <h1>My Ukulele Songbook</h1>
        <nav>
          <Link to="/">Home</Link>
          {!user && (
            <>
              <Link to="/auth">Login</Link>
              <Link to="/auth/register">Register</Link>
            </>
          )}
          {user && (
            <>
              <Link to="/favorites">Favorites</Link>
              <Link to="/song/new">Add Song</Link>
              <button className="text-btn" type="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </header>

      {isLoading ? <p>Loading songs...</p> : null}
      {loadError ? <p role="alert">Could not load songs: {loadError}</p> : null}

      <Routes>
        <Route
          path="/"
          element={
            <SearchPage
              songs={songs}
              query={query}
              onQueryChange={setQuery}
              onToggleFavorite={handleToggleFavorite}
              favoriteSongIds={favoriteSongIds}
              popularSongs={popularSongs}
              onLogout={handleLogout}
              isLoggedIn={!!user}
            />
          }
        />
        <Route
          path="/song/:songId"
          element={<SongPage isLoggedIn={!!user} favoriteSongIds={favoriteSongIds} onToggleFavorite={handleToggleFavorite} />}
        />
        {user ? (
          <>
            <Route
              path="/favorites"
              element={
                <FavoritesPage
                  songs={songs}
                  favoriteSongIds={favoriteSongIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              }
            />
            <Route path="/song/new" element={<SongEditorPage mode="new" />} />
            <Route path="/song/:songId/edit" element={<SongEditorPage mode="edit" />} />
            <Route path="/song/:songId/fork" element={<SongEditorPage mode="fork" />} />
          </>
        ) : (
          <Route path="/auth" element={<AuthPage onAuthSuccess={setUser} />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
