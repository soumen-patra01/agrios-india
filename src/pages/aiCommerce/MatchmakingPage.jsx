import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ScoreBadge from "../../components/aiCommerce/ScoreBadge.jsx";
import ReasonList from "../../components/aiCommerce/ReasonList.jsx";
import { buyerMatching } from "../../services/aiCommerce/buyerMatching.js";
import { sellerMatching } from "../../services/aiCommerce/sellerMatching.js";
import { rupee } from "../../utils/format.js";

export default function MatchmakingPage() {
  const { pop, tc } = useApp();
  const [tab, setTab] = useState("buyers");
  const [buyers, setBuyers] = useState(null);
  const [sellers, setSellers] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    buyerMatching.rank({ limit: 12 }).then(setBuyers);
    sellerMatching.rank({ limit: 12 }).then(setSellers);
  }, []);

  const Tag = ({ children }) => (
    <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: T.blueSoft, borderRadius: 5, padding: "1px 6px" }}>{children}</span>
  );

  const buyerItems = buyers?.items || [];
  const sellerItems = sellers?.items || [];

  return (
    <>
      <AppBar title={tc({ en: "AI Matchmaking", hi: "AI मैचमेकिंग", bn: "AI ম্যাচমেকিং" })} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={tab === "buyers"} onClick={() => setTab("buyers")}>{tc({ en: "Buyers", hi: "खरीदार", bn: "ক্রেতা" })}</Chip>
          <Chip active={tab === "sellers"} onClick={() => setTab("sellers")}>{tc({ en: "Sellers", hi: "विक्रेता", bn: "বিক্রেতা" })}</Chip>
        </div>

        {tab === "buyers" && (
          buyers === null ? null : buyerItems.length === 0 ? (
            <EmptyState icon="Handshake" title={tc({ en: "No buyers found", hi: "कोई खरीदार नहीं मिला", bn: "কোনো ক্রেতা পাওয়া যায়নি" })}
              body={tc({ en: "Buyer signals come from procurement tenders, contracts and export orders. Load logistics demo data to populate them.", hi: "खरीदार संकेत खरीद निविदाओं, अनुबंधों और निर्यात ऑर्डर से आते हैं। इन्हें भरने के लिए लॉजिस्टिक्स डेमो डेटा लोड करें।", bn: "ক্রেতার সংকেত সংগ্রহ টেন্ডার, চুক্তি এবং রপ্তানি অর্ডার থেকে আসে। এগুলো পূরণ করতে লজিস্টিক্স ডেমো ডেটা লোড করুন।" })} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {buyerItems.map((x) => (
                <Card key={x.buyer.name} pad={13} onClick={() => setOpenId(openId === x.buyer.name ? null : x.buyer.name)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ScoreBadge score={x.score} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{x.buyer.name}</div>
                      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>
                        {rupee(x.buyer.totalValue)} · {tc({
                          en: `${x.buyer.deals} deal${x.buyer.deals > 1 ? "s" : ""}`,
                          hi: `${x.buyer.deals} सौदे`,
                          bn: `${x.buyer.deals}টি চুক্তি`,
                        })}
                        {x.buyer.commodities.length ? ` · ${x.buyer.commodities.join(", ")}` : ""}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                        {x.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                      </div>
                    </div>
                    <Icon name={openId === x.buyer.name ? "ChevronUp" : "ChevronDown"} size={16} color={T.inkFaint} />
                  </div>
                  {openId === x.buyer.name && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                      <ReasonList reasons={x.reasons} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )
        )}

        {tab === "sellers" && (
          sellers === null ? null : sellerItems.length === 0 ? (
            <EmptyState icon="Store" title={tc({ en: "No sellers found", hi: "कोई विक्रेता नहीं मिला", bn: "কোনো বিক্রেতা পাওয়া যায়নি" })} body={tc({ en: "Load AI commerce demo data from the hub first.", hi: "पहले हब से AI कॉमर्स डेमो डेटा लोड करें।", bn: "প্রথমে হাব থেকে AI কমার্স ডেমো ডেটা লোড করুন।" })} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sellerItems.map((x) => (
                <Card key={x.seller.id} pad={13} onClick={() => setOpenId(openId === x.seller.id ? null : x.seller.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ScoreBadge score={x.score} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{x.seller.name}</div>
                      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>
                        {x.seller.rating ? `${x.seller.rating}★ · ` : ""}{tc({
                          en: `${x.seller.deliveredCount} delivered`,
                          hi: `${x.seller.deliveredCount} डिलीवर किया गया`,
                          bn: `${x.seller.deliveredCount}টি ডেলিভারি`,
                        })} · {rupee(x.seller.revenue)}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                        {x.badges.map((t) => <Tag key={t}>{t}</Tag>)}
                      </div>
                    </div>
                    <Icon name={openId === x.seller.id ? "ChevronUp" : "ChevronDown"} size={16} color={T.inkFaint} />
                  </div>
                  {openId === x.seller.id && (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                      <ReasonList reasons={x.reasons} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
