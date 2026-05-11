import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchProduct, type Product } from '../api/products';
import { fetchReviews, postReview, type Review } from '../api/reviews';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { addToCart } from '../components/cart';
import { useAppSelector } from '../store/hooks';

export default function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const user = useAppSelector((s) => s.auth.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [pLoading, setPLoading] = useState(true);
  const [pError, setPError] = useState<string | null>(null);

  // відгуки — підвантажуються порціями (Лаба 5/6)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError] = useState<string | null>(null);

  // форма відгуку
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPLoading(true);
    setPError(null);
    fetchProduct(slug)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err: Error) => {
        if (!cancelled) setPError(err.message);
      })
      .finally(() => {
        if (!cancelled) setPLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loadReviews = useCallback(
    async (p: number) => {
      setRLoading(true);
      setRError(null);
      try {
        const data = await fetchReviews(slug, p, 5);
        setReviews((prev) => (p === 1 ? data.items : prev.concat(data.items)));
        setHasNext(data.hasNext);
        setPage(p);
      } catch (e) {
        setRError((e as Error).message);
      } finally {
        setRLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setPostError(null);
    if (body.trim().length < 5) {
      setPostError('Текст відгуку має містити ≥ 5 символів');
      return;
    }
    setSubmitting(true);
    try {
      const created = await postReview(slug, { rating, body });
      setReviews((prev) => [created, ...prev]);
      setBody('');
      setRating(5);
    } catch (err) {
      setPostError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (pLoading) return <Loader label="Завантаження гри…" />;
  if (pError) return <ErrorBox error={pError} />;
  if (!product) return <ErrorBox error="Гру не знайдено" />;

  const cover = product.cover ?? '/images/cover-1.svg';
  const screens = product.short_screenshots ?? [];

  return (
    <article>
      <ol className="breadcrumbs">
        <li><Link to="/">Головна</Link></li>
        <li><Link to="/catalog">Каталог</Link></li>
        <li>{product.title}</li>
      </ol>

      <h1>{product.title}</h1>

      <div className="product-detail">
        <div className="gallery">
          <img src={cover} alt={product.title} />
          {screens.slice(0, 3).map((s) => (
            <img key={s} src={s} alt={`${product.title} screenshot`} />
          ))}
        </div>
        <div>
          <div className="card">
            <p className="muted">
              {product.released ?? 'дата невідома'}
              {product.metacritic ? ` · Metacritic ${product.metacritic}` : ''}
              {product.rating ? ` · Користувачі ${product.rating.toFixed(1)}` : ''}
            </p>
            <h2 style={{ marginTop: 12 }}>
              <span className="price">{product.price} ₴</span>
            </h2>
            <button className="btn btn-primary mt-16" onClick={() => addToCart(product)}>
              Додати до кошика
            </button>
            <ul className="tag-list mt-16">
              {product.genres.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="mt-24">{product.description || 'Опис відсутній.'}</p>
          </div>

          <section aria-labelledby="reviewsTitle" className="mt-24">
            <h2 id="reviewsTitle">Відгуки</h2>

            {user ? (
              <form className="card stack" onSubmit={handleSubmitReview}>
                <div className="form-row">
                  <label>Оцінка</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {'★'.repeat(n)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Ваш відгук</label>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
                </div>
                {postError && <p className="error-text">{postError}</p>}
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Надсилання…' : 'Залишити відгук'}
                </button>
              </form>
            ) : (
              <p className="muted">
                <a href="/login.html">Увійдіть</a>, щоб залишити відгук.
              </p>
            )}

            <div className="mt-24">
              {reviews.map((r) => (
                <div className="review" key={r.id}>
                  <h4>
                    <span>{r.author}</span>
                    <span className="stars">{'★'.repeat(r.rating)}</span>
                    <time>{new Date(r.created_at).toLocaleDateString('uk-UA')}</time>
                  </h4>
                  <p>{r.body}</p>
                </div>
              ))}
              {rError && <ErrorBox error={rError} onRetry={() => loadReviews(1)} />}
              {rLoading && <Loader label="Завантаження відгуків…" />}
              {!rLoading && hasNext && (
                <button className="btn btn-ghost btn-block" onClick={() => loadReviews(page + 1)}>
                  Завантажити ще
                </button>
              )}
              {!rLoading && reviews.length === 0 && (
                <p className="muted">Поки що немає відгуків.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
