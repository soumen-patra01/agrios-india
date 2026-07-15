import { Pill } from "../erp/RecordList.jsx";
import { accent } from "../primitives.jsx";

/* Wraps the ERP Pill with an accent token ("primary"|"blue"|... from the
   logistics status maps). */
export default function StatusPill({ status, map }) {
  const meta = map?.[status] || { label: status, a: "primary" };
  const c = accent(meta.a);
  return <Pill fg={c.fg} bg={c.bg}>{meta.label}</Pill>;
}
