import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setFilter } from '../store/catalogSlice';

const GENRES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All genres' },
  { value: 'action', label: 'Action' },
  { value: 'role-playing-games-rpg', label: 'RPG' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'shooter', label: 'Shooter' },
  { value: 'indie', label: 'Indie' },
  { value: 'racing', label: 'Racing' },
  { value: 'sports', label: 'Sports' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'puzzle', label: 'Puzzle' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'platformer', label: 'Platformer' },
  { value: 'fighting', label: 'Fighting' },
  { value: 'arcade', label: 'Arcade' },
  { value: 'family', label: 'Family' },
  { value: 'massively-multiplayer', label: 'MMO' },
  { value: 'card', label: 'Card' },
  { value: 'board-games', label: 'Board Games' },
  { value: 'educational', label: 'Educational' }
];
const PLATFORMS = [
  { value: '', label: 'All platforms' },
  { value: '4', label: 'PC' },
  { value: '187', label: 'PlayStation 5' },
  { value: '18', label: 'PlayStation 4' },
  { value: '186', label: 'Xbox Series X/S' },
  { value: '1', label: 'Xbox One' },
  { value: '7', label: 'Nintendo Switch' },
  { value: '3', label: 'iOS' },
  { value: '21', label: 'Android' }
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
            <option key={g.value} value={g.value}>
              {g.label}
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
          <option value="-rating">By rating</option>
          <option value="-released">By release date</option>
          <option value="name">By name</option>
          <option value="-metacritic">By Metacritic</option>
        </select>
      </div>
    </div>
  );
}
