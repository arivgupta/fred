export default function Skeleton({ width = '100%', height = 16, radius, style }) {
  return (
    <span
      className="skeleton"
      style={{
        display: 'block',
        width,
        height,
        ...(radius != null ? { borderRadius: radius } : {}),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card card--pad" aria-hidden="true">
      <Skeleton width="42%" height={15} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${88 - i * 18}%`}
          height={12}
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}
