export default function Loader({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span>{label}</span>
    </div>
  );
}
