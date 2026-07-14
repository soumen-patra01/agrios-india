import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, SearchBar, Chip, Card, SectionHeader, EmptyState, Button, IconTile } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ProductCard from "../../components/marketplace/ProductCard.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { productService } from "../../services/marketplace/productService.js";
import { sellerService } from "../../services/marketplace/sellerService.js";
import { cartService } from "../../services/marketplace/cartService.js";
import { wishlistService } from "../../services/marketplace/wishlistService.js";
import { reviewService } from "../../services/marketplace/reviewService.js";
import { seedMp } from "../../services/marketplace/seedMp.js";
import { PRODUCT_CATEGORIES } from "../../services/marketplace/constantsMp.js";

const QUICK_LINKS = [
  { kind: "mpOrders",   label: "My Orders", icon: "ClipboardList", a: "blue"    },
  { kind: "mpWishlist", label: "Wishlist",  icon: "Heart",         a: "red"     },
  { kind: "mpSeller",   label: "Sell",      icon: "Store",         a: "primary" },
];

export default function MarketplaceHub({ category = "all" } = {}) {
  const { pop, push, toast } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(category);
  const [list, setList] = useState(null);           // null = loading
  const [sellers, setSellers] = useState([]);
  const [sellerRatings, setSellerRatings] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [wishedIds, setWishedIds] = useState(new Set());
  const [seeding, setSeeding] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    productService.search({ q, category: cat }).then(setList);
  }, [q, cat, tick]);

  useEffect(() => {
    sellerService.getAll().then(async (all) => {
      setSellers(all);
      const entries = await Promise.all(all.map(async (s) => [s.id, await reviewService.sellerStats(s.id)]));
      setSellerRatings(Object.fromEntries(entries));
    });
    cartService.count().then(setCartCount);
    wishlistService.products().then((w) => setWishedIds(new Set(w.map((x) => x.refId))));
  }, [tick]);

  const toggleWish = async (p) => {
    const on = await wishlistService.toggle("product", p.id);
    toast(on ? "Added to wishlist" : "Removed from wishlist", "info");
    refresh();
  };

  const loadDemo = async () => {
    setSeeding(true);
    const r = await seedMp.load();
    setSeeding(false);
    toast(`${r.products} products from ${r.sellers} sellers loaded`, "success");
    refresh();
  };

  const featured = (list || []).filter((p) => p.featured);
  const empty = list && list.length === 0 && q === "" && cat === "all";

  return (
    <>
      <AppBar title="Marketplace" onBack={pop} action={
        <button onClick={() => push({ kind: "mpCart" })} aria-label="Cart"
          style={{ position: "relative", background: T.surface, border: `1px solid ${T.line}`,
            borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex" }}>
          <Icon name="ShoppingCart" size={19} />
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17,
              borderRadius: 9, background: T.red, color: "#fff", fontSize: 10, fontWeight: 800,
              display: "grid", placeItems: "center", padding: "0 4px" }}>{cartCount}</span>
          )}
        </button>
      } />

      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {QUICK_LINKS.map((l) => (
            <Card key={l.kind} onClick={() => push({ kind: l.kind })} pad={11}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconTile name={l.icon} a={l.a} size={32} iconSize={16} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{l.label}</span>
            </Card>
          ))}
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search seeds, feed, equipment…" />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "-4px 0", paddingBottom: 4 }}>
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {PRODUCT_CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} icon={c.icon}>{c.label}</Chip>
          ))}
        </div>

        {list === null ? null : empty ? (
          <EmptyState icon="ShoppingBag" title="The marketplace is empty"
            body="Load demo sellers and products to explore, or open Sell to list your own produce. Real multi-device buying and selling arrives with the shared backend phase."
            action={seeding ? "Loading…" : "Load demo data"} onAction={seeding ? undefined : loadDemo} />
        ) : (
          <>
            {/* stores strip */}
            {sellers.length > 0 && cat === "all" && !q && (
              <div>
                <SectionHeader title="Stores" />
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {sellers.map((s) => (
                    <Card key={s.id} onClick={() => push({ kind: "mpStore", props: { sellerId: s.id } })}
                      pad={12} style={{ minWidth: 150, flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <IconTile name={s.icon || "Store"} a={s.accent || "primary"} size={34} iconSize={17} />
                        {s.verificationStatus === "verified" && <Icon name="BadgeCheck" size={15} color={T.blue} />}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginTop: 8,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ marginTop: 3 }}>
                        <RatingStars value={sellerRatings[s.id]?.avg || 0} count={sellerRatings[s.id]?.count ?? 0} size={11} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* featured strip */}
            {featured.length > 0 && !q && (
              <div>
                <SectionHeader title="Featured" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {featured.slice(0, 2).map((p) => (
                    <ProductCard key={p.id} product={p} wished={wishedIds.has(p.id)}
                      onToggleWish={() => toggleWish(p)}
                      onClick={() => push({ kind: "mpProduct", props: { id: p.id } })} />
                  ))}
                </div>
              </div>
            )}

            {/* all products */}
            <div>
              <SectionHeader title={cat === "all" ? "All Products" : (PRODUCT_CATEGORIES.find((c) => c.id === cat)?.label || "Products")} />
              {list.length === 0 ? (
                <EmptyState icon="SearchX" title="Nothing found"
                  body={q ? `No products match "${q}".` : "No products in this category yet."} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {list.map((p) => (
                    <ProductCard key={p.id} product={p} wished={wishedIds.has(p.id)}
                      onToggleWish={() => toggleWish(p)}
                      onClick={() => push({ kind: "mpProduct", props: { id: p.id } })} />
                  ))}
                </div>
              )}
            </div>

            <Button variant="soft" full icon="Trash2" onClick={async () => { await seedMp.clear(); refresh(); toast("Demo data cleared", "info"); }}
              style={{ display: (list || []).some((p) => p.demo) ? "inline-flex" : "none" }}>
              Clear demo data
            </Button>
          </>
        )}
      </div>
    </>
  );
}
