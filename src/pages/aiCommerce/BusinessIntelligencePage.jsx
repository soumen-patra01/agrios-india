import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { businessIntelligence } from "../../services/aiCommerce/businessIntelligence.js";
import { rupee, compact } from "../../utils/format.js";

export default function BusinessIntelligencePage() {
  const { pop, tc } = useApp();
  const [ex, setEx] = useState(null);

  useEffect(() => { businessIntelligence.executive().then(setEx); }, []);

  if (!ex) return <><AppBar title={tc({ en: "Business Intelligence", hi: "व्यवसाय बुद्धिमत्ता", bn: "ব্যবসায়িক বুদ্ধিমত্তা" })} onBack={pop} /></>;

  const empty = ex.sales.orders === 0 && ex.marketplace.products === 0;

  const group = (title, tiles) => (
    <div>
      <SectionHeader title={title} />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>
    </div>
  );

  return (
    <>
      <AppBar title={tc({ en: "Business Intelligence", hi: "व्यवसाय बुद्धिमत्ता", bn: "ব্যবসায়িক বুদ্ধিমত্তা" })} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 18,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {empty ? (
          <EmptyState icon="BarChart3" title={tc({ en: "No data yet", hi: "अभी कोई डेटा नहीं", bn: "এখনো কোনো তথ্য নেই" })} body={tc({ en: "Load AI commerce demo data from the hub to populate the dashboards.", hi: "डैशबोर्ड भरने के लिए हब से AI कॉमर्स डेमो डेटा लोड करें।", bn: "ড্যাশবোর্ড পূরণ করতে হাব থেকে AI কমার্স ডেমো ডেটা লোড করুন।" })} />
        ) : (
          <>
            {group(tc({ en: "Sales", hi: "बिक्री", bn: "বিক্রয়" }), [
              { label: tc({ en: "Revenue", hi: "राजस्व", bn: "রাজস্ব" }), value: compact(ex.sales.revenue), icon: "IndianRupee", a: "primary" },
              { label: tc({ en: "Orders", hi: "ऑर्डर", bn: "অর্ডার" }), value: ex.sales.orders, icon: "Package", a: "blue" },
              { label: tc({ en: "Delivered", hi: "डिलीवर हुआ", bn: "ডেলিভার হয়েছে" }), value: ex.sales.delivered, icon: "CheckCircle2", a: "primary" },
              { label: tc({ en: "Avg order", hi: "औसत ऑर्डर", bn: "গড় অর্ডার" }), value: rupee(ex.sales.avgOrderValue), icon: "Receipt", a: "orange" },
              { label: tc({ en: "Conversion", hi: "कन्वर्शन", bn: "কনভার্সন" }), value: `${ex.sales.conversion}%`, icon: "TrendingUp", a: "primary" },
            ])}

            {group(tc({ en: "Marketplace", hi: "मार्केटप्लेस", bn: "মার্কেটপ্লেস" }), [
              { label: tc({ en: "Products", hi: "उत्पाद", bn: "পণ্য" }), value: ex.marketplace.products, icon: "ShoppingBag", a: "blue" },
              { label: tc({ en: "Published", hi: "प्रकाशित", bn: "প্রকাশিত" }), value: ex.marketplace.published, icon: "Store", a: "primary" },
              { label: tc({ en: "Sellers", hi: "विक्रेता", bn: "বিক্রেতা" }), value: ex.marketplace.sellers, icon: "Users", a: "orange" },
              { label: tc({ en: "Out of stock", hi: "स्टॉक खत्म", bn: "স্টক শেষ" }), value: ex.marketplace.outOfStock, icon: "PackageX", a: "red" },
            ])}

            {group(tc({ en: "Inventory", hi: "इन्वेंट्री", bn: "ইনভেন্টরি" }), [
              { label: tc({ en: "Units", hi: "यूनिट", bn: "ইউনিট" }), value: compact(ex.inventory.totalUnits).replace("₹", ""), icon: "Boxes", a: "blue" },
              { label: tc({ en: "Healthy", hi: "स्वस्थ", bn: "সুস্থ" }), value: ex.inventory.healthy, icon: "CheckCircle2", a: "primary" },
              { label: tc({ en: "Low stock", hi: "कम स्टॉक", bn: "কম স্টক" }), value: ex.inventory.lowStock, icon: "AlertTriangle", a: "orange" },
              { label: tc({ en: "Out", hi: "समाप्त", bn: "শেষ" }), value: ex.inventory.outOfStock, icon: "XCircle", a: "red" },
            ])}

            {group(tc({ en: "Customers & Ops", hi: "ग्राहक और संचालन", bn: "গ্রাহক ও পরিচালন" }), [
              { label: tc({ en: "Leads", hi: "लीड", bn: "লিড" }), value: ex.customer.leads, icon: "Flame", a: "orange" },
              { label: tc({ en: "Hot leads", hi: "हॉट लीड", bn: "হট লিড" }), value: ex.customer.hotLeads, icon: "Flame", a: "red" },
              { label: tc({ en: "Districts", hi: "जिले", bn: "জেলা" }), value: ex.customer.districts, icon: "MapPin", a: "blue" },
              { label: tc({ en: "Fraud flags", hi: "धोखाधड़ी फ्लैग", bn: "জালিয়াতি ফ্ল্যাগ" }), value: ex.operational.fraudFlags, icon: "ShieldAlert", a: "red" },
            ])}

            {ex.topDemand?.length > 0 && (
              <div>
                <SectionHeader title={tc({ en: "Top demand categories", hi: "शीर्ष मांग श्रेणियाँ", bn: "শীর্ষ চাহিদার বিভাগ" })} />
                <Card pad={14}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {ex.topDemand.map((d) => (
                      <div key={d.category}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: T.ink, fontWeight: 600 }}>{d.label}</span>
                          <span style={{ color: T.inkSoft }}>{d.level} · {d.demandIndex}/100</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 7, background: T.surface2, overflow: "hidden" }}>
                          <div style={{ width: `${d.demandIndex}%`, height: "100%", background: T.blue, borderRadius: 7 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: T.surface2,
              borderRadius: T.rMd, padding: "10px 12px" }}>
              <Icon name="Info" size={15} color={T.inkSoft} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5 }}>
                {tc({
                  en: "Aggregated from the marketplace, logistics and AI engines on this device. Cross-organisation intelligence arrives with the backend phase.",
                  hi: "इस डिवाइस पर मार्केटप्लेस, लॉजिस्टिक्स और AI इंजनों से एकत्रित। क्रॉस-संगठन बुद्धिमत्ता बैकएंड चरण के साथ आएगी।",
                  bn: "এই ডিভাইসের মার্কেটপ্লেস, লজিস্টিকস ও AI ইঞ্জিন থেকে সংগৃহীত। ক্রস-অর্গানাইজেশন বুদ্ধিমত্তা ব্যাকএন্ড পর্যায়ে আসবে।",
                })}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
