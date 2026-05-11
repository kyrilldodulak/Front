type Props = {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
};

const PAGE_SIZES = [12, 24, 48];
const SIBLINGS = 1;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return range(1, total);

  const left = Math.max(2, current - SIBLINGS);
  const right = Math.min(total - 1, current + SIBLINGS);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const pages: Array<number | '…'> = [1];
  if (showLeftDots) pages.push('…');
  pages.push(...range(left, right));
  if (showRightDots) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Pagination({ page, pageSize, count, onPage, onPageSize }: Props) {
  const total = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;

  const pages = buildPages(page, total);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <nav className="pagination" aria-label="Пагінація каталогу">
      <span className="pagination-info">
        {from}–{to} з {count.toLocaleString('uk-UA')}
      </span>

      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Попередня сторінка"
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`d${i}`} className="page-dots" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= total}
          aria-label="Наступна сторінка"
        >
          →
        </button>
      </div>

      {onPageSize && (
        <label className="page-size">
          Показувати:
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            aria-label="Розмір сторінки"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
