import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, Card, Button, Input, Dropdown, SectionHeader } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { cartService } from "../../services/marketplace/cartService.js";
import { mpOrderService } from "../../services/marketplace/mpOrderService.js";
import { PAYMENT_METHODS } from "../../services/marketplace/constantsMp.js";
import { rupee } from "../../utils/format.js";

export default function CheckoutPage() {
  const { pop, push, toast, user } = useApp();
  const [lines, setLines] = useState([]);
  const [address, setAddress] = useState(() => mpOrderService.getAddress() || {
    name: user?.name || "", phone: user?.phone || "", village: "", district: "", state: "", pin: "",
  });
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);

  useEffect(() => { cartService.getLines().then(setLines); }, []);

  const valid = lines.filter((l) => !l.saved && !l.problem);
  const totals = cartService.totals(lines);
  const bySeller = {};
  valid.forEach((l) => { (bySeller[l.product.sellerName || "Seller"] ||= []).push(l); });
  const addressOk = address.name && address.phone && address.village;

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    mpOrderService.saveAddress(address);
    const created = await mpOrderService.createFromCart(valid, { paymentMethod: payment, address });
    await cartService.clearActive();
    toast(`${created.length} order${created.length > 1 ? "s" : ""} placed`, "success");
    pop(); pop();                        // drop checkout + cart from the stack
    push({ kind: "mpOrders" });
  };

  const set = (k) => (v) => setAddress((a) => ({ ...a, [k]: v }));

  return (
    <>
      <AppBar title="Checkout" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 12,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <SectionHeader title="Delivery address" />
        <Card pad={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input label="Full name" value={address.name} onChange={set("name")} placeholder="Your name" />
            <Input label="Phone" type="tel" inputMode="numeric" value={address.phone} onChange={set("phone")} placeholder="10-digit mobile" maxLength={10} />
            <Input label="Village / Town" value={address.village} onChange={set("village")} placeholder="Village or town" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="District" value={address.district} onChange={set("district")} placeholder="District" />
              <Input label="PIN code" inputMode="numeric" value={address.pin} onChange={set("pin")} placeholder="6 digits" maxLength={6} />
            </div>
          </div>
        </Card>

        <SectionHeader title="Payment" />
        <Card pad={14}>
          <Dropdown label="Payment method" value={payment} onChange={setPayment}
            options={PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.label }))} />
          <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            Online payment collection arrives with the shared backend phase — for now
            payment is settled directly with the seller on delivery and recorded here.
          </div>
        </Card>

        <SectionHeader title="Order summary" />
        {Object.entries(bySeller).map(([sellerName, group]) => (
          <Card key={sellerName} pad={14}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.primary, marginBottom: 8 }}>{sellerName}</div>
            {group.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0", color: T.inkSoft }}>
                <span>{l.product.name} × {l.qty}</span>
                <b style={{ color: T.ink }}>{rupee(l.lineTotal)}</b>
              </div>
            ))}
          </Card>
        ))}

        <Card pad={14}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800 }}>
            <span>Total</span><span>{rupee(totals.total)}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4 }}>
            {valid.length} item{valid.length !== 1 ? "s" : ""} · one order per seller
          </div>
        </Card>

        <Button full size="lg" disabled={!addressOk || valid.length === 0 || placing} onClick={placeOrder}>
          {placing ? "Placing order…" : `Place Order · ${rupee(totals.total)}`}
        </Button>
        {!addressOk && (
          <div style={{ fontSize: 12, color: T.inkFaint, textAlign: "center" }}>
            Fill name, phone and village to place the order.
          </div>
        )}
      </div>
    </>
  );
}
