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
  const { pop, push, toast, tc } = useApp();
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

  const remove = async (entryId) => { await wishlistService.remove(entryId); refresh(); toast(tc({ en: "Removed", hi: "हटा दिया गया", bn: "মুছে ফেলা হয়েছে" }), "info"); };

  return (
    <>
      <AppBar title={tc({ en: "Wishlist", hi: "विशलिस्ट", bn: "উইশলিস্ট" })} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 8,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {products.length === 0 && sellers.length === 0 ? (
          <EmptyState icon="Heart" title={tc({ en: "Nothing saved yet", hi: "अभी तक कुछ भी सहेजा नहीं गया", bn: "এখনো কিছু সংরক্ষিত হয়নি" })}
            body={tc({ en: "Tap the heart on any product or store to keep it here.", hi: "इसे यहां रखने के लिए किसी भी उत्पाद या दुकान पर दिल पर टैप करें।", bn: "এখানে রাখতে যেকোনো পণ্য বা দোকানের হৃদয় চিহ্নে ট্যাপ করুন।" })} />
        ) : (
          <>
            {products.length > 0 && <SectionHeader title={tc({ en: `Products (${products.length})`, hi: `उत्पाद (${products.length})`, bn: `পণ্য (${products.length})` })} />}
            {products.map(({ entry, product }) => {
              const meta = categoryMeta(product?.category);
              const c = accent(meta.accent);
              return (
                <RecordRow key={entry.id}
                  icon={meta.icon} iconColor={c.fg} iconBg={c.bg}
                  title={product?.name || tc({ en: "Removed product", hi: "हटाया गया उत्पाद", bn: "সরানো পণ্য" })}
                  subtitle={product ? `${rupee(productService.unitPrice(product))}/${product.unit} · ${product.sellerName || meta.label}` : tc({ en: "This listing no longer exists", hi: "यह सूची अब मौजूद नहीं है", bn: "এই তালিকা আর নেই" })}
                  onClick={product ? () => push({ kind: "mpProduct", props: { id: product.id } }) : undefined}
                  onDelete={() => remove(entry.id)} />
              );
            })}

            {sellers.length > 0 && <SectionHeader title={tc({ en: `Favourite stores (${sellers.length})`, hi: `पसंदीदा दुकानें (${sellers.length})`, bn: `প্রিয় দোকান (${sellers.length})` })} />}
            {sellers.map(({ entry, seller }) => (
              <RecordRow key={entry.id}
                icon={seller?.icon || "Store"} iconColor={T.primary} iconBg={T.primarySoft}
                title={seller?.name || tc({ en: "Removed store", hi: "हटाई गई दुकान", bn: "সরানো দোকান" })}
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
