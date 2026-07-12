/**
 * AdminSupportAI — AI Center
 * Conversations · Leads · Requests · Tickets · Escalations · Analytics
 */
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useSelector } from 'react-redux';

const API = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

const ah = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const fmt = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// ── Color maps ────────────────────────────────────────────────────────────────
const P_CLR = {
  low:      { bg: 'rgba(100,200,100,.1)',  bd: 'rgba(100,200,100,.3)',  tx: '#64c864' },
  medium:   { bg: 'rgba(220,180,50,.1)',   bd: 'rgba(220,180,50,.3)',   tx: '#dcc832' },
  high:     { bg: 'rgba(235,125,105,.1)',  bd: 'rgba(235,125,105,.3)',  tx: '#eb7d69' },
  critical: { bg: 'rgba(220,38,38,.12)',   bd: 'rgba(220,38,38,.35)',   tx: '#ef4444' },
};
const STATUS_CLR = {
  new:           { bg: 'rgba(110,175,255,.1)',  tx: '#6eafff' },
  contacted:     { bg: 'rgba(160,145,235,.1)',  tx: '#a091eb' },
  proposal_sent: { bg: 'rgba(37,99,235,.1)',   tx: '#2563EB' },
  won:           { bg: 'rgba(34,197,94,.1)',    tx: '#22c55e' },
  lost:          { bg: 'rgba(239,68,68,.1)',    tx: '#ef4444' },
  open:          { bg: 'rgba(110,175,255,.1)',  tx: '#6eafff' },
  pending:       { bg: 'rgba(220,180,50,.1)',   tx: '#dcc832' },
  in_progress:   { bg: 'rgba(160,145,235,.1)',  tx: '#a091eb' },
  resolved:      { bg: 'rgba(70,200,150,.1)',   tx: '#46c896' },
  closed:        { bg: 'rgba(255,255,255,.05)', tx: 'rgba(255,255,255,.4)' },
};
const SENT_CLR = { positive: '#22c55e', neutral: 'rgba(255,255,255,.45)', frustrated: '#f59e0b', urgent: '#ef4444' };
const SENT_ICO = { positive: '😊', neutral: '😐', frustrated: '😤', urgent: '🚨' };
const INT_CLR  = { lead: '#22c55e', support: '#6eafff', inquiry: '#a091eb', complaint: '#ef4444', other: 'rgba(255,255,255,.3)' };

// ── Shared primitives ─────────────────────────────────────────────────────────
const Badge = ({ children, bg, tx, bd }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: bg || 'rgba(255,255,255,.06)', color: tx || 'rgba(255,255,255,.6)', border: `1px solid ${bd || 'rgba(255,255,255,.1)'}` }}>{children}</span>
);

const StatCard = ({ icon, label, value, sub, color = '#2563EB', alert, onClick }) => (
  <div onClick={onClick} style={{ background: alert ? 'rgba(220,38,38,.07)' : 'rgba(255,255,255,.03)', border: `1px solid ${alert ? 'rgba(220,38,38,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: 14, padding: '18px 20px', flex: '1 1 150px', minWidth: 140, cursor: onClick ? 'pointer' : 'default', transition: 'border-color .2s' }}>
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value ?? '—'}</div>
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 5 }}>{label}</div>
    {sub && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>{sub}</div>}
  </div>
);

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
    <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(37,99,235,.1)', borderTopColor: '#2563EB', animation: 'spin .7s linear infinite' }} />
  </div>
);

const Empty = ({ text = 'No data found.' }) => (
  <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,.25)', fontSize: 14 }}>{text}</div>
);

const Pager = ({ page, total, perPage, onChange }) => {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
      <PBtn disabled={page <= 1}     onClick={() => onChange(page - 1)} label="← Prev" />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', padding: '0 8px' }}>{page} / {pages} ({total})</span>
      <PBtn disabled={page >= pages} onClick={() => onChange(page + 1)} label="Next →" />
    </div>
  );
};
const PBtn = ({ disabled, onClick, label }) => (
  <button disabled={disabled} onClick={onClick} style={{ padding: '7px 14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: disabled ? 'rgba(255,255,255,.2)' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12 }}>{label}</button>
);

const ScoreBar = ({ score, size = 64 }) => {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#2563EB' : 'rgba(255,255,255,.3)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: size, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: 10, color, fontFamily: 'monospace', fontWeight: 700, minWidth: 22 }}>{score}</span>
    </div>
  );
};

const FieldGrid = ({ fields, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px 16px' }}>
    {fields.filter(([, v]) => v).map(([label, val]) => (
      <div key={label}>
        <p style={{ margin: 0, fontSize: 9.5, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,.85)', wordBreak: 'break-word' }}>{val}</p>
      </div>
    ))}
  </div>
);

// ── Inline select helpers ─────────────────────────────────────────────────────
const selSty = { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer' };
const inpSty = { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, color: '#fff', padding: '8px 12px', fontSize: 12.5, outline: 'none' };

// ── Conversation Transcript Panel ─────────────────────────────────────────────
const ConvPanel = memo(({ conv, token, onClose, onUpdate }) => {
  const [note,   setNote]   = useState(conv.adminNotes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!conv.isRead) {
      fetch(`${API()}/support/admin/conversation/${conv._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ isRead: true }) }).catch(() => {});
    }
  }, []); // eslint-disable-line

  const saveNote = async () => {
    setSaving(true);
    try {
      await fetch(`${API()}/support/admin/conversation/${conv._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ adminNotes: note, isRead: true }) });
      onUpdate({ ...conv, adminNotes: note, isRead: true });
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth={680}>
      <ModalHeader title={conv.lead?.name || 'Anonymous Visitor'} sub={fmt(conv.createdAt)} onClose={onClose}>
        <Badge bg={STATUS_CLR[conv.primaryIntent]?.bg} tx={INT_CLR[conv.primaryIntent]}>{conv.primaryIntent}</Badge>
        {conv.leadScore > 0 && <Badge bg="rgba(37,99,235,.1)" tx="#2563EB" bd="rgba(37,99,235,.2)">Score {conv.leadScore}</Badge>}
        {conv.userType === 'registered' && <Badge bg="rgba(160,145,235,.12)" tx="#a091eb">Registered</Badge>}
      </ModalHeader>

      {conv.lead?.detected && (
        <Section label="Lead Information">
          <div style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.12)', borderRadius: 10, padding: '12px 16px' }}>
            <FieldGrid fields={[
              ['Name',     conv.lead.name],
              ['Phone',    conv.lead.phone],
              ['Email',    conv.lead.email],
              ['Company',  conv.lead.business],
              ['Project',  conv.lead.projectType],
              ['Timeline', conv.lead.timeline],
              ['Features', Array.isArray(conv.lead.features) ? conv.lead.features.join(', ') : conv.lead.features],
            ]} />
          </div>
        </Section>
      )}

      {conv.conversationSummary && (
        <Section label="AI Summary">
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, background: 'rgba(255,255,255,.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.05)' }}>{conv.conversationSummary}</p>
        </Section>
      )}

      <Section label={`Full Conversation (${conv.messages?.length || 0} messages)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
          {(conv.messages || []).map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '82%', padding: '9px 12px', fontSize: 12.5, lineHeight: 1.6, borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: m.role === 'user' ? 'linear-gradient(135deg,rgba(37,99,235,.15),rgba(37,99,235,.08))' : 'rgba(255,255,255,.04)', border: m.role === 'user' ? '1px solid rgba(37,99,235,.2)' : '1px solid rgba(255,255,255,.05)', color: 'rgba(255,255,255,.85)' }}>
                <span style={{ fontSize: 9.5, color: m.role === 'user' ? 'rgba(37,99,235,.6)' : 'rgba(255,255,255,.3)', display: 'block', marginBottom: 3 }}>{m.role === 'user' ? 'Visitor' : 'YANSY AI'} · {m.timestamp ? fmt(m.timestamp) : ''}</span>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Admin Notes">
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add internal notes..." rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }} />
        <SaveBtn onClick={saveNote} saving={saving} />
      </Section>
    </Modal>
  );
});
ConvPanel.displayName = 'ConvPanel';

// ── Request Detail Panel ──────────────────────────────────────────────────────
const RequestPanel = memo(({ req, conv, token, onClose, onUpdate }) => {
  const [status,   setStatus]   = useState(req.status);
  const [priority, setPriority] = useState(req.priority);
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API()}/support/admin/request/${req._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ status, priority, note: note.trim() || undefined, isRead: true }) });
      const d = await r.json();
      if (d.request) { onUpdate(d.request); setNote(''); }
    } finally { setSaving(false); }
  };

  const pc = P_CLR[priority] || P_CLR.medium;
  const sc = STATUS_CLR[status] || STATUS_CLR.new;

  return (
    <Modal onClose={onClose} maxWidth={700}>
      <ModalHeader title={req.name} sub={`${req.requestCode} · ${fmtDate(req.createdAt)}`} onClose={onClose}>
        <Badge bg={sc.bg} tx={sc.tx}>{status?.replace('_', ' ').toUpperCase()}</Badge>
        <Badge bg={pc.bg} tx={pc.tx} bd={pc.bd}>{priority?.toUpperCase()}</Badge>
        {req.leadScore > 0 && <Badge bg="rgba(37,99,235,.1)" tx="#2563EB">Score {req.leadScore}</Badge>}
      </ModalHeader>

      {/* Contact + Project */}
      <Section label="Lead Information">
        <div style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.12)', borderRadius: 10, padding: '12px 16px' }}>
          <FieldGrid fields={[
            ['Name',         req.name],
            ['Phone',        req.phone],
            ['Email',        req.email],
            ['Company',      req.company],
            ['Project Type', req.projectType],
            ['Timeline',     req.timeline],
            ['Features',     req.features],
            ['Business',     req.business],
          ]} />
        </div>
      </Section>

      {req.requirementsSummary && (
        <Section label="Requirements Summary">
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, background: 'rgba(255,255,255,.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.05)' }}>{req.requirementsSummary}</p>
        </Section>
      )}

      {req.aiRecommendation && (
        <Section label="AI Recommendation">
          <div style={{ background: 'rgba(37,99,235,.05)', border: '1px solid rgba(37,99,235,.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>{req.aiRecommendation}</p>
          </div>
        </Section>
      )}

      {conv && (
        <Section label="Linked Conversation">
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '11px 15px' }}>
            {conv.conversationSummary && <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>{conv.conversationSummary}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {conv.leadScore > 0 && <span style={{ fontSize: 11, color: '#2563EB' }}>Lead Score: <strong>{conv.leadScore}/100</strong></span>}
              {conv.sentiment   && <span style={{ fontSize: 11, color: SENT_CLR[conv.sentiment] }}>{SENT_ICO[conv.sentiment]} {conv.sentiment}</span>}
            </div>
          </div>
        </Section>
      )}

      {/* Controls */}
      <Section label="Update Status">
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Status',   val: status,   set: setStatus,   opts: [['new','New'],['contacted','Contacted'],['proposal_sent','Proposal Sent'],['won','Won'],['lost','Lost']] },
            { label: 'Priority', val: priority, set: setPriority, opts: [['low','Low'],['medium','Medium'],['high','High'],['critical','Critical']] },
          ].map(({ label, val, set, opts }) => (
            <div key={label} style={{ flex: 1, minWidth: 120 }}>
              <label style={{ display: 'block', fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</label>
              <select value={val} onChange={e => set(e.target.value)} style={selSty}>
                {opts.map(([v, l]) => <option key={v} value={v} style={{ background: '#0a0a12' }}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Notes history */}
        {req.notes?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {req.notes.map((n, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                <p style={{ margin: '0 0 3px', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>{n.content}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{n.addedBy?.fullName || 'Admin'} · {fmtDate(n.addedAt)}</p>
              </div>
            ))}
          </div>
        )}

        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (e.g. Called customer, sent proposal)..." rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }} />
        <SaveBtn onClick={save} saving={saving} label="Save Changes" />
      </Section>
    </Modal>
  );
});
RequestPanel.displayName = 'RequestPanel';

// ── Ticket Panel ──────────────────────────────────────────────────────────────
const TicketPanel = memo(({ ticket, conv, token, onClose, onUpdate }) => {
  const [note,     setNote]     = useState('');
  const [status,   setStatus]   = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API()}/support/admin/ticket/${ticket._id}`, { method: 'PATCH', headers: ah(token), body: JSON.stringify({ status, priority, note: note.trim() || undefined }) });
      const d = await r.json();
      if (d.ticket) { onUpdate(d.ticket); setNote(''); }
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth={680}>
      <ModalHeader title={ticket.subject} sub={ticket.ticketId} onClose={onClose}>
        <Badge bg={STATUS_CLR[status]?.bg} tx={STATUS_CLR[status]?.tx}>{status?.replace('_',' ').toUpperCase()}</Badge>
        <Badge bg={P_CLR[priority]?.bg} tx={P_CLR[priority]?.tx} bd={P_CLR[priority]?.bd}>{priority?.toUpperCase()}</Badge>
      </ModalHeader>

      <Section label="Customer">
        <FieldGrid fields={[['Name', ticket.customer?.name], ['Email', ticket.customer?.email], ['Phone', ticket.customer?.phone]]} />
      </Section>

      {conv?.conversationSummary && (
        <Section label="AI Insights">
          <div style={{ background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.1)', borderRadius: 10, padding: '11px 15px' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>{conv.conversationSummary}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {conv.leadScore > 0 && <span style={{ fontSize: 11, color: '#2563EB' }}>Score: <strong>{conv.leadScore}</strong></span>}
              {conv.sentiment  && <span style={{ fontSize: 11, color: SENT_CLR[conv.sentiment] }}>{SENT_ICO[conv.sentiment]} {conv.sentiment}</span>}
            </div>
          </div>
        </Section>
      )}

      {ticket.conversationSnapshot?.length > 0 && (
        <Section label="Conversation Snapshot">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 240, overflowY: 'auto' }}>
            {ticket.conversationSnapshot.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '8px 12px', fontSize: 12, borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: m.role === 'user' ? 'rgba(37,99,235,.12)' : 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.8)' }}>{m.content}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Update">
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Status',   val: status,   set: setStatus,   opts: [['open','Open'],['pending','Pending'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed']] },
            { label: 'Priority', val: priority, set: setPriority, opts: [['low','Low'],['medium','Medium'],['high','High'],['critical','Critical']] },
          ].map(({ label, val, set, opts }) => (
            <div key={label} style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</label>
              <select value={val} onChange={e => set(e.target.value)} style={selSty}>
                {opts.map(([v, l]) => <option key={v} value={v} style={{ background: '#0a0a12' }}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        {ticket.notes?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {ticket.notes.map((n, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>{n.content}</p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{n.addedBy?.fullName || 'Admin'} · {fmtDate(n.addedAt)}</p>
              </div>
            ))}
          </div>
        )}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={3}
          style={{ ...inpSty, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }} />
        <SaveBtn onClick={save} saving={saving} />
      </Section>
    </Modal>
  );
});
TicketPanel.displayName = 'TicketPanel';

// ── Modal shell ───────────────────────────────────────────────────────────────
const Modal = ({ children, onClose, maxWidth = 640 }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.74)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
    <div style={{ background: '#06060b', border: '1px solid rgba(37,99,235,.12)', borderRadius: 18, width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, sub, onClose, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, gap: 12 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
        {children}
      </div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{title}</h3>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,.35)', fontFamily: 'monospace' }}>{sub}</p>}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
  </div>
);

const Section = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <p style={{ margin: '0 0 8px', fontSize: 10.5, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</p>
    {children}
  </div>
);

const SaveBtn = ({ onClick, saving, label = 'Save' }) => (
  <button onClick={onClick} disabled={saving} style={{ width: '100%', padding: '11px', background: saving ? 'rgba(37,99,235,.3)' : '#2563EB', border: 'none', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .2s' }}>
    {saving ? 'Saving...' : label}
  </button>
);

// ── Search / Filter bar ───────────────────────────────────────────────────────
const FilterBar = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
    {children}
  </div>
);

const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ ...inpSty, flex: '1 1 180px', minWidth: 140 }} />
);

const FilterSelect = ({ value, onChange, opts }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inpSty, cursor: 'pointer', minWidth: 110, paddingRight: 8 }}>
    {opts.map(([v, l]) => <option key={v} value={v} style={{ background: '#0a0a12' }}>{l}</option>)}
  </select>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminSupportAI = () => {
  const token = useSelector(s => s.auth?.token);

  const [tab,           setTab]           = useState('overview');
  const [analytics,     setAnalytics]     = useState(null);
  const [anaLoading,    setAnaLoading]    = useState(true);
  const [loading,       setLoading]       = useState(false);

  // Data
  const [conversations, setConversations] = useState([]);
  const [leads,         setLeads]         = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [tickets,       setTickets]       = useState([]);
  const [escalations,   setEscalations]   = useState([]);

  // Totals
  const [convTotal, setConvTotal]   = useState(0);
  const [leadTotal, setLeadTotal]   = useState(0);
  const [reqTotal,  setReqTotal]    = useState(0);
  const [tickTotal, setTickTotal]   = useState(0);
  const [escTotal,  setEscTotal]    = useState(0);

  // Pages
  const [convPage, setConvPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [reqPage,  setReqPage]  = useState(1);
  const [tickPage, setTickPage] = useState(1);
  const [escPage,  setEscPage]  = useState(1);

  // Filters
  const [convF, setConvF] = useState({ search: '', intent: '', sentiment: '', hasLead: '', userType: '' });
  const [leadF, setLeadF] = useState({ search: '', userType: '', minScore: '' });
  const [reqF,  setReqF]  = useState({ search: '', status: '', priority: '', userType: '' });
  const [tickF, setTickF] = useState({ search: '', status: '', priority: '', userType: '' });

  // Selected panels
  const [selConv,   setSelConv]   = useState(null);
  const [selReq,    setSelReq]    = useState(null);
  const [selReqConv,setSelReqConv]= useState(null);
  const [selTicket, setSelTicket] = useState(null);
  const [tickConv,  setTickConv]  = useState(null);

  const timer = useRef(null);
  const PER   = 15;

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnaLoading(true);
    try {
      const r = await fetch(`${API()}/support/admin/analytics`, { headers: ah(token) });
      setAnalytics(await r.json());
    } catch {} finally { setAnaLoading(false); }
  }, [token]);

  const mkFetch = (url, setData, setTotal) => async (page = 1, f = {}) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: PER, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) });
      const r = await fetch(`${API()}/support/${url}?${p}`, { headers: ah(token) });
      const d = await r.json();
      setData(d[Object.keys(d).find(k => Array.isArray(d[k]))] || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const fetchConversations = useCallback(mkFetch('admin/conversations', setConversations, setConvTotal), [token]); // eslint-disable-line
  const fetchLeads         = useCallback(mkFetch('admin/leads',         setLeads,         setLeadTotal), [token]); // eslint-disable-line
  const fetchRequests      = useCallback(mkFetch('admin/requests',      setRequests,      setReqTotal),  [token]); // eslint-disable-line
  const fetchTickets       = useCallback(mkFetch('admin/tickets',       setTickets,       setTickTotal), [token]); // eslint-disable-line
  const fetchEscalations   = useCallback(mkFetch('admin/escalations',   setEscalations,   setEscTotal),  [token]); // eslint-disable-line

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  useEffect(() => {
    if (tab === 'conversations') fetchConversations(convPage, convF);
    if (tab === 'leads')         fetchLeads(leadPage, leadF);
    if (tab === 'requests')      fetchRequests(reqPage, reqF);
    if (tab === 'tickets')       fetchTickets(tickPage, tickF);
    if (tab === 'escalations')   fetchEscalations(escPage);
  }, [tab]); // eslint-disable-line

  // ── Filter helpers ────────────────────────────────────────────────────────
  const mkFilter = (setF, setPage, fetcher) => (key, val) => {
    setF(prev => {
      const next = { ...prev, [key]: val };
      setPage(1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fetcher(1, next), 380);
      return next;
    });
  };

  const cf = mkFilter(setConvF, setConvPage, fetchConversations);
  const lf = mkFilter(setLeadF, setLeadPage, fetchLeads);
  const rf = mkFilter(setReqF,  setReqPage,  fetchRequests);
  const tf = mkFilter(setTickF, setTickPage, fetchTickets);

  // ── Open detail panels ────────────────────────────────────────────────────
  const openConv = async (c) => {
    try {
      const r = await fetch(`${API()}/support/admin/conversation/${c._id}`, { headers: ah(token) });
      const d = await r.json();
      setSelConv(d.conversation || c);
    } catch { setSelConv(c); }
  };

  const openReq = async (r) => {
    setSelReq(r);
    try {
      const res = await fetch(`${API()}/support/admin/request/${r._id}`, { headers: ah(token) });
      const d   = await res.json();
      setSelReq(d.request || r);
      setSelReqConv(d.conversation || null);
    } catch { setSelReqConv(null); }
  };

  const openTicket = async (t) => {
    setSelTicket(t);
    try {
      const r = await fetch(`${API()}/support/admin/ticket/${t._id}`, { headers: ah(token) });
      const d = await r.json();
      setTickConv(d.conversation || null);
      if (d.ticket) setSelTicket(d.ticket);
    } catch { setTickConv(null); }
  };

  // ── Tab config ────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'overview',       label: '📊 Overview' },
    { key: 'conversations',  label: `💬 Chats${analytics?.unreadCount > 0 ? ` (${analytics.unreadCount})` : ''}` },
    { key: 'leads',          label: `🎯 Leads${analytics?.leadsTotal > 0 ? ` (${analytics.leadsTotal})` : ''}` },
    { key: 'requests',       label: `⚡ Requests${reqTotal > 0 || analytics?.requestsTotal > 0 ? ` (${reqTotal || analytics?.requestsTotal || 0})` : ''}` },
    { key: 'tickets',        label: `🎫 Tickets${analytics?.ticketsOpen > 0 ? ` (${analytics.ticketsOpen})` : ''}` },
    { key: 'escalations',    label: `🚨 Escalations${analytics?.escalationsTotal > 0 ? ` (${analytics.escalationsTotal})` : ''}` },
    { key: 'analytics',      label: '📈 Analytics' },
  ];

  const tabSty = (a) => ({
    padding: '8px 16px', fontSize: 12.5, fontWeight: a ? 600 : 400,
    background: a ? 'rgba(37,99,235,.1)' : 'transparent',
    border: a ? '1px solid rgba(37,99,235,.22)' : '1px solid transparent',
    borderRadius: 9, color: a ? '#2563EB' : 'rgba(255,255,255,.5)',
    cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
  });

  // ── Row components ─────────────────────────────────────────────────────────
  const ConvRow = ({ c }) => (
    <div onClick={() => openConv(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,.02)', border: `1px solid ${c.isRead ? 'rgba(255,255,255,.05)' : 'rgba(37,99,235,.15)'}`, borderRadius: 10, cursor: 'pointer', transition: 'background .15s', marginBottom: 7 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.isRead ? 'transparent' : '#2563EB', flexShrink: 0, border: c.isRead ? '1px solid rgba(255,255,255,.1)' : 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lead?.name || 'Anonymous Visitor'}</span>
          {c.userType === 'registered' && <Badge bg="rgba(160,145,235,.12)" tx="#a091eb">VIP</Badge>}
          <Badge bg={(INT_CLR[c.primaryIntent] || 'rgba(255,255,255,.2)') + '18'} tx={INT_CLR[c.primaryIntent] || 'rgba(255,255,255,.5)'}>{c.primaryIntent}</Badge>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.messages?.[c.messages.length - 1]?.content?.slice(0, 80) || 'No messages'}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {c.leadScore > 0 && <ScoreBar score={c.leadScore} />}
        <p style={{ margin: '4px 0 0', fontSize: 10.5, color: 'rgba(255,255,255,.3)' }}>{fmt(c.updatedAt || c.createdAt)}</p>
      </div>
    </div>
  );

  const LeadRow = ({ l }) => (
    <div onClick={() => openConv(l)} style={{ padding: '13px 14px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(34,197,94,.1)', borderRadius: 10, cursor: 'pointer', transition: 'background .15s', marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{l.lead?.name || 'Unknown'}</span>
            {l.userType === 'registered' && <Badge bg="rgba(160,145,235,.12)" tx="#a091eb">Registered</Badge>}
            {l.requestId && <Badge bg="rgba(37,99,235,.08)" tx="rgba(37,99,235,.7)">Request</Badge>}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{l.lead?.phone || l.lead?.email || 'No contact info'}</p>
        </div>
        <ScoreBar score={l.leadScore || 0} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {l.lead?.projectType && <Badge bg="rgba(37,99,235,.07)" tx="rgba(37,99,235,.8)">{l.lead.projectType}</Badge>}
        {l.lead?.timeline    && <Badge bg="rgba(255,255,255,.04)" tx="rgba(255,255,255,.5)">⏱ {l.lead.timeline}</Badge>}
        {l.sentiment         && <span style={{ fontSize: 11, color: SENT_CLR[l.sentiment] }}>{SENT_ICO[l.sentiment]} {l.sentiment}</span>}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{fmtDate(l.createdAt)}</span>
      </div>
      {l.lead?.requirementsSummary && (
        <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lead.requirementsSummary}</p>
      )}
    </div>
  );

  const ReqRow = ({ r }) => {
    const sc = STATUS_CLR[r.status] || STATUS_CLR.new;
    const pc = P_CLR[r.priority]    || P_CLR.medium;
    return (
      <div onClick={() => openReq(r)} style={{ padding: '13px 14px', background: 'rgba(255,255,255,.02)', border: `1px solid ${r.isRead ? 'rgba(255,255,255,.06)' : 'rgba(37,99,235,.18)'}`, borderRadius: 10, cursor: 'pointer', transition: 'background .15s', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{r.requestCode}</span>
              <Badge bg={sc.bg} tx={sc.tx}>{r.status?.replace('_',' ').toUpperCase()}</Badge>
              <Badge bg={pc.bg} tx={pc.tx} bd={pc.bd}>{r.priority?.toUpperCase()}</Badge>
              {!r.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.name}</span>
          </div>
          <ScoreBar score={r.leadScore || 0} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          {r.phone && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>📞 {r.phone}</span>}
          {r.email && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>✉ {r.email}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {r.projectType && <Badge bg="rgba(37,99,235,.07)" tx="rgba(37,99,235,.8)">{r.projectType}</Badge>}
          {r.timeline    && <Badge bg="rgba(255,255,255,.04)" tx="rgba(255,255,255,.5)">⏱ {r.timeline}</Badge>}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginLeft: 'auto' }}>{fmtDate(r.createdAt)}</span>
        </div>
        {r.aiRecommendation && (
          <p style={{ margin: '7px 0 0', fontSize: 11, color: 'rgba(37,99,235,.6)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🤖 {r.aiRecommendation}</p>
        )}
      </div>
    );
  };

  const TickRow = ({ t }) => {
    const sc = STATUS_CLR[t.status] || STATUS_CLR.open;
    const pc = P_CLR[t.priority]    || P_CLR.medium;
    return (
      <div onClick={() => openTicket(t)} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, cursor: 'pointer', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#6eafff', fontWeight: 600 }}>{t.ticketId}</span>
          <Badge bg={sc.bg} tx={sc.tx}>{t.status?.replace('_',' ').toUpperCase()}</Badge>
          <Badge bg={pc.bg} tx={pc.tx} bd={pc.bd}>{t.priority?.toUpperCase()}</Badge>
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{t.subject}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{t.customer?.name || 'Anonymous'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginLeft: 'auto' }}>{fmtDate(t.createdAt)}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1280, margin: '0 auto', color: '#fff', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        select option { background:#0a0a12; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(37,99,235,.2); border-radius:2px; }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✦</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>AI Center</h1>
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,.4)' }}>Conversations · Leads · Requests · Tickets · Analytics</p>
          </div>
        </div>
        <button onClick={fetchAnalytics} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
      </div>

      {/* Stats grid */}
      {!anaLoading && analytics && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard icon="💬" label="Total Chats"      value={analytics.totalConversations} sub={`${analytics.convToday ?? 0} today · ${analytics.convWeek ?? 0} this week`} />
          <StatCard icon="🎯" label="Leads Captured"   value={analytics.leadsTotal}         sub={`${analytics.leadsWeek ?? 0} this week · avg score ${analytics.avgLeadScore ?? 0}`} color="#22c55e"  onClick={() => setTab('leads')} />
          <StatCard icon="⚡" label="AI Requests"      value={reqTotal || '0'}              sub="auto-qualified"                  color="#2563EB"   onClick={() => setTab('requests')} />
          <StatCard icon="🎫" label="Open Tickets"     value={analytics.ticketsOpen}        sub={`${analytics.ticketsTotal} total`} color="#6eafff" onClick={() => setTab('tickets')} />
          <StatCard icon="📈" label="Conversion Rate"  value={`${analytics.conversionRate ?? 0}%`} sub="visitors → leads" color="#a091eb" />
          {analytics.escalationsTotal > 0 && <StatCard icon="🚨" label="Escalations"  value={analytics.escalationsTotal} sub="needs attention" color="#ef4444" alert onClick={() => setTab('escalations')} />}
          {analytics.unreadCount > 0      && <StatCard icon="📬" label="Unread"        value={analytics.unreadCount}       sub="conversations"  color="#2563EB" onClick={() => setTab('conversations')} />}
        </div>
      )}

      {/* Registered / Guest split */}
      {analytics && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, background: 'rgba(160,145,235,.05)', border: '1px solid rgba(160,145,235,.13)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>👤</span>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#a091eb' }}>{analytics.registeredConvs ?? 0}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Registered</p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>👻</span>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,.65)' }}>{analytics.guestConvs ?? 0}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Guests</p>
            </div>
          </div>
          {analytics.sentiment && (
            <div style={{ flex: 3, minWidth: 220, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '13px 18px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Sentiment Breakdown</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {Object.entries(analytics.sentiment).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13 }}>{SENT_ICO[k]}</span>
                    <span style={{ fontSize: 12.5, color: SENT_CLR[k] || '#fff', fontWeight: 600 }}>{v}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{k}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,.06)', paddingBottom: 14 }}>
        {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={tabSty(tab === t.key)}>{t.label}</button>)}
      </div>

      {/* ══════ OVERVIEW ══════ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Intent breakdown */}
          {analytics?.intent && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Intent Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(analytics.intent).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: INT_CLR[k] || '#fff', minWidth: 60 }}>{k}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3 }}>
                      <div style={{ width: `${(v / analytics.totalConversations) * 100}%`, height: '100%', background: INT_CLR[k] || '#fff', borderRadius: 3, transition: 'width .6s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', minWidth: 22, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Quick Navigation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '💬 View All Conversations', tab: 'conversations' },
                { label: '🎯 Qualified Leads',         tab: 'leads' },
                { label: '⚡ AI Requests',             tab: 'requests' },
                { label: '🎫 Support Tickets',         tab: 'tickets' },
                { label: '🚨 Escalations',             tab: 'escalations' },
                { label: '📈 Analytics',               tab: 'analytics' },
              ].map(({ label, tab: t }) => (
                <button key={t} onClick={() => setTab(t)} style={{ textAlign: 'left', padding: '9px 13px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 9, color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 12.5, transition: 'background .15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent requests preview */}
          <div style={{ background: 'rgba(37,99,235,.03)', border: '1px solid rgba(37,99,235,.1)', borderRadius: 14, padding: '18px 20px', gridColumn: 'span 1' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>AI Request Pipeline</p>
            {analytics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['new','New'],['contacted','Contacted'],['proposal_sent','Proposal Sent'],['won','Won ✓'],['lost','Lost']].map(([s, l]) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: STATUS_CLR[s]?.tx || 'rgba(255,255,255,.5)' }}>{l}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>—</span>
                  </div>
                ))}
                <button onClick={() => { setTab('requests'); fetchRequests(1, {}); }} style={{ marginTop: 6, padding: '8px 13px', background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.18)', borderRadius: 8, color: '#2563EB', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  View All Requests →
                </button>
              </div>
            ) : <Spinner />}
          </div>
        </div>
      )}

      {/* ══════ CONVERSATIONS ══════ */}
      {tab === 'conversations' && (
        <div>
          <FilterBar>
            <SearchInput value={convF.search}    onChange={v => cf('search', v)}    placeholder="Search name, email, phone..." />
            <FilterSelect value={convF.intent}   onChange={v => cf('intent', v)}    opts={[['','All Intents'],['lead','Lead'],['support','Support'],['inquiry','Inquiry'],['complaint','Complaint']]} />
            <FilterSelect value={convF.sentiment} onChange={v => cf('sentiment', v)} opts={[['','All Sentiments'],['positive','Positive'],['neutral','Neutral'],['frustrated','Frustrated'],['urgent','Urgent']]} />
            <FilterSelect value={convF.hasLead}  onChange={v => cf('hasLead', v)}   opts={[['','All'],['true','Has Lead']]} />
            <FilterSelect value={convF.userType} onChange={v => cf('userType', v)}  opts={[['','All Users'],['registered','Registered'],['guest','Guest']]} />
          </FilterBar>
          {loading ? <Spinner /> : conversations.length ? conversations.map(c => <ConvRow key={c._id} c={c} />) : <Empty />}
          <Pager page={convPage} total={convTotal} perPage={PER} onChange={p => { setConvPage(p); fetchConversations(p, convF); }} />
        </div>
      )}

      {/* ══════ LEADS ══════ */}
      {tab === 'leads' && (
        <div>
          <FilterBar>
            <SearchInput value={leadF.search}   onChange={v => lf('search', v)}   placeholder="Search name, phone, email..." />
            <FilterSelect value={leadF.userType} onChange={v => lf('userType', v)} opts={[['','All Users'],['registered','Registered'],['guest','Guest']]} />
            <FilterSelect value={leadF.minScore} onChange={v => lf('minScore', v)} opts={[['','Any Score'],['80','Score 80+'],['60','Score 60+'],['40','Score 40+']]} />
          </FilterBar>
          {loading ? <Spinner /> : leads.length ? leads.map(l => <LeadRow key={l._id} l={l} />) : <Empty text="No qualified leads yet. Leads are created when a visitor completes the AI qualification." />}
          <Pager page={leadPage} total={leadTotal} perPage={PER} onChange={p => { setLeadPage(p); fetchLeads(p, leadF); }} />
        </div>
      )}

      {/* ══════ REQUESTS ══════ */}
      {tab === 'requests' && (
        <div>
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.1)', borderRadius: 10, fontSize: 12, color: 'rgba(37,99,235,.8)' }}>
            ⚡ AI Requests are automatically created when the AI qualifies a lead (name + contact + project type collected). Click any request to manage it.
          </div>
          <FilterBar>
            <SearchInput value={reqF.search}    onChange={v => rf('search', v)}    placeholder="Search name, email, code..." />
            <FilterSelect value={reqF.status}   onChange={v => rf('status', v)}    opts={[['','All Status'],['new','New'],['contacted','Contacted'],['proposal_sent','Proposal Sent'],['won','Won'],['lost','Lost']]} />
            <FilterSelect value={reqF.priority} onChange={v => rf('priority', v)}  opts={[['','All Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']]} />
            <FilterSelect value={reqF.userType} onChange={v => rf('userType', v)}  opts={[['','All Users'],['registered','Registered'],['guest','Guest']]} />
          </FilterBar>
          {loading ? <Spinner /> : requests.length ? requests.map(r => <ReqRow key={r._id} r={r} />) : <Empty text="No AI requests yet. Requests are auto-created when a visitor completes qualification. Make sure AI has collected: name + (phone or email) + project type." />}
          <Pager page={reqPage} total={reqTotal} perPage={PER} onChange={p => { setReqPage(p); fetchRequests(p, reqF); }} />
        </div>
      )}

      {/* ══════ TICKETS ══════ */}
      {tab === 'tickets' && (
        <div>
          <FilterBar>
            <SearchInput value={tickF.search}    onChange={v => tf('search', v)}    placeholder="Search ticket, subject, name..." />
            <FilterSelect value={tickF.status}   onChange={v => tf('status', v)}    opts={[['','All Status'],['open','Open'],['pending','Pending'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed']]} />
            <FilterSelect value={tickF.priority} onChange={v => tf('priority', v)}  opts={[['','All Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']]} />
            <FilterSelect value={tickF.userType} onChange={v => tf('userType', v)}  opts={[['','All Users'],['registered','Registered'],['guest','Guest']]} />
          </FilterBar>
          {loading ? <Spinner /> : tickets.length ? tickets.map(t => <TickRow key={t._id} t={t} />) : <Empty />}
          <Pager page={tickPage} total={tickTotal} perPage={PER} onChange={p => { setTickPage(p); fetchTickets(p, tickF); }} />
        </div>
      )}

      {/* ══════ ESCALATIONS ══════ */}
      {tab === 'escalations' && (
        <div>
          {loading ? <Spinner /> : escalations.length ? escalations.map(e => (
            <div key={e._id} onClick={() => openConv(e)} style={{ padding: '14px 16px', background: 'rgba(220,38,38,.05)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>🚨</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{e.lead?.name || 'Anonymous Visitor'}</span>
                <Badge bg="rgba(220,38,38,.12)" tx="#ef4444" bd="rgba(220,38,38,.3)">{e.escalation?.priority?.toUpperCase() || 'HIGH'}</Badge>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 12.5, color: '#ef4444' }}>{e.escalation?.reason || 'Escalated conversation'}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Flagged: {e.escalation?.flaggedAt ? fmt(e.escalation.flaggedAt) : 'Unknown'}</p>
            </div>
          )) : <Empty text="No escalations." />}
          <Pager page={escPage} total={escTotal} perPage={PER} onChange={p => { setEscPage(p); fetchEscalations(p); }} />
        </div>
      )}

      {/* ══════ ANALYTICS ══════ */}
      {tab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { label: 'Total Conversations',   value: analytics?.totalConversations ?? 0,  icon: '💬', color: '#fff' },
            { label: 'Conversations Today',   value: analytics?.convToday         ?? 0,  icon: '📅', color: '#a091eb' },
            { label: 'This Week',             value: analytics?.convWeek          ?? 0,  icon: '📆', color: '#6eafff' },
            { label: 'Total Leads',           value: analytics?.leadsTotal        ?? 0,  icon: '🎯', color: '#22c55e' },
            { label: 'Leads This Month',      value: analytics?.leadsMonth        ?? 0,  icon: '📊', color: '#22c55e' },
            { label: 'Leads This Week',       value: analytics?.leadsWeek         ?? 0,  icon: '📈', color: '#22c55e' },
            { label: 'Avg Lead Score',        value: analytics?.avgLeadScore      ?? 0,  icon: '⭐', color: '#2563EB' },
            { label: 'Conversion Rate',       value: `${analytics?.conversionRate ?? 0}%`, icon: '📉', color: '#2563EB' },
            { label: 'Open Tickets',          value: analytics?.ticketsOpen       ?? 0,  icon: '🎫', color: '#6eafff' },
            { label: 'Total Tickets',         value: analytics?.ticketsTotal      ?? 0,  icon: '🎫', color: '#6eafff' },
            { label: 'Escalations',           value: analytics?.escalationsTotal  ?? 0,  icon: '🚨', color: '#ef4444' },
            { label: 'Unread',                value: analytics?.unreadCount       ?? 0,  icon: '📬', color: '#2563EB' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)', marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ══════ PANELS ══════ */}
      {selConv   && <ConvPanel    conv={selConv}   token={token} onClose={() => setSelConv(null)}   onUpdate={updated => setConversations(p => p.map(c => c._id === updated._id ? updated : c))} />}
      {selReq    && <RequestPanel req={selReq}     conv={selReqConv} token={token} onClose={() => { setSelReq(null); setSelReqConv(null); }} onUpdate={updated => setRequests(p => p.map(r => r._id === updated._id ? updated : r))} />}
      {selTicket && <TicketPanel  ticket={selTicket} conv={tickConv} token={token} onClose={() => { setSelTicket(null); setTickConv(null); }} onUpdate={updated => setTickets(p => p.map(t => t._id === updated._id ? updated : t))} />}
    </div>
  );
};

export default AdminSupportAI;
