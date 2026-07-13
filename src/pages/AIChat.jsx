import { useEffect, useRef, useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import Markdown from "../components/markdown.jsx";
import { AppBar, IconTile, BottomSheet, Dialog, EmptyState, accent } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { useAI, conversationStore, voice, captureImageBlock, getAgent } from "../ai/index.js";
import { textOf } from "../ai/models/message.js";

export default function AIChat({ agentId = null, conversationId = null }) {
  const { t, lang, pop, toast } = useApp();
  const ai = useAI({ agentId, conversationId, lang });
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const endRef = useRef(null);
  const sttRef = useRef(null);

  const agent = ai.agent || (agentId ? getAgent(agentId) : null);
  const c = accent(agent?.accent || "primary");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ai.messages, ai.streamText, ai.busy]);
  useEffect(() => () => sttRef.current?.stop(), []);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q || ai.busy) return;
    const blocks = pendingImage ? [pendingImage.block] : [];
    setPendingImage(null); setInput("");
    ai.send(q, blocks);
  };

  const mic = () => {
    if (!voice.sttSupported) { toast(t("voiceUnsupported")); return; }
    if (listening) { sttRef.current?.stop(); return; }
    setListening(true);
    sttRef.current = voice.listen({
      lang,
      onResult: (text) => setInput(text),
      onEnd: () => setListening(false),
      onError: () => { setListening(false); toast(t("voiceUnsupported")); },
    });
  };

  const attach = async () => {
    try {
      const img = await captureImageBlock({});
      if (img) { setPendingImage(img); toast(t("imageAttached"), "success"); }
    } catch { toast(t("imageFailed"), "error"); }
  };

  const errorText = ai.error
    ? (ai.error.code === "rate-limit"
        ? `${t("aiRateLimited")} (${ai.error.retryInSec}s)`
        : `${t("aiError")}${ai.error.message ? ` — ${ai.error.message}` : ""}`)
    : null;

  return (
    <>
      <AppBar
        title={agent ? agent.name : t("aiTitle")}
        onBack={pop}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <HeaderBtn icon="RotateCcw" label={t("newChat")} onClick={ai.reset} />
            <HeaderBtn icon="Inbox" label={t("chatHistory")} onClick={() => setHistoryOpen(true)} />
          </div>
        }
      />

      <div style={{ padding: "4px 16px 150px", animation: "ag-fade .25s var(--ag-ease)" }}>
        {/* agent hero on empty chat */}
        {ai.messages.length === 0 && !ai.busy && (
          <div style={{ textAlign: "center", padding: "26px 12px 10px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: c.bg, color: c.fg, display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
              <Icon name={agent?.icon || "Sparkles"} size={30} />
            </div>
            <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700 }}>{agent ? agent.name : t("aiTitle")}</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>{agent?.tagline || t("advisorAuto")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
              {(agent?.suggested || [t("sampleGeneric1"), t("sampleGeneric2")]).map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  style={{ textAlign: "left", padding: "12px 15px", borderRadius: T.rLg, cursor: "pointer", fontFamily: T.body,
                    background: T.surface, border: `1px solid ${T.line}`, color: T.ink, fontSize: 13.5 }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* messages */}
        {ai.messages.map((m) => (
          <Bubble key={m.id} msg={m} onSpeak={(txt) => voice.speak(txt, lang)} />
        ))}

        {/* live stream */}
        {ai.busy && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 12 }}>
            <div style={bubbleCss(false)}>
              {ai.streamText
                ? <Markdown text={ai.streamText} />
                : <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.inkSoft, fontSize: 13 }}>
                    <Icon name="Sparkles" size={14} style={{ color: T.primary }} />
                    <span style={{ animation: "ag-blink 1.2s infinite" }}>{t("aiThinking")}</span>
                  </span>}
            </div>
          </div>
        )}

        {errorText && (
          <div style={{ marginTop: 12, padding: "11px 14px", borderRadius: T.rMd, background: T.redSoft, color: T.red, fontSize: 13 }}>
            {errorText}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: T.inkFaint, marginTop: 16, lineHeight: 1.5 }}>
          {t("chatDisclaimer")}
        </div>
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 25, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 460, background: T.bg, borderTop: `1px solid ${T.lineSoft}`, padding: "10px 12px calc(12px + env(safe-area-inset-bottom))" }}>
          {pendingImage && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "7px 10px", borderRadius: T.rMd, background: T.surface2, fontSize: 12.5, color: T.inkSoft }}>
              <Icon name="Camera" size={14} /> {pendingImage.meta.name}
              <button onClick={() => setPendingImage(null)} aria-label="Remove image" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.inkFaint, display: "flex" }}>
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <ComposerBtn icon="Camera" label={t("attachImage")} onClick={attach} />
            <ComposerBtn icon="Mic" label={t("voiceInput")} onClick={mic} active={listening} />
            <input
              value={listening ? input || t("listening") : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("chatPh")}
              disabled={ai.busy}
              style={{ flex: 1, minWidth: 0, padding: "13px 15px", borderRadius: T.pill, border: `1px solid ${T.line}`,
                background: T.surface, color: T.ink, fontFamily: T.body, fontSize: 14.5, outline: "none" }}
            />
            {ai.busy ? (
              <ComposerBtn icon="X" label={t("stop")} onClick={ai.stop} danger />
            ) : (
              <button onClick={() => send()} disabled={!input.trim()} aria-label={t("send")}
                style={{ width: 46, height: 46, borderRadius: "50%", border: "none", flexShrink: 0, display: "grid", placeItems: "center",
                  cursor: input.trim() ? "pointer" : "default", background: input.trim() ? T.primary : T.line, color: T.onPrimary, transition: "background .18s" }}>
                <Icon name="Send" size={19} strokeWidth={2.3} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* history sheet */}
      <BottomSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title={t("chatHistory")}>
        <HistoryList
          t={t}
          onOpen={(id) => { ai.load(id); setHistoryOpen(false); }}
          onDelete={(id) => setConfirmDelete(id)}
          onExport={(id) => {
            const text = conversationStore.exportText(id);
            const blob = new Blob([text], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "agrios-chat.txt";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        />
      </BottomSheet>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        title={t("deleteChat") + "?"} body={t("deleteChatBody")} icon="Trash2" danger
        confirmLabel={t("deleteChat")} cancelLabel={t("cancel")}
        onConfirm={() => {
          conversationStore.remove(confirmDelete);
          if (confirmDelete === ai.conversationId) ai.reset();
          setConfirmDelete(null);
        }} />
    </>
  );
}

/* ---------- pieces ---------- */

const bubbleCss = (isUser) => ({
  maxWidth: "88%", padding: "11px 14px", fontSize: 14, lineHeight: 1.55,
  background: isUser ? T.primary : T.surface,
  color: isUser ? T.onPrimary : T.ink,
  border: isUser ? "none" : `1px solid ${T.line}`,
  borderRadius: 18,
  borderBottomRightRadius: isUser ? 6 : 18,
  borderBottomLeftRadius: isUser ? 18 : 6,
});

function Bubble({ msg, onSpeak }) {
  const isUser = msg.role === "user";
  const text = textOf(msg);
  const hasImage = Array.isArray(msg.content) && msg.content.some((b) => b.type === "image");
  const agent = !isUser && msg.agentId ? getAgent(msg.agentId) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginTop: 12 }}>
      {agent && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: T.inkFaint, marginBottom: 4, paddingLeft: 4 }}>
          <Icon name={agent.icon} size={12} /> {agent.name}
        </div>
      )}
      <div style={{ ...bubbleCss(isUser), animation: "ag-rise .22s var(--ag-ease)" }}>
        {hasImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: .8, marginBottom: 6 }}>
            <Icon name="Camera" size={13} /> photo attached
          </div>
        )}
        {isUser ? text : <Markdown text={text} />}
      </div>
      {!isUser && text && (
        <button onClick={() => onSpeak(text)} aria-label="Read aloud"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 4px", fontFamily: T.body }}>
          <Icon name="Volume2" size={13} />
        </button>
      )}
    </div>
  );
}

function HistoryList({ t, onOpen, onDelete, onExport }) {
  const [items, setItems] = useState(() => conversationStore.list());
  if (!items.length) return <EmptyState icon="Inbox" title={t("noChats")} body={t("noChatsBody")} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((e) => {
        const agent = e.agentId ? getAgent(e.agentId) : null;
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: T.rLg, background: T.surface2 }}>
            <IconTile name={agent?.icon || "MessageCircle"} a={agent?.accent || "primary"} size={36} iconSize={17} />
            <button onClick={() => onOpen(e.id)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: T.body, padding: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.pinned ? "📌 " : ""}{e.title || t("newChat")}
              </div>
              <div style={{ fontSize: 11.5, color: T.inkFaint }}>{new Date(e.updatedAt).toLocaleDateString()}</div>
            </button>
            <RowBtn icon="Star" label={e.pinned ? t("unpin") : t("pin")}
              onClick={() => { conversationStore.setPinned(e.id, !e.pinned); setItems(conversationStore.list()); }} />
            <RowBtn icon="Download" label={t("exportChat")} onClick={() => onExport(e.id)} />
            <RowBtn icon="Trash2" label={t("deleteChat")} onClick={() => onDelete(e.id)} />
          </div>
        );
      })}
    </div>
  );
}

function HeaderBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex" }}>
      <Icon name={icon} size={18} />
    </button>
  );
}
function ComposerBtn({ icon, label, onClick, active, danger }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, cursor: "pointer", display: "grid", placeItems: "center",
        border: `1px solid ${active ? T.primary : T.line}`,
        background: active ? T.primarySoft : danger ? T.redSoft : T.surface,
        color: active ? T.primary : danger ? T.red : T.inkSoft,
        animation: active ? "ag-blink 1.4s infinite" : "none" }}>
      <Icon name={icon} size={19} />
    </button>
  );
}
function RowBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, display: "flex", padding: 5 }}>
      <Icon name={icon} size={16} />
    </button>
  );
}
