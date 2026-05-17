import { Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe, logout } from './store/authSlice';
import { switchCartUser } from './components/cart';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import MainNav from './components/MainNav';

export default function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const prevUsername = useRef<string | null>(null);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    const username = user?.username ?? null;
    if (username !== prevUsername.current) {
      prevUsername.current = username;
      switchCartUser(username);
    }
  }, [user]);

  return (
    <>
      <header id="siteHeader">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="GameShop, на головну">
            GAME<span>SHOP</span>
          </a>
          <MainNav isAdmin={user?.role === 'admin'} />
          <div className="header-actions">
            {user ? (
              <>
                <span className="muted">Привіт, {user.username}</span>
                <button className="btn btn-primary" onClick={() => dispatch(logout())}>
                  Вийти
                </button>
              </>
            ) : (
              <>
                <a href="/login.html" className="btn btn-ghost">
                  Увійти
                </a>
                <a href="/register.html" className="btn btn-primary">
                  Реєстрація
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site">
        <div className="footer-inner">
          <div>
            <h4>GameShop</h4>
            <p>© 2026, КПІ ім. Сікорського</p>
          </div>
          <div>
            <h4>API</h4>
            <ul className="unstyled-list">
              <li><a href="/api/docs">Swagger UI</a></li>
              <li><a href="/api/products">/api/products</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
