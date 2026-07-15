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
  const { pop, toast } = useApp();
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
    if (!form.title || !form.basePrice) { toast("Fill title and base price", "error"); return; }
    await auctionService.create(form);
    toast("Auction created", "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const placeBid = async () => {
    if (!bid.bidderName || !bid.price) { toast("Enter name and amount", "error"); return; }
    try {
      await auctionService.placeBid(detail.id, bid);
      toast("Bid placed", "success"); setBid({ bidderName: "", price: "" }); await reload(detail.id); refresh();
    } catch (e) { toast(e.message, "error"); }
  };

  const close = async () => { await auctionService.close(detail.id); toast("Auction closed & awarded", "success"); await reload(detail.id); refresh(); };

  const reverse = detail?.type === "reverse";

  return (
    <>
      <AppBar title="Auctions" onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>New</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="Gavel" title="No auctions"
            body="Run a forward auction to sell to the highest bidder, or a reverse auction to procure at the lowest quote."
            action="New auction" onAction={() => setOpen(true)} />
        ) : list.map((a) => <AuctionCard key={a.id} auction={a} onClick={() => openDetail(a)} />)}
      </div>

      {/* detail + bidding */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>
                {reverse ? "Reverse" : "Forward"} · {detail.commodity}{detail.quantityKg ? ` · ${(detail.quantityKg / 1000).toLocaleString("en-IN")} t` : ""}
              </span>
              <StatusPill status={detail.status} map={AUCTION_STATUS} />
            </div>

            <div style={{ background: T.primarySoft, borderRadius: T.rMd, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: T.inkSoft }}>{reverse ? "Lowest quote" : "Highest bid"}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: T.display }}>{rupee(detail.currentPrice)}</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>Base {rupee(detail.basePrice)}{detail.unit ? `/${detail.unit}` : ""}</div>
            </div>

            {detail.status === "awarded" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.primarySoft, borderRadius: T.rMd, padding: "10px 12px" }}>
                <Icon name="BadgeCheck" size={18} color={T.primary} />
                <span style={{ fontSize: 13, color: T.ink }}>Awarded to <b>{detail.winnerName}</b> at {rupee(detail.winnerPrice)}</span>
              </div>
            )}

            {detail.status === "live" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Input label="Your name" value={bid.bidderName} onChange={(v) => setBid({ ...bid, bidderName: v })} icon="User" />
                <Input label={reverse ? "Your quote (₹)" : "Your bid (₹)"} value={bid.price} onChange={(v) => setBid({ ...bid, price: v })} icon="IndianRupee" type="number" />
                <Button full icon="Gavel" onClick={placeBid}>{reverse ? "Submit quote" : "Place bid"}</Button>
                <Button variant="outline" full icon="Check" onClick={close}>Close & pick winner</Button>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Bids ({bids.length})</div>
              {bids.length === 0 ? (
                <div style={{ fontSize: 12.5, color: T.inkFaint }}>No bids yet.</div>
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
      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Auction">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="Gavel" />
          <Dropdown label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })}
            options={AUCTION_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <Dropdown label="Commodity" value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Quantity (kg)" value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label={form.type === "reverse" ? "Budget / base (₹)" : "Base price (₹)"} value={form.basePrice} onChange={(v) => setForm({ ...form, basePrice: v })} icon="IndianRupee" type="number" />
          <Input label="Seller / Buyer name" value={form.sellerName} onChange={(v) => setForm({ ...form, sellerName: v })} icon="User" />
          <Button full icon="Check" onClick={create}>Create auction</Button>
        </div>
      </BottomSheet>
    </>
  );
}
