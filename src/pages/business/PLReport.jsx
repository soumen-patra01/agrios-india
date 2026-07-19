import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, SectionHeader } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { plService } from "../../services/business/plService.js";
import { rupee } from "../../utils/format.js";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function BarChart({ data, maxVal, color, bg }) {
  if (!maxVal) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((d, i) => {
        const h = maxVal > 0 ? Math.max(3, Math.round((d.value / maxVal) * 56)) : 3;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", height: h, background: d.value > 0 ? color : bg,
              borderRadius: "3px 3px 0 0", transition: "height .3s var(--ag-ease)" }} />
            <div style={{ fontSize: 9, color: T.inkFaint }}>{MONTHS[d.month - 1]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PLReport() {
  const { pop } = useApp();
  const [year, setYear]     = useState(new Date().getFullYear());
  const [view, setView]     = useState("monthly"); // monthly | enterprise
  const [monthly, setMonthly]   = useState([]);
  const [byEnt, setByEnt]       = useState([]);
  const [total, setTotal]       = useState({ income: 0, expense: 0, net: 0 });
  const [years, setYears] = useState([]);

  useEffect(() => {
    plService.availableYears().then(setYears);
  }, []);

  useEffect(() => {
    (async () => {
      const m = await plService.byMonth(year);
      const e = await plService.byEnterprise(year);
      const t = await plService.yearTotal(year);
      setMonthly(m); setByEnt(e); setTotal(t);
    })();
  }, [year]);

  const maxIncome  = Math.max(...monthly.map((m) => m.income),  1);
  const maxExpense = Math.max(...monthly.map((m) => m.expense), 1);

  return (
    <>
      <AppBar title="P&L Report" onBack={pop} />
      <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* Year selector */}
        <div style={{ display: "flex", gap: 8 }}>
          {years.map((y) => (
            <button key={y} onClick={() => setYear(Number(y))}
              style={{ padding: "5px 12px", borderRadius: T.pill, border: `1px solid ${T.line}`,
                background: year === Number(y) ? T.primary : T.surface, color: year === Number(y) ? "#fff" : T.ink,
                fontFamily: T.body, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {y}
            </button>
          ))}
        </div>

        {/* Year totals */}
        <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
          borderRadius: T.rLg, padding: "18px 18px", color: "#fff" }}>
          <div style={{ fontSize: 12, opacity: .8, marginBottom: 8 }}>Year {year} Summary</div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, opacity: .7 }}>Income</div>
              <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700 }}>{rupee(total.income)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: .7 }}>Expense</div>
              <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700 }}>{rupee(total.expense)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: .7 }}>Net Profit</div>
              <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 800 }}>
                {total.net >= 0 ? "+" : ""}{rupee(total.net)}
              </div>
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          {["monthly", "enterprise"].map((v) => (
            <Chip key={v} active={view === v} onClick={() => setView(v)}>
              {v === "monthly" ? "Month-wise" : "By Enterprise"}
            </Chip>
          ))}
        </div>

        {/* Monthly view */}
        {view === "monthly" && (
          <>
            <Card pad={14}>
              <SectionHeader title="Monthly Income" />
              <BarChart data={monthly.map((m) => ({ month: m.month, value: m.income }))}
                maxVal={maxIncome} color={T.primary} bg={T.primarySoft} />
            </Card>
            <Card pad={14}>
              <SectionHeader title="Monthly Expense" />
              <BarChart data={monthly.map((m) => ({ month: m.month, value: m.expense }))}
                maxVal={maxExpense} color={T.red} bg={T.redSoft} />
            </Card>
            {monthly.filter((m) => m.income > 0 || m.expense > 0).map((m) => (
              <Card key={m.month} pad={12}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{MONTHS[m.month - 1]} {year}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.net >= 0 ? T.primary : T.red }}>
                    {m.net >= 0 ? "+" : ""}{rupee(m.net)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.inkSoft, marginTop: 4 }}>
                  <span style={{ color: T.primary }}>↑ {rupee(m.income)}</span>
                  <span style={{ color: T.red }}>↓ {rupee(m.expense)}</span>
                </div>
              </Card>
            ))}
            {monthly.every((m) => m.income === 0 && m.expense === 0) && (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.inkFaint, fontSize: 13 }}>
                No transactions for {year}. Add entries in Farm Ledger.
              </div>
            )}
          </>
        )}

        {/* Enterprise view */}
        {view === "enterprise" && (
          byEnt.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: T.inkFaint, fontSize: 13 }}>
              No transactions for {year}. Add entries in Farm Ledger with an enterprise selected.
            </div>
          ) : (
            byEnt.map((e) => (
              <Card key={e.id} pad={14}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: e.net >= 0 ? T.primary : T.red }}>
                    {e.net >= 0 ? "+" : ""}{rupee(e.net)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Income bar */}
                  <div style={{ flex: e.income, background: T.primarySoft, borderRadius: "6px 0 0 6px",
                    padding: "6px 8px", minWidth: e.income > 0 ? 40 : 0 }}>
                    {e.income > 0 && <div style={{ fontSize: 11, color: T.primary }}>↑ {rupee(e.income)}</div>}
                  </div>
                  {/* Expense bar */}
                  <div style={{ flex: e.expense, background: T.redSoft, borderRadius: "0 6px 6px 0",
                    padding: "6px 8px", minWidth: e.expense > 0 ? 40 : 0 }}>
                    {e.expense > 0 && <div style={{ fontSize: 11, color: T.red }}>↓ {rupee(e.expense)}</div>}
                  </div>
                </div>
              </Card>
            ))
          )
        )}
      </div>
    </>
  );
}
