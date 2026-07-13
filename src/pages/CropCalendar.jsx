import { useState, useMemo } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Card, Chip, SectionHeader, IconTile, Button } from "../components/index.js";
import { BottomSheet, Dialog, Dropdown, Input } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { cropCalendarService, CROPS } from "../services/calendar/cropCalendarService.js";

const FILTERS = ["Upcoming", "Overdue", "Done"];

const CROP_OPTIONS = [
  { value: "", label: "Select crop…" },
  ...CROPS.map((c) => ({ value: c.id, label: `${c.name} (${c.season})` })),
];

const TODAY_STR = new Date().toISOString().slice(0, 10);

export default function CropCalendar() {
  const { pop, toast } = useApp();
  const [filter, setFilter]   = useState("Upcoming");
  const [tick, setTick]       = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]       = useState({ cropId: "", sowingDate: "", areaAcres: "", fieldName: "" });

  const instances    = useMemo(() => cropCalendarService.all(),            [tick]);
  const overdueCount = useMemo(() => cropCalendarService.overdueTasks().length, [tick]);
  const weekCount    = useMemo(() => cropCalendarService.upcomingTasks(7).length, [tick]);

  const tasks = useMemo(() => {
    if (filter === "Upcoming") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return cropCalendarService.allTasks().filter((t) => !t.done && new Date(t.dueDate) >= today);
    }
    if (filter === "Overdue") return cropCalendarService.overdueTasks();
    return cropCalendarService.allTasks().filter((t) => t.done);
  }, [tick, filter]);

  const refresh = () => setTick((n) => n + 1);

  const toggleTask = (task) => {
    if (task.done) cropCalendarService.markUndone(task.taskKey);
    else cropCalendarService.markDone(task.taskKey);
    refresh();
  };

  const canSubmit = !!(form.cropId && form.sowingDate);

  const handleAdd = () => {
    cropCalendarService.add({
      cropId:    form.cropId,
      sowingDate: form.sowingDate,
      areaAcres: parseFloat(form.areaAcres) || 0,
      fieldName: form.fieldName.trim(),
    });
    setForm({ cropId: "", sowingDate: "", areaAcres: "", fieldName: "" });
    setAddOpen(false);
    refresh();
    toast("Crop registered", "success");
  };

  const handleDelete = () => {
    cropCalendarService.remove(deleteId);
    setDeleteId(null);
    refresh();
    toast("Crop removed", "success");
  };

  return (
    <>
      <AppBar title="Crop Calendar" onBack={pop} action={
        <button onClick={() => setAddOpen(true)}
          style={{ background: T.primary, border: "none", borderRadius: 12,
            padding: "8px 14px", cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: T.body, fontSize: 13, fontWeight: 600 }}>
          <Icon name="Plus" size={15} color="#fff" /> Add crop
        </button>
      } />

      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column",
        gap: 20, animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* Empty state */}
        {instances.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 24px", textAlign: "center", gap: 18 }}>
            <div style={{ width: 68, height: 68, borderRadius: 22, background: T.primarySoft,
              display: "grid", placeItems: "center", color: T.primary }}>
              <Icon name="CalendarDays" size={34} />
            </div>
            <div>
              <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700, color: T.ink }}>
                No crops yet
              </div>
              <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 5, lineHeight: 1.55 }}>
                Register a crop to get a personalised<br />task schedule with real due dates.
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)}>Register first crop</Button>
          </div>
        )}

        {instances.length > 0 && (
          <>
            {/* Summary tiles */}
            <div style={{ display: "flex", gap: 10 }}>
              <SummaryTile icon="CalendarDays" label="Crops"     value={instances.length} bg={T.primarySoft} color={T.primary} />
              <SummaryTile icon="Timer"        label="This week" value={weekCount}         bg={T.orangeSoft}  color={T.orange}  />
              <SummaryTile icon="AlertCircle"  label="Overdue"   value={overdueCount}      bg={T.redSoft}     color={T.red}     />
            </div>

            {/* Registered crop cards */}
            <div>
              <SectionHeader title="Registered crops" />
              <div style={{ display: "flex", gap: 12, overflowX: "auto",
                paddingBottom: 4, marginLeft: -16, paddingLeft: 16, marginRight: -16, paddingRight: 16 }}>
                {instances.map((inst) => <CropCard key={inst.id} inst={inst} onDelete={() => setDeleteId(inst.id)} />)}
              </div>
            </div>

            {/* Task list */}
            <div>
              <SectionHeader title="Tasks" />
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {FILTERS.map((f) => (
                  <Chip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
                ))}
              </div>

              {tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0",
                  color: T.inkFaint, fontSize: 14 }}>
                  No {filter.toLowerCase()} tasks
                </div>
              ) : (
                <Card pad={6}>
                  {tasks.map((task, i) => (
                    <TaskRow key={task.taskKey} task={task} i={i}
                      onToggle={() => toggleTask(task)} />
                  ))}
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add crop sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Register crop">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Dropdown
            label="Crop *"
            value={form.cropId}
            onChange={(v) => setForm((f) => ({ ...f, cropId: v }))}
            options={CROP_OPTIONS}
          />
          <Input
            label="Sowing / planting date *"
            type="date"
            value={form.sowingDate}
            onChange={(v) => setForm((f) => ({ ...f, sowingDate: v }))}
          />
          <Input
            label="Area (acres)"
            type="number"
            value={form.areaAcres}
            onChange={(v) => setForm((f) => ({ ...f, areaAcres: v }))}
            placeholder="e.g. 2.5"
          />
          <Input
            label="Field name (optional)"
            value={form.fieldName}
            onChange={(v) => setForm((f) => ({ ...f, fieldName: v }))}
            placeholder="e.g. North field"
          />
          <Button full disabled={!canSubmit} onClick={handleAdd}>Save crop</Button>
        </div>
      </BottomSheet>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Remove crop?"
        body="This will remove the crop and all its task history."
        icon="Trash2"
        danger
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
      />
    </>
  );
}

function CropCard({ inst, onDelete }) {
  const def      = cropCalendarService.cropDef(inst.cropId);
  const sowDays  = Math.floor((Date.now() - new Date(inst.sowingDate)) / 86400000);
  const daysLeft = def ? def.days - sowDays : null;

  return (
    <div style={{ minWidth: 162, background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: T.rLg, padding: 14, flexShrink: 0, position: "relative" }}>
      <button onClick={onDelete}
        style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none",
          cursor: "pointer", color: T.inkFaint, display: "flex", padding: 4 }}>
        <Icon name="X" size={14} />
      </button>
      <IconTile name={def?.icon || "Sprout"} a="primary" size={36} iconSize={17} />
      <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700,
        color: T.ink, marginTop: 10 }}>{def?.name}</div>
      {inst.fieldName && (
        <div style={{ fontSize: 11.5, color: T.inkSoft }}>{inst.fieldName}</div>
      )}
      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>Sown {inst.sowingDate}</div>
      {inst.areaAcres > 0 && (
        <div style={{ fontSize: 11.5, color: T.inkSoft }}>{inst.areaAcres} ac</div>
      )}
      {daysLeft !== null && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, padding: "3px 8px",
          borderRadius: 7, display: "inline-block",
          background: daysLeft > 0 ? T.primarySoft : T.redSoft,
          color: daysLeft > 0 ? T.primary : T.red }}>
          {daysLeft > 0 ? `${daysLeft}d to harvest` : "Harvest due"}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, i, onToggle }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.floor((new Date(task.dueDate) - today) / 86400000);

  let dateLabel;
  if (task.done)    dateLabel = "Done";
  else if (diff < 0) dateLabel = `${Math.abs(diff)}d overdue`;
  else if (diff === 0) dateLabel = "Today";
  else if (diff === 1) dateLabel = "Tomorrow";
  else dateLabel = task.dueDate;

  const dateColor = task.done ? T.inkFaint
    : diff < 0 ? T.red
    : diff <= 1 ? T.orange
    : T.inkSoft;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px",
      borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
      <button onClick={onToggle} aria-label="Toggle done"
        style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer",
          display: "grid", placeItems: "center",
          border: `1.5px solid ${task.done ? T.primary : T.line}`,
          background: task.done ? T.primary : "transparent", transition: "all .15s" }}>
        {task.done && <Icon name="Check" size={13} color="#fff" strokeWidth={3} />}
      </button>

      <div style={{ width: 34, height: 34, borderRadius: 11, background: T.surface2,
        color: T.inkSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={task.type.icon} size={17} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600,
          color: task.done ? T.inkFaint : T.ink,
          textDecoration: task.done ? "line-through" : "none" }}>
          {task.type.label}
          {task.note && (
            <span style={{ fontWeight: 400, color: T.inkSoft }}> — {task.note}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.inkSoft }}>{task.cropName}</div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 600, color: dateColor, flexShrink: 0 }}>
        {dateLabel}
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value, bg, color }) {
  return (
    <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.line}`,
      borderRadius: T.rLg, padding: "13px 12px" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, color,
        display: "grid", placeItems: "center", marginBottom: 9 }}>
        <Icon name={icon} size={16} strokeWidth={2.4} />
      </div>
      <div style={{ fontSize: 11.5, color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700,
        color: T.ink, marginTop: 1 }}>{value}</div>
    </div>
  );
}
