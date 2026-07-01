// Brand mark — gradient "G" monogram.
export default function Logo({ size = 34 }) {
  return (
    <span
      className="logo-mark"
      style={{ width: size, height: size, fontSize: size * 0.54 }}
      aria-hidden="true"
    >
      G
    </span>
  );
}
