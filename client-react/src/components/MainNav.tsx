import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  external?: boolean;
  icon: JSX.Element;
  end?: boolean;
};

const HOME_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10h14V10" />
  </svg>
);

const CATALOG_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const CART_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h2l2.4 12.3a2 2 0 002 1.7h7.7a2 2 0 002-1.6L21 8H6" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="17" cy="20" r="1.5" />
  </svg>
);

const PROFILE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
);

const ADMIN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 4v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export default function MainNav({ isAdmin }: { isAdmin: boolean }) {
  const items: NavItem[] = [
    { to: '/', label: 'Головна', external: true, icon: HOME_ICON },
    { to: '/catalog', label: 'Каталог', icon: CATALOG_ICON },
    { to: '/cart.html', label: 'Кошик', external: true, icon: CART_ICON },
    { to: '/profile', label: 'Профіль', icon: PROFILE_ICON },
    ...(isAdmin ? [{ to: '/admin', label: 'Адмін-панель', icon: ADMIN_ICON } as NavItem] : [])
  ];

  return (
    <nav aria-label="Основна навігація">
      <ul>
        {items.map((item) => (
          <li key={item.to}>
            {item.external ? (
              <a href={item.to}>
                {item.icon}
                <span>{item.label}</span>
              </a>
            ) : (
              <NavLink to={item.to} end={item.end}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
