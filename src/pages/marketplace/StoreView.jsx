import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, SectionHeader, EmptyState, Button } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ProductCard from "../../components/marketplace/ProductCard.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { productService } from "../../services/marketplace/productService.js";
import { sellerService } from "../../services/marketplace/sellerService.js";
import { reviewService } from "../../services/marketplace/reviewService.js";
import { wishlistService } from "../../services/marketplace/wishlistService.js";

export default function StoreView({ sellerId }) {
  const { pop, push, toast, tc } = useApp();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ avg: 0, count: 0 });
  const [fav, setFav] = useState(false);

  useEffect(() => {
    sellerService.getById(sellerId).then(setSeller);
    productService.search({ sellerId }).then(setProducts);
    reviewService.sellerStats(sellerId).then(setStats);
    wishlistService.has("seller", sellerId).then(setFav);
  }, [sellerId]);

  if (!seller) return <><AppBar title={tc({ en: "Store", hi: "दुकान", bn: "দোকান" })} onBack={pop} /></>;

  return (
    <>
      <AppBar title={tc({ en: "Store", hi: "दुकान", bn: "দোকান" })} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* store header */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
          borderRadius: T.rLg, padding: 18, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(255,255,255,.2)",
              display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name={seller.icon || "Store"} size={26} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                {seller.name}
                {seller.verificationStatus === "verified" && <Icon name="BadgeCheck" size={17} color="#fff" />}
              </div>
              <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>
                {sellerService.typeLabel(seller.type)}
                {seller.village ? ` · ${seller.village}, ${seller.district || seller.state || ""}` : ""}
              </div>
              <div style={{ marginTop: 5 }}><RatingStars value={stats.avg} count={stats.count} size={12} /></div>
            </div>
          </div>
          {seller.tagline && <div style={{ fontSize: 12.5, opacity: .9, marginTop: 12 }}>{seller.tagline}</div>}
        </div>

        <Button variant={fav ? "soft" : "outline"} full icon="Heart"
          onClick={async () => { const on = await wishlistService.toggle("seller", sellerId); setFav(on); toast(on ? tc({ en: "Store added to favourites", hi: "दुकान पसंदीदा में जोड़ी गई", bn: "দোকান পছন্দে যোগ করা হয়েছে" }) : tc({ en: "Removed from favourites", hi: "पसंदीदा से हटाया गया", bn: "পছন্দ থেকে সরানো হয়েছে" }), "info"); }}>
          {fav ? tc({ en: "Favourite store ✓", hi: "पसंदीदा दुकान ✓", bn: "প্রিয় দোকান ✓" }) : tc({ en: "Add to favourites", hi: "पसंदीदा में जोड़ें", bn: "পছন্দে যোগ করুন" })}
        </Button>

        {seller.description && <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6 }}>{seller.description}</div>}

        <SectionHeader title={tc({ en: `Products (${products.length})`, hi: `उत्पाद (${products.length})`, bn: `পণ্য (${products.length})` })} />
        {products.length === 0 ? (
          <EmptyState icon="Package" title={tc({ en: "No live products", hi: "कोई लाइव उत्पाद नहीं", bn: "কোনো লাইভ পণ্য নেই" })} body={tc({ en: "This store hasn't published any listings yet.", hi: "इस दुकान ने अभी तक कोई सूची प्रकाशित नहीं की है।", bn: "এই দোকান এখনো কোনো তালিকা প্রকাশ করেনি।" })} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p}
                onClick={() => push({ kind: "mpProduct", props: { id: p.id } })} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
