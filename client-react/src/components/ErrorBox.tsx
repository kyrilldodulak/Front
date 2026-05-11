type Props = {
  error: string | null;
  onRetry?: () => void;
};

export default function ErrorBox({ error, onRetry }: Props) {
  if (!error) return null;
  return (
    <div className="error-box" role="alert">
      <strong>Помилка:</strong> {error}
      {onRetry && (
        <button className="btn btn-ghost mt-16" onClick={onRetry} style={{ marginLeft: 12 }}>
          Спробувати ще
        </button>
      )}
    </div>
  );
}
