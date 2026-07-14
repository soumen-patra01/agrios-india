import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, EmptyState, SectionHeader, IconTile } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { cartService } from "../../services/marketplace/cartService.js";
import { categoryMeta } from "../../services/marketplace/constantsMp.js";
import { rupee } from "../../utils/format.js";

const PROBLEM_TEXT = {
  removed: "No longer available",
  unavailable: "Listing is offline",
  stock: "Not enough stock",
};

export default function CartPage() {
  const { pop, push, toast } = useApp();
  const [lines, setLines] = useState(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { cartService.getLines().then(setLines); }, [tick]);

  if (lines === null) return <><AppBar title="Cart" onBack={pop} /></>;

  const active = lines.filter((l) => !l.saved);
  const saved = lines.filter((l) => l.saved);
  const totals = cartService.totals(lines);
  const hasProblems = active.some((l) => l.problem);

  const Line = ({ l }) => {
    const meta = categoryMeta(l.product?.category);
    return (
      <Card pad={12}>
        <div style={{ display: "flex", gap: 11 }}>
          <IconTile name={meta.icon} a={meta.accent} size={44} iconSize={20}
            style={{ opacity: l.problem ? .5 : 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}
              onClick={() => l.product && push({ kind: "mpProduct", props: { id: l.product.id } })}>
              {l.product?.name || "Removed product"}
            </div>
            {l.problem ? (
              <div style={{ fontSize: 11.5, color: T.red, fontWeight: 600, marginTop: 3 }}>
                <Icon name="AlertTriangle" size={11} style={{ verticalAlign: -1 }} /> {PROBLEM_TEXT[l.problem]}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>
                {rupee(l.unitPrice)}/{l.product.unit} · {l.product.sellerName || ""}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
              {!l.problem && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => { cartService.updateQty(l.id, l.qty - 1).then(refresh); }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: "pointer", display: "grid", placeItems: "center", color: T.ink }}>
                    <Icon name="Minus" size={12} />
                  </button>
                  <b style={{ fontSize: 13.5, minWidth: 18, textAlign: "center" }}>{l.qty}</b>
                  <button onClick={() => { cartService.updateQty(l.id, l.qty + 1).then(refresh); }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface, cursor: "pointer", display: "grid", placeItems: "center", color: T.ink }}>
                    <Icon name="Plus" size={12} />
                  </button>
                </span>
              )}
              <button onClick={() => { cartService.toggleSaved(l.id).then(refresh); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.blue, fontSize: 11.5, fontWeight: 600, fontFamily: T.body, padding: 0 }}>
                {l.saved ? "Move to cart" : "Save for later"}
              </button>
              <button onClick={() => { cartService.removeLine(l.id).then(refresh); toast("Removed", "info"); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, fontSize: 11.5, fontWeight: 600, fontFamily: T.body, padding: 0 }}>
                Remove
              </button>
            </div>
          </div>
          {!l.problem && <div style={{ fontSize: 13.5, fontWeight: 800, flexShrink: 0 }}>{rupee(l.lineTotal)}</div>}
        </div>
      </Card>
    );
  };

  return (
    <>
      <AppBar title={`Cart${active.length ? ` (${active.length})` : ""}`} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {active.length === 0 && saved.length === 0 ? (
          <EmptyState icon="ShoppingCart" title="Your cart is empty"
            body="Browse the marketplace and add products to your cart."
            action="Browse marketplace" onAction={pop} />
        ) : (
          <>
            {active.map((l) => <Line key={l.id} l={l} />)}

            {saved.length > 0 && (
              <>
                <SectionHeader title={`Saved for later (${saved.length})`} />
                {saved.map((l) => <Line key={l.id} l={l} />)}
              </>
            )}

            {active.length > 0 && (
              <>
                <Card pad={14}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.inkSoft, padding: "2px 0" }}>
                    <span>Items ({totals.count})</span><span>{rupee(totals.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.inkSoft, padding: "2px 0" }}>
                    <span>Delivery</span><span>Arranged with seller</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15.5, fontWeight: 800, color: T.ink, paddingTop: 8, marginTop: 6, borderTop: `1px solid ${T.lineSoft}` }}>
                    <span>Total</span><span>{rupee(totals.total)}</span>
                  </div>
                </Card>
                {hasProblems && (
                  <div style={{ fontSize: 12, color: T.orange, background: T.orangeSoft, borderRadius: T.rMd, padding: "9px 12px" }}>
                    Items with availability problems will be skipped at checkout.
                  </div>
                )}
                <Button full size="lg" onClick={() => push({ kind: "mpCheckout" })}
                  disabled={totals.count === 0}>
                  Checkout · {rupee(totals.total)}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
