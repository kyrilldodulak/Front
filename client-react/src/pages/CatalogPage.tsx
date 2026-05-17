import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCatalog, setPage } from '../store/catalogSlice';
import GameCard from '../components/GameCard';
import Filters from '../components/Filters';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { addToCart } from '../components/cart';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, count, page, pageSize, hasNext, filters } = useAppSelector(
    (s) => s.catalog
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

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

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current && hasNext) {
          dispatch(setPage(page + 1));
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [dispatch, page, hasNext]);

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

      {!error && hasNext && (
        <div
          ref={sentinelRef}
          className="catalog-sentinel"
          aria-hidden="true"
        />
      )}

      {!loading && !hasNext && items.length > 0 && (
        <p className="catalog-end muted">
          Це всі результати ({count.toLocaleString('uk-UA')}).
        </p>
      )}
    </section>
  );
}
