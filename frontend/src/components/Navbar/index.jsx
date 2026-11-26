import { useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo-ondeta.webp';
import './styles.css';

const ICONS = {
  feed: (
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  ),
  'my-posts': (
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

const ITEMS = [
  { key: 'feed', short: 'Feed', full: 'Feed' },
  { key: 'my-posts', short: 'Minhas', full: 'Minhas postagens', needsLogin: true },
  { key: 'create', short: 'Criar', full: 'Criar postagem' },
  { key: 'profile', short: 'Perfil', full: 'Meu perfil', needsLogin: true },
];

export default function Navbar({ active, onFeed, onMyPosts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const items = user ? ITEMS : ITEMS.filter((item) => !item.needsLogin);
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const root = document.documentElement;
    const update = () => root.style.setProperty('--navbar-height', `${header.offsetHeight}px`);
    update();
    if (!('ResizeObserver' in window)) return undefined;

    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const actions = {
    feed: onFeed ?? (() => navigate('/feed')),
    'my-posts': onMyPosts ?? (() => navigate('/feed', { state: { showMyPosts: true } })),
    create: () => navigate('/create-post'),
    profile: () => navigate('/profile'),
  };

  function handle_logout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handle_login() {
    navigate('/login', { state: { from: location } });
  }

  return (
    <header className="navbar" ref={headerRef}>
      <button
        type="button"
        className="navbar-brand"
        onClick={actions.feed}
        aria-label="OndeTá? – ir para o feed"
      >
        <img src={logo} alt="" className="navbar-logo" width="480" height="334" />
      </button>

      <nav className="navbar-tabs" aria-label="Navegação principal">
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? 'navbar-tab navbar-tab--active' : 'navbar-tab'}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.full}
              onClick={actions[item.key]}
            >
              <svg
                className="navbar-tab-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                {ICONS[item.key]}
              </svg>
              <span className="navbar-tab-label navbar-tab-label--short">{item.short}</span>
              <span className="navbar-tab-label navbar-tab-label--full">{item.full}</span>
            </button>
          );
        })}
      </nav>

      {user ? (
        <button type="button" className="navbar-logout" onClick={handle_logout}>
          Sair
        </button>
      ) : (
        <button type="button" className="navbar-logout" onClick={handle_login}>
          Entrar
        </button>
      )}
    </header>
  );
}
