import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { RecordRow } from "../../components/erp/RecordList.jsx";
import { accent } from "../../components/primitives.jsx";
import { wishlistService } from "../../services/marketplace/wishlistService.js";
import { productService } from "../../services/marketplace/productService.js";
import { sellerService } from "../../services/marketplace/sellerService.js";
import { categoryMeta } from "../../services/marketplace/constantsMp.js";
import { rupee } from "../../utils/format.js";

export default function WishlistPage() {
  const { pop, push, toast } = useApp();
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    wishlistService.products().then((w) =>
      Promise.all(w.map(async (e) => ({ entry: e, product: await productService.getById(e.refId) })))
        .then(setProducts));
    wishlistService.sellers().then((w) =>
      Promise.all(w.map(async (e) => ({ entry: e, seller: await sellerService.getById(e.refId) })))
        .then(setSellers));
  }, [tick]);

  const remove = async (entryId) => { await wishlistService.remove(entryId); refresh(); toast("Removed", "info"); };

  return (
    <>
      <AppBar title="Wishlist" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 8,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {products.length === 0 && sellers.length === 0 ? (
          <EmptyState icon="Heart" title="Nothing saved yet"
            body="Tap the heart on any product or store to keep it here." />
        ) : (
          <>
            {products.length > 0 && <SectionHeader title={`Products (${products.length})`} />}
            {products.map(({ entry, product }) => {
              const meta = categoryMeta(product?.category);
              const c = accent(meta.accent);
              return (
                <RecordRow key={entry.id}
                  icon={meta.icon} iconColor={c.fg} iconBg={c.bg}
                  title={product?.name || "Removed product"}
                  subtitle={product ? `${rupee(productService.unitPrice(product))}/${product.unit} · ${product.sellerName || meta.label}` : "This listing no longer exists"}
                  onClick={product ? () => push({ kind: "mpProduct", props: { id: product.id } }) : undefined}
                  onDelete={() => remove(entry.id)} />
              );
            })}

            {sellers.length > 0 && <SectionHeader title={`Favourite stores (${sellers.length})`} />}
            {sellers.map(({ entry, seller }) => (
              <RecordRow key={entry.id}
                icon={seller?.icon || "Store"} iconColor={T.primary} iconBg={T.primarySoft}
                title={seller?.name || "Removed store"}
                subtitle={seller ? `${sellerService.typeLabel(seller.type)}${seller.village ? ` · ${seller.village}` : ""}` : ""}
                onClick={seller ? () => push({ kind: "mpStore", props: { sellerId: seller.id } }) : undefined}
                onDelete={() => remove(entry.id)} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
