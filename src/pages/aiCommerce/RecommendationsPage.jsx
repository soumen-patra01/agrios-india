import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, Chip, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import RecommendationRow from "../../components/aiCommerce/RecommendationRow.jsx";
import ConfidenceBar from "../../components/aiCommerce/ConfidenceBar.jsx";
import { recommendationEngine } from "../../services/aiCommerce/recommendationEngine.js";

const TABS = [
  { id: "personalized", label: "For You" },
  { id: "seasonal", label: "Seasonal" },
  { id: "trending", label: "Trending" },
];

export default function RecommendationsPage() {
  const { pop, push } = useApp();
  const [tab, setTab] = useState("personalized");
  const [result, setResult] = useState(null);

  useEffect(() => {
    setResult(null);
    const run = tab === "seasonal"
      ? recommendationEngine.seasonal({ limit: 10 })
      : recommendationEngine.personalized({ limit: 10 });
    run.then(setResult);
  }, [tab]);

  const items = result?.items || [];
  const basis = result?.basis || (result?.season ? `${result.season} season` : null);

  return (
    <>
      <AppBar title="Recommendations" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((tb) => (
            <Chip key={tb.id} active={tab === tb.id} onClick={() => setTab(tb.id)}>{tb.label}</Chip>
          ))}
        </div>

        {result === null ? null : items.length === 0 ? (
          <EmptyState icon="Sparkles" title="No recommendations yet"
            body="Load AI commerce demo data from the hub, then come back to see personalized picks." />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              {basis && <span style={{ fontSize: 12, color: T.inkSoft }}>Based on <b style={{ color: T.ink }}>{basis}</b></span>}
              <div style={{ minWidth: 130 }}><ConfidenceBar confidence={result.confidence} compact /></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((x) => (
                <RecommendationRow key={x.product.id} product={x.product} score={x.score} reasons={x.reasons}
                  onClick={() => push({ kind: "mpProduct", props: { productId: x.product.id } })} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
