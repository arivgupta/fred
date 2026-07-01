import { initials } from '../lib/format';

export default function Avatar({ name, size = 32, brand = false }) {
  return (
    <span
      className={`avatar${brand ? ' avatar--brand' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {brand ? 'G' : initials(name)}
    </span>
  );
}
