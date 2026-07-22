import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import AuctionCard from "../../components/logistics/AuctionCard.jsx";
import StatusPill from "../../components/logistics/StatusPill.jsx";
import { auctionService } from "../../services/logistics/auctionService.js";
import { AUCTION_TYPES, AUCTION_STATUS, COMMODITIES } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

const EMPTY = { title: "", type: "forward", commodity: "Mustard", quantityKg: "", basePrice: "", sellerName: "" };

export default function AuctionPage() {
  const { pop, toast, tc } = useApp();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [bids, setBids] = useState([]);
  const [bid, setBid] = useState({ bidderName: "", price: "" });
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { auctionService.getAll().then(setList); }, [tick]);

  const openDetail = async (a) => { setDetail(a); setBids(await auctionService.bidsFor(a.id)); setBid({ bidderName: "", price: "" }); };
  const reload = async (id) => { setDetail(await auctionService.getById(id)); setBids(await auctionService.bidsFor(id)); };

  const create = async () => {
    if (!form.title || !form.basePrice) { toast(tc({en:"Fill title and base price",hi:"शीर्षक और आधार मूल्य भरें",bn:"শিরোনাম ও ভিত্তি মূল্য পূরণ করুন"}), "error"); return; }
    await auctionService.create(form);
    toast(tc({en:"Auction created",hi:"नीलामी बनाई गई",bn:"নিলাম তৈরি হয়েছে"}), "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const placeBid = async () => {
    if (!bid.bidderName || !bid.price) { toast(tc({en:"Enter name and amount",hi:"नाम और राशि दर्ज करें",bn:"নাম ও পরিমাণ লিখুন"}), "error"); return; }
    try {
      await auctionService.placeBid(detail.id, bid);
      toast(tc({en:"Bid placed",hi:"बोली लगाई गई",bn:"বিড দেওয়া হয়েছে"}), "success"); setBid({ bidderName: "", price: "" }); await reload(detail.id); refresh();
    } catch (e) { toast(e.message, "error"); }
  };

  const close = async () => { await auctionService.close(detail.id); toast(tc({en:"Auction closed & awarded",hi:"नीलामी बंद और आवंटित",bn:"নিলাম বন্ধ ও প্রদান করা হয়েছে"}), "success"); await reload(detail.id); refresh(); };

  const reverse = detail?.type === "reverse";

  return (
    <>
      <AppBar title={tc({en:"Auctions",hi:"नीलामी",bn:"নিলাম"})} onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>{tc({en:"New",hi:"नई",bn:"নতুন"})}</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="Gavel" title={tc({en:"No auctions",hi:"कोई नीलामी नहीं",bn:"কোনো নিলাম নেই"})}
            body={tc({en:"Run a forward auction to sell to the highest bidder, or a reverse auction to procure at the lowest quote.",hi:"सबसे ऊँची बोली पर बेचने के लिए फॉरवर्ड नीलामी चलाएँ, या सबसे कम कोट पर खरीद के लिए रिवर्स नीलामी।",bn:"সর্বোচ্চ দরদাতার কাছে বিক্রির জন্য ফরোয়ার্ড নিলাম চালান, অথবা সর্বনিম্ন কোটে সংগ্রহের জন্য রিভার্স নিলাম।"})}
            action={tc({en:"New auction",hi:"नई नीलामी",bn:"নতুন নিলাম"})} onAction={() => setOpen(true)} />
        ) : list.map((a) => <AuctionCard key={a.id} auction={a} onClick={() => openDetail(a)} />)}
      </div>

      {/* detail + bidding */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>
                {reverse ? tc({en:"Reverse",hi:"रिवर्स",bn:"রিভার্স"}) : tc({en:"Forward",hi:"फॉरवर्ड",bn:"ফরোয়ার্ড"})} · {detail.commodity}{detail.quantityKg ? ` · ${(detail.quantityKg / 1000).toLocaleString("en-IN")} t` : ""}
              </span>
              <StatusPill status={detail.status} map={AUCTION_STATUS} />
            </div>

            <div style={{ background: T.primarySoft, borderRadius: T.rMd, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: T.inkSoft }}>{reverse ? tc({en:"Lowest quote",hi:"सबसे कम कोट",bn:"সর্বনিম্ন কোট"}) : tc({en:"Highest bid",hi:"सबसे ऊँची बोली",bn:"সর্বোচ্চ বিড"})}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: T.display }}>{rupee(detail.currentPrice)}</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{tc({en:"Base",hi:"आधार",bn:"ভিত্তি"})} {rupee(detail.basePrice)}{detail.unit ? `/${detail.unit}` : ""}</div>
            </div>

            {detail.status === "awarded" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.primarySoft, borderRadius: T.rMd, padding: "10px 12px" }}>
                <Icon name="BadgeCheck" size={18} color={T.primary} />
                <span style={{ fontSize: 13, color: T.ink }}>{tc({en:"Awarded to",hi:"आवंटित किया गया",bn:"প্রদান করা হয়েছে"})} <b>{detail.winnerName}</b> {tc({en:"at",hi:"पर",bn:"এ"})} {rupee(detail.winnerPrice)}</span>
              </div>
            )}

            {detail.status === "live" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Input label={tc({en:"Your name",hi:"आपका नाम",bn:"আপনার নাম"})} value={bid.bidderName} onChange={(v) => setBid({ ...bid, bidderName: v })} icon="User" />
                <Input label={reverse ? tc({en:"Your quote (₹)",hi:"आपका कोट (₹)",bn:"আপনার কোট (₹)"}) : tc({en:"Your bid (₹)",hi:"आपकी बोली (₹)",bn:"আপনার বিড (₹)"})} value={bid.price} onChange={(v) => setBid({ ...bid, price: v })} icon="IndianRupee" type="number" />
                <Button full icon="Gavel" onClick={placeBid}>{reverse ? tc({en:"Submit quote",hi:"कोट सबमिट करें",bn:"কোট জমা দিন"}) : tc({en:"Place bid",hi:"बोली लगाएँ",bn:"বিড দিন"})}</Button>
                <Button variant="outline" full icon="Check" onClick={close}>{tc({en:"Close & pick winner",hi:"बंद करें और विजेता चुनें",bn:"বন্ধ করুন ও বিজয়ী নির্বাচন করুন"})}</Button>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{tc({en:"Bids",hi:"बोलियाँ",bn:"বিড"})} ({bids.length})</div>
              {bids.length === 0 ? (
                <div style={{ fontSize: 12.5, color: T.inkFaint }}>{tc({en:"No bids yet.",hi:"अभी तक कोई बोली नहीं।",bn:"এখনো কোনো বিড নেই।"})}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {bids.map((b) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px",
                      background: T.surface2, borderRadius: T.rMd }}>
                      <span style={{ fontSize: 12.5, color: T.ink }}>{b.bidderName}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{rupee(b.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* create */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title={tc({en:"New Auction",hi:"नई नीलामी",bn:"নতুন নিলাম"})}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label={tc({en:"Title",hi:"शीर्षक",bn:"শিরোনাম"})} value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="Gavel" />
          <Dropdown label={tc({en:"Type",hi:"प्रकार",bn:"ধরন"})} value={form.type} onChange={(v) => setForm({ ...form, type: v })}
            options={AUCTION_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <Dropdown label={tc({en:"Commodity",hi:"जिंस",bn:"পণ্য"})} value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label={tc({en:"Quantity (kg)",hi:"मात्रा (किग्रा)",bn:"পরিমাণ (কেজি)"})} value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label={form.type === "reverse" ? tc({en:"Budget / base (₹)",hi:"बजट / आधार (₹)",bn:"বাজেট / ভিত্তি (₹)"}) : tc({en:"Base price (₹)",hi:"आधार मूल्य (₹)",bn:"ভিত্তি মূল্য (₹)"})} value={form.basePrice} onChange={(v) => setForm({ ...form, basePrice: v })} icon="IndianRupee" type="number" />
          <Input label={tc({en:"Seller / Buyer name",hi:"विक्रेता / खरीदार का नाम",bn:"বিক্রেতা / ক্রেতার নাম"})} value={form.sellerName} onChange={(v) => setForm({ ...form, sellerName: v })} icon="User" />
          <Button full icon="Check" onClick={create}>{tc({en:"Create auction",hi:"नीलामी बनाएँ",bn:"নিলাম তৈরি করুন"})}</Button>
        </div>
      </BottomSheet>
    </>
  );
}
