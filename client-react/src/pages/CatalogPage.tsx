import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCatalog, setPage, setPageSize } from '../store/catalogSlice';
import GameCard from '../components/GameCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { addToCart } from '../components/cart';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, count, page, pageSize, filters } = useAppSelector(
    (s) => s.catalog
  );

  useEffect(() => {
    dispatch(fetchCatalog());
  }, [
    dispatch,
    page,
    pageSize,
    filters.search,
    filters.genre,
    filters.platform,
    filters.ordering
  ]);

  function changePage(next: number) {
    dispatch(setPage(next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section aria-labelledby="catalogTitle" className="catalog">
      <header className="page-header">
        <div>
          <h1 id="catalogTitle">Каталог ігор</h1>
          <p className="muted">
            Бібліотека на основі{' '}
            <a href="https://rawg.io" rel="noopener">
              RAWG.io
            </a>
            . Знайдено: <strong>{count.toLocaleString('uk-UA')}</strong>
          </p>
        </div>
      </header>

      <Filters />

      {error && (
        <ErrorBox error={error} onRetry={() => dispatch(fetchCatalog())} />
      )}

      <div className="games-grid" aria-busy={loading}>
        {loading && items.length === 0
          ? Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="game-card skeleton" aria-hidden="true">
                <div className="cover" />
                <div className="game-card-body">
                  <div className="skeleton-line w70" />
                  <div className="skeleton-line w40" />
                </div>
              </div>
            ))
          : items.map((p) => (
              <GameCard key={p.id} product={p} onAddToCart={(prod) => addToCart(prod)} />
            ))}
      </div>

      {loading && items.length > 0 && <Loader />}

      {!loading && !error && items.length === 0 && (
        <div className="card center empty-state">
          <span className="empty-state-emoji" aria-hidden>
            🎮
          </span>
          <h3>Нічого не знайдено</h3>
          <p className="muted">Спробуйте змінити фільтри або пошуковий запит.</p>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        count={count}
        onPage={changePage}
        onPageSize={(s) => dispatch(setPageSize(s))}
      />
    </section>
  );
}
