import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, Button, Chip, Card } from "../../components/index.js";
import Icon from "../../components/Icon.jsx";
import { BottomSheet, Input, Dropdown, Dialog } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { employeeService, ROLES } from "../../services/employees/employeeService.js";
import { rupee } from "../../utils/format.js";
import StatTile from "../../components/erp/StatTile.jsx";
import { EmptyHint, Pill } from "../../components/erp/RecordList.jsx";

const TABS = ["Team", "Attendance", "Wages"];
const ymNow = () => new Date().toISOString().slice(0, 7);

export default function EmployeeManager() {
  const { pop, toast } = useApp();
  const [tab, setTab]         = useState("Team");
  const [employees, setEmployees] = useState([]);
  const [todayMap, setTodayMap]   = useState({});
  const [wages, setWages]     = useState([]);
  const [tick, setTick]       = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "worker", phone: "", dailyWage: "" });
  const [delId, setDelId] = useState(null);

  useEffect(() => {
    employeeService.getAll().then(setEmployees);
    employeeService.todayStatus().then(setTodayMap);
    employeeService.monthWages(undefined, ymNow()).then(setWages);
  }, [tick]);

  const add = async () => {
    if (!form.name) return;
    await employeeService.add(form);
    setOpen(false); setForm({ name: "", role: "worker", phone: "", dailyWage: "" });
    refresh(); toast("Employee added", "success");
  };

  const mark = async (id, status) => {
    await employeeService.mark(id, status);
    refresh(); toast(`Marked ${status}`, "success");
  };

  const handleDelete = async () => { await employeeService.remove(delId); setDelId(null); refresh(); toast("Removed", "info"); };

  const presentToday = Object.values(todayMap).filter((s) => s === "present" || s === "halfday").length;
  const totalWages = wages.reduce((s, w) => s + w.wage, 0);

  const ATT_BTNS = [
    { status: "present", label: "P", fg: T.primary, bg: T.primarySoft },
    { status: "halfday", label: "½", fg: T.orange,  bg: T.orangeSoft  },
    { status: "absent",  label: "A", fg: T.red,     bg: T.redSoft     },
  ];

  return (
    <>
      <AppBar title="Team" onBack={pop} action={
        <button onClick={() => setOpen(true)}
          style={{ background: T.blue, border: "none", borderRadius: 12, padding: "8px 13px",
            cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6,
            fontFamily: T.body, fontSize: 13, fontWeight: 600 }}>
          <Icon name="Plus" size={15} color="#fff" /> Add
        </button>
      } />

      <div style={{ display: "flex", gap: 10, padding: "8px 16px 4px", overflowX: "auto" }}>
        <StatTile a="blue" label="Employees" value={employees.length} />
        <StatTile a="primary" label="Present Today" value={presentToday} />
        <StatTile a="orange" label="Wages This Month" value={rupee(totalWages)} minWidth={130} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px 4px" }}>
        {TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}
      </div>

      <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
        {employees.length === 0 && <EmptyHint icon="Users" text="Add farm workers to track attendance and wages" />}

        {tab === "Team" && employees.map((e) => (
          <Card key={e.id} pad={13}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueSoft,
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="User" size={20} color={T.blue} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{e.name}</div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                  {employeeService.roleLabel(e.role)}
                  {e.dailyWage ? ` · ${rupee(Number(e.dailyWage))}/day` : ""}
                  {e.phone ? ` · ${e.phone}` : ""}
                </div>
              </div>
              <button onClick={() => setDelId(e.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4 }}>
                <Icon name="Trash2" size={15} />
              </button>
            </div>
          </Card>
        ))}

        {tab === "Attendance" && employees.map((e) => (
          <Card key={e.id} pad={13}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}>
                  {e.name}
                  {todayMap[e.id] === "present" && <Pill>PRESENT</Pill>}
                  {todayMap[e.id] === "halfday" && <Pill fg={T.orange} bg={T.orangeSoft}>HALF DAY</Pill>}
                  {todayMap[e.id] === "absent"  && <Pill fg={T.red} bg={T.redSoft}>ABSENT</Pill>}
                </div>
                <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>Mark today's attendance</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {ATT_BTNS.map((b) => (
                  <button key={b.status} onClick={() => mark(e.id, b.status)}
                    style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
                      background: todayMap[e.id] === b.status ? b.fg : b.bg,
                      color: todayMap[e.id] === b.status ? "#fff" : b.fg,
                      fontWeight: 800, fontSize: 13, fontFamily: T.body }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {tab === "Wages" && (
          wages.length === 0
            ? (employees.length > 0 && <EmptyHint icon="Banknote" text="Mark attendance to build this month's wage sheet" />)
            : wages.map((w) => (
              <Card key={w.employee.id} pad={13}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{w.employee.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                      {w.daysWorked} day{w.daysWorked !== 1 ? "s" : ""} worked this month
                      {w.employee.dailyWage ? ` × ${rupee(Number(w.employee.dailyWage))}` : " · set daily wage to compute"}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.primary, fontFamily: T.display }}>
                    {rupee(w.wage)}
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Add Employee">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Name" placeholder="e.g. Ramesh" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Dropdown label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={ROLES.map((r) => ({ value: r.id, label: r.label }))} />
          <Input label="Phone" placeholder="Optional" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Input label="Daily wage (₹)" type="number" placeholder="0" value={form.dailyWage} onChange={(v) => setForm((f) => ({ ...f, dailyWage: v }))} />
          <Button full onClick={add} disabled={!form.name}>Add Employee</Button>
        </div>
      </BottomSheet>

      <Dialog open={!!delId} title="Remove employee?" onClose={() => setDelId(null)}
        actions={[
          { label: "Cancel", variant: "outline", onClick: () => setDelId(null) },
          { label: "Remove", variant: "danger",  onClick: handleDelete },
        ]}>
        <div style={{ fontSize: 14, color: T.inkSoft }}>The profile and attendance history will be removed.</div>
      </Dialog>
    </>
  );
}
