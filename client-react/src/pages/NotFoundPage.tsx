import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="center" style={{ paddingTop: 60 }}>
      <h1>404</h1>
      <p className="muted">Маршрут не знайдено.</p>
      <Link className="btn btn-primary mt-16" to="/catalog">
        До каталогу
      </Link>
    </section>
  );
}
