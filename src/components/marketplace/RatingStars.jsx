import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

/* Read-only star row (size sm) or tappable rating picker (onChange set). */
export default function RatingStars({ value = 0, count = null, size = 13, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: onChange ? 6 : 2 }}>
      {stars.map((s) => {
        const filled = s <= Math.round(value);
        const star = (
          <Icon key={s} name="Star" size={size}
            color={filled ? T.yellow : T.line}
            style={{ fill: filled ? T.yellow : "none" }} />
        );
        return onChange ? (
          <button key={s} onClick={() => onChange(s)} aria-label={`${s} star`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
            {star}
          </button>
        ) : star;
      })}
      {count != null && (
        <span style={{ fontSize: size - 1, color: T.inkSoft, marginLeft: 4 }}>
          {value > 0 ? `${value} (${count})` : "No reviews"}
        </span>
      )}
    </span>
  );
}
