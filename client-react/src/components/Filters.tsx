import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFilter } from '../store/catalogSlice';

const GENRES = [
  '', 'action', 'role-playing-games-rpg', 'adventure', 'indie',
  'roguelike', 'strategy', 'puzzle', 'simulation', 'platformer'
];
const PLATFORMS = [
  { value: '', label: 'усі' },
  { value: '4', label: 'PC' },
  { value: '187', label: 'PlayStation 5' },
  { value: '186', label: 'Xbox Series X' },
  { value: '7', label: 'Nintendo Switch' }
];
const SEARCH_DEBOUNCE_MS = 350;

export default function Filters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.catalog.filters);
  const [search, setSearch] = useState(filters.search);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== filters.search) dispatch(setFilter({ search }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, filters.search, dispatch]);

  return (
    <div className="filters" role="search" aria-label="Фільтри каталогу">
      <div className="field grow">
        <label htmlFor="searchInput">Пошук</label>
        <input
          id="searchInput"
          type="search"
          placeholder="назва гри..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="genreSelect">Жанр</label>
        <select
          id="genreSelect"
          value={filters.genre}
          onChange={(e) => dispatch(setFilter({ genre: e.target.value }))}
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g === '' ? 'усі' : g}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="platformSelect">Платформа</label>
        <select
          id="platformSelect"
          value={filters.platform}
          onChange={(e) => dispatch(setFilter({ platform: e.target.value }))}
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="orderingSelect">Сортування</label>
        <select
          id="orderingSelect"
          value={filters.ordering}
          onChange={(e) => dispatch(setFilter({ ordering: e.target.value }))}
        >
          <option value="-rating">за рейтингом</option>
          <option value="-released">за датою</option>
          <option value="name">за назвою</option>
          <option value="-metacritic">за Metacritic</option>
        </select>
      </div>
    </div>
  );
}
