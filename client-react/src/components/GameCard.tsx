import { Link } from 'react-router-dom';
import type { Product } from '../api/products';

type Props = {
  product: Product;
  onAddToCart?: (p: Product) => void;
};

export default function GameCard({ product, onAddToCart }: Props) {
  const cover = product.cover ?? '/images/cover-1.svg';
  return (
    <article className="game-card">
      <Link to={`/product/${product.slug}`}>
        <img className="cover" src={cover} alt={`Обкладинка ${product.title}`} loading="lazy" />
      </Link>
      <div className="game-card-body">
        <h3 className="game-title">
          <Link to={`/product/${product.slug}`} style={{ color: 'inherit' }}>
            {product.title}
          </Link>
        </h3>
        <ul className="tag-list" aria-label="жанри">
          {product.genres.slice(0, 3).map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <div className="game-row">
          <span className="price">{product.price} ₴</span>
          <button className="btn btn-primary" onClick={() => onAddToCart?.(product)}>
            У кошик
          </button>
        </div>
      </div>
    </article>
  );
}
