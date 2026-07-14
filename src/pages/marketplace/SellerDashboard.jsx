import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, Button, BottomSheet, Dialog, Input, Dropdown, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { RecordRow, EmptyHint, Pill } from "../../components/erp/RecordList.jsx";
import { accent } from "../../components/primitives.jsx";
import { sellerService } from "../../services/marketplace/sellerService.js";
import { productService } from "../../services/marketplace/productService.js";
import { mpOrderService } from "../../services/marketplace/mpOrderService.js";
import { PRODUCT_CATEGORIES, UNITS, SELLER_TYPES, ORDER_STATUS, PRODUCT_STATUS } from "../../services/marketplace/constantsMp.js";
import { rupee, compact } from "../../utils/format.js";

const EMPTY_PRODUCT = { name: "", category: "seeds", brand: "", unit: "kg", price: "", discountPrice: "", stock: "", lowStockAt: "", description: "" };

export default function SellerDashboard() {
  const { pop, push, toast } = useApp();
  const [store, setStore] = useState(undefined);    // undefined = loading, null = no store
  const [tab, setTab] = useState("listings");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ orders: 0, active: 0, revenue: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const [regOpen, setRegOpen] = useState(false);
  const [reg, setReg] = useState({ name: "", type: "farmer", village: "", district: "", tagline: "", gstin: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);

  useEffect(() => {
    sellerService.getMine().then((s) => {
      setStore(s || null);
      if (!s) return;
      productService.bySeller(s.id).then(setProducts);
      mpOrderService.bySeller(s.id).then(setOrders);
      mpOrderService.sellerSummary(s.id).then(setSummary);
      productService.lowStock(s.id).then(setLowStock);
    });
  }, [tick]);

  /* ---------- no store yet: onboarding ---------- */
  if (store === undefined) return <><AppBar title="Sell on AgriOS" onBack={pop} /></>;
  if (store === null) {
    return (
      <>
        <AppBar title="Sell on AgriOS" onBack={pop} />
        <div style={{ padding: "12px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
            borderRadius: T.rLg, padding: 20, color: "#fff", textAlign: "center" }}>
            <Icon name="Store" size={40} color="#fff" />
            <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 800, marginTop: 10 }}>Open your store</div>
            <div style={{ fontSize: 12.5, opacity: .88, marginTop: 6, lineHeight: 1.5 }}>
              Sell produce, seeds, feed and equipment to farmers.
              Free to start — list products in under a minute.
            </div>
          </div>
          {[
            ["Package", "List your products", "Add produce or inputs with price and stock"],
            ["ClipboardList", "Receive orders", "Track each order from pending to delivered"],
            ["BadgeCheck", "Get verified", "KYC & GST verification arrives with the backend phase"],
          ].map(([icon, title, desc]) => (
            <Card key={title} pad={13} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={icon} size={18} color={T.primary} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12, color: T.inkSoft }}>{desc}</div>
              </div>
            </Card>
          ))}
          <Button full size="lg" onClick={() => setRegOpen(true)}>Create my store</Button>
        </div>

        <BottomSheet open={regOpen} onClose={() => setRegOpen(false)} title="Create store">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Store name" placeholder="e.g. Hazari Agro Farm" value={reg.name} onChange={(v) => setReg((f) => ({ ...f, name: v }))} />
            <Dropdown label="Seller type" value={reg.type} onChange={(v) => setReg((f) => ({ ...f, type: v }))}
              options={SELLER_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
            <Input label="Village / Town" value={reg.village} onChange={(v) => setReg((f) => ({ ...f, village: v }))} />
            <Input label="District" value={reg.district} onChange={(v) => setReg((f) => ({ ...f, district: v }))} />
            <Input label="Tagline (optional)" placeholder="What you're known for" value={reg.tagline} onChange={(v) => setReg((f) => ({ ...f, tagline: v }))} />
            <Input label="GSTIN (optional)" placeholder="For businesses" value={reg.gstin} onChange={(v) => setReg((f) => ({ ...f, gstin: v }))} />
            <Button full disabled={!reg.name || !reg.village} onClick={async () => {
              await sellerService.register(reg);
              setRegOpen(false); refresh(); toast("Store created — add your first product", "success");
            }}>Create store</Button>
          </div>
        </BottomSheet>
      </>
    );
  }

  /* ---------- store dashboard ---------- */
  const saveProduct = async () => {
    if (!form.name || !form.price) return;
    if (editId) {
      await productService.update(editId, {
        ...form, price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stock: Number(form.stock) || 0, lowStockAt: Number(form.lowStockAt) || 0,
      });
      toast("Product updated", "success");
    } else {
      await productService.add({ ...form, sellerId: store.id, sellerName: store.name });
      toast("Product saved as draft — publish it to go live", "success");
    }
    setFormOpen(false); setForm(EMPTY_PRODUCT); setEditId(null); refresh();
  };

  const statusPill = (s) => {
    const meta = PRODUCT_STATUS[s] || { label: s, a: "primary" };
    const c = accent(meta.a);
    return <Pill fg={c.fg} bg={c.bg}>{meta.label.toUpperCase()}</Pill>;
  };

  const orderPill = (s) => {
    const meta = ORDER_STATUS[s] || { label: s, a: "primary" };
    const c = accent(meta.a);
    return <Pill fg={c.fg} bg={c.bg}>{meta.label.toUpperCase()}</Pill>;
  };

  return (
    <>
      <AppBar title={store.name} onBack={pop} action={tab === "listings" ? (
        <button onClick={() => { setForm(EMPTY_PRODUCT); setEditId(null); setFormOpen(true); }}
          style={{ background: T.primary, border: "none", borderRadius: 12, padding: "8px 13px",
            cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6,
            fontFamily: T.body, fontSize: 13, fontWeight: 600 }}>
          <Icon name="Plus" size={15} color="#fff" /> Add
        </button>
      ) : undefined} />

      <div style={{ display: "flex", gap: 10, padding: "8px 16px 4px", overflowX: "auto" }}>
        <StatTile a="primary" label="Revenue" value={compact(summary.revenue)} />
        <StatTile a="blue" label="Active orders" value={summary.active} />
        <StatTile a="orange" label="Listings" value={products.length} />
        <StatTile a={lowStock.length ? "red" : "primary"} label="Low stock" value={lowStock.length} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px 4px" }}>
        {[["listings", "Listings"], ["orders", `Orders (${summary.active})`], ["store", "Store"]].map(([id, label]) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>
        ))}
      </div>

      <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* ---- listings ---- */}
        {tab === "listings" && (products.length === 0
          ? <EmptyHint icon="Package" text="Add your first product — it starts as a draft and goes live when you publish it" />
          : products.map((p) => (
            <RecordRow key={p.id}
              icon={productService.categoryIcon(p.category)}
              iconColor={accent(PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.accent || "primary").fg}
              iconBg={accent(PRODUCT_CATEGORIES.find((c) => c.id === p.category)?.accent || "primary").bg}
              title={p.name} badge={statusPill(p.status)}
              subtitle={`${rupee(productService.unitPrice(p))}/${p.unit} · ${productService.available(p)} available${p.reserved ? ` · ${p.reserved} reserved` : ""}`}
              onClick={() => {
                setForm({ name: p.name, category: p.category, brand: p.brand || "", unit: p.unit,
                  price: String(p.price), discountPrice: p.discountPrice ? String(p.discountPrice) : "",
                  stock: String(p.stock), lowStockAt: String(p.lowStockAt || ""), description: p.description || "" });
                setEditId(p.id); setFormOpen(true);
              }}
              right={
                <button onClick={async (e) => {
                  e.stopPropagation();
                  await productService.setStatus(p.id, p.status === "published" ? "draft" : "published");
                  refresh(); toast(p.status === "published" ? "Listing taken offline" : "Listing is live", "success");
                }}
                  style={{ background: p.status === "published" ? T.surface2 : T.primarySoft,
                    color: p.status === "published" ? T.inkSoft : T.primary, border: "none", borderRadius: 9,
                    padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.body, flexShrink: 0 }}>
                  {p.status === "published" ? "Unpublish" : "Publish"}
                </button>
              }
              onDelete={() => setDelId(p.id)} />
          )))}

        {/* ---- orders ---- */}
        {tab === "orders" && (orders.length === 0
          ? <EmptyHint icon="ClipboardList" text="Orders from buyers will appear here" />
          : orders.map((o) => {
            const next = mpOrderService.nextStatus(o.status);
            return (
              <Card key={o.id} pad={13}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>#{o.id.slice(-6).toUpperCase()}</span>
                  {orderPill(o.status)}
                  <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 13.5 }}>{rupee(o.total)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 5 }}>
                  {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </div>
                {o.address && (
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>
                    <Icon name="MapPin" size={11} style={{ verticalAlign: -1 }} /> {o.address.name} · {o.address.village}{o.address.district ? `, ${o.address.district}` : ""} · {o.address.phone}
                  </div>
                )}
                {next && (
                  <div style={{ marginTop: 10 }}>
                    <Button size="sm" variant="soft" icon="ArrowRight" onClick={async () => {
                      await mpOrderService.setStatus(o.id, next);
                      refresh(); toast(`Order marked ${ORDER_STATUS[next].label.toLowerCase()}`, "success");
                    }}>
                      Mark {ORDER_STATUS[next].label}
                    </Button>
                  </div>
                )}
              </Card>
            );
          }))}

        {/* ---- store settings ---- */}
        {tab === "store" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card pad={13} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon name={store.verificationStatus === "verified" ? "BadgeCheck" : "BadgeAlert"} size={20}
                color={store.verificationStatus === "verified" ? T.blue : T.orange} />
              <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>
                Verification: <b style={{ color: T.ink }}>{store.verificationStatus}</b> · KYC: <b style={{ color: T.ink }}>{store.kycStatus?.replace("_", " ")}</b><br />
                Real KYC / GST verification opens with the shared backend phase.
              </div>
            </Card>
            <StoreEditForm store={store} onSaved={() => { refresh(); toast("Store updated", "success"); }} />
          </div>
        )}
      </div>

      {/* product form */}
      <BottomSheet open={formOpen} onClose={() => { setFormOpen(false); setEditId(null); }}
        title={editId ? "Edit product" : "Add product"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Product name" placeholder="e.g. Swarna Paddy Seed 10kg" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Dropdown label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            options={PRODUCT_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
          <Input label="Brand (optional)" value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Dropdown label="Unit" value={form.unit} onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              options={UNITS.map((u) => ({ value: u, label: u }))} />
            <Input label="Price (₹)" type="number" placeholder="0" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Offer price (optional)" type="number" placeholder="0" value={form.discountPrice} onChange={(v) => setForm((f) => ({ ...f, discountPrice: v }))} />
            <Input label="Stock" type="number" placeholder="0" value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} />
          </div>
          <Input label="Low-stock alert level" type="number" placeholder="0" value={form.lowStockAt} onChange={(v) => setForm((f) => ({ ...f, lowStockAt: v }))} />
          <Input label="Description" placeholder="Variety, grade, packing…" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          <Button full onClick={saveProduct} disabled={!form.name || !form.price}>
            {editId ? "Save changes" : "Add product"}
          </Button>
        </div>
      </BottomSheet>

      <Dialog open={!!delId} onClose={() => setDelId(null)} danger icon="Trash2"
        title="Delete listing?" body="The product will be removed from the marketplace."
        confirmLabel="Delete" onConfirm={async () => { await productService.remove(delId); setDelId(null); refresh(); toast("Deleted", "info"); }} />
    </>
  );
}

function StoreEditForm({ store, onSaved }) {
  const [f, setF] = useState({ name: store.name, tagline: store.tagline || "", village: store.village || "",
    district: store.district || "", gstin: store.gstin || "", description: store.description || "" });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Card pad={14}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Input label="Store name" value={f.name} onChange={set("name")} />
        <Input label="Tagline" value={f.tagline} onChange={set("tagline")} />
        <Input label="Village / Town" value={f.village} onChange={set("village")} />
        <Input label="District" value={f.district} onChange={set("district")} />
        <Input label="GSTIN" value={f.gstin} onChange={set("gstin")} />
        <Input label="About the store" value={f.description} onChange={set("description")} />
        <Button full disabled={!f.name} onClick={async () => {
          await sellerService.update(store.id, { ...f, kycStatus: f.gstin ? "submitted" : store.kycStatus });
          onSaved();
        }}>Save store</Button>
      </div>
    </Card>
  );
}
