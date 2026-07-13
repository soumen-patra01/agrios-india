import { T } from "../../theme/ThemeProvider.jsx";

function cellColor(value, max) {
  if (max === 0) return "transparent";
  const intensity = value / max;
  const r = Math.round(22 + (239 - 22) * (1 - intensity));
  const g = Math.round(163 + (68 - 163) * (1 - intensity));
  const b = Math.round(74 + (68 - 74) * (1 - intensity));
  return `rgba(${r},${g},${b},${0.15 + intensity * 0.75})`;
}

export default function ConfusionMatrixView({ confusionMatrix }) {
  if (!confusionMatrix) return null;
  const { classes, matrix } = confusionMatrix;
  const max = Math.max(...matrix.flat());
  const cellSize = Math.max(36, Math.min(56, Math.floor(280 / classes.length)));

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-block", minWidth: "fit-content" }}>
        {/* Header row */}
        <div style={{ display: "flex", paddingLeft: cellSize + 4 }}>
          {classes.map((cls) => (
            <div key={cls} style={{ width: cellSize, textAlign: "center", fontSize: 10,
              color: T.inkSoft, fontWeight: 600, padding: "4px 2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cls.length > 8 ? cls.slice(0, 7) + "…" : cls}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {matrix.map((row, i) => (
          <div key={classes[i]} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: cellSize, fontSize: 10, color: T.inkSoft, fontWeight: 600,
              paddingRight: 4, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {classes[i].length > 8 ? classes[i].slice(0, 7) + "…" : classes[i]}
            </div>
            {row.map((val, j) => (
              <div key={j} style={{
                width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center",
                background: cellColor(val, max), border: `1px solid ${T.line}`,
                fontSize: Math.max(10, Math.min(14, cellSize / 3)),
                fontWeight: i === j ? 700 : 400,
                color: i === j ? "#166534" : T.ink,
              }}>
                {val}
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 8, fontSize: 11, color: T.inkFaint }}>
          Rows = True labels · Columns = Predicted labels
        </div>
      </div>
    </div>
  );
}
