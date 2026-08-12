import { useState } from 'react';
import { Check, MessageCircle, Download, Mail } from 'lucide-react';
import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import { t } from '../copy';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ActionModal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,16,.5)' }} />
      <div style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 40px 90px -20px rgba(0,0,0,.4)' }}>
        <h3 className="pt-h3" style={{ marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

const FieldInput = ({ label, ...props }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <span className="pt-caption" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'rgb(var(--ink-700))' }}>{label}</span>
    <input {...props} style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid rgb(var(--ink-200))', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
  </label>
);

const FieldTextarea = ({ label, ...props }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <span className="pt-caption" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'rgb(var(--ink-700))' }}>{label}</span>
    <textarea rows={4} {...props} style={{ width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid rgb(var(--ink-200))', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
  </label>
);

/**
 * "Ready to move forward?" — Accept / Request Changes / Contact / WhatsApp /
 * PDF. Renders a quiet success state instead of the form once the proposal
 * has already been responded to (either from a fresh submit in this session
 * or because `proposal.status` already reflects a prior response — e.g. the
 * client re-opens the same link).
 */
const ClientActionBar = ({ proposal, isRTL, lang, onAccept, onRequestChanges, onDownloadPdf }) => {
  const { ref, revealed } = useReveal();
  const [modal, setModal] = useState(null); // 'accept' | 'changes' | null
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // 'accepted' | 'changes' | null

  const respondedAs = done
    || (proposal.status === 'ACCEPTED' ? 'accepted' : proposal.status === 'CHANGE_REQUESTED' ? 'changes' : null);

  const branding = proposal.branding || {};
  const whatsappNumber = branding.contactPhone?.replace(/\D/g, '');

  const openModal = (type) => { setForm({ name: '', email: '', message: '' }); setError(''); setModal(type); };
  const closeModal = () => { if (!submitting) setModal(null); };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !EMAIL_RE.test(form.email.trim())) {
      setError(isRTL ? 'يرجى إدخال اسم وبريد إلكتروني صحيحين' : 'Please enter a valid name and email');
      return;
    }
    if (modal === 'changes' && !form.message.trim()) {
      setError(isRTL ? 'يرجى كتابة رسالتك' : 'Please write your message');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (modal === 'accept') await onAccept?.(form);
      else await onRequestChanges?.(form);
      setDone(modal === 'accept' ? 'accepted' : 'changes');
      setModal(null);
    } catch (err) {
      setError(err?.message || (isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  if (respondedAs) {
    return (
      <section className="pt-section" ref={ref}>
        <div className="pt-container" {...reveal(revealed, '', { maxWidth: 560, textAlign: 'center', margin: '0 auto' })}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgb(22 130 90 / .12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Check size={26} color="rgb(22,130,90)" aria-hidden="true" />
          </div>
          <h2 className="pt-h2">{respondedAs === 'accepted' ? t('acceptedTitle', lang) : t('changesTitle', lang)}</h2>
          <p className="pt-body" style={{ marginTop: 8 }}>{respondedAs === 'accepted' ? t('acceptedBody', lang) : t('changesBody', lang)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-section pt-tint pt-no-print" ref={ref} id="proposal-actions">
      <div className="pt-container" {...reveal(revealed, '', { textAlign: 'center' })}>
        <h2 className="pt-h1">{t('readyToMoveForward', lang)}</h2>
        <p className="pt-body-lg" style={{ marginTop: 10, maxWidth: 480, marginInline: 'auto' }}>{t('actionSubtext', lang)}</p>

        <div className="pt-action-bar" style={{ marginTop: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
          <button type="button" className="pt-btn pt-btn-dark" onClick={() => openModal('accept')}>
            {t('acceptProposal', lang)}
          </button>
          <button type="button" className="pt-btn pt-btn-outline" onClick={() => openModal('changes')}>
            {t('requestChanges', lang)}
          </button>
          {branding.contactEmail && (
            <a className="pt-btn pt-btn-outline" href={`mailto:${branding.contactEmail}`}>
              <Mail size={16} aria-hidden="true" /> {t('contactUs', lang)}
            </a>
          )}
          {whatsappNumber && (
            <a className="pt-btn pt-btn-outline" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> <span className="en">WhatsApp</span>
            </a>
          )}
          {onDownloadPdf && (
            <button type="button" className="pt-btn pt-btn-outline" onClick={onDownloadPdf}>
              <Download size={16} aria-hidden="true" /> {t('downloadPdf', lang)}
            </button>
          )}
        </div>
      </div>

      <ActionModal open={modal === 'accept'} onClose={closeModal} title={t('acceptProposal', lang)}>
        <FieldInput label={t('yourName', lang)} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <FieldInput label={t('yourEmail', lang)} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <FieldTextarea label={t('messageOptional', lang)} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
          <button type="button" className="pt-btn pt-btn-outline" onClick={closeModal} disabled={submitting}>{t('cancel', lang)}</button>
          <button type="button" className="pt-btn pt-btn-dark" onClick={submit} disabled={submitting}>{submitting ? t('submitting', lang) : t('submit', lang)}</button>
        </div>
      </ActionModal>

      <ActionModal open={modal === 'changes'} onClose={closeModal} title={t('requestChanges', lang)}>
        <FieldInput label={t('yourName', lang)} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <FieldInput label={t('yourEmail', lang)} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <FieldTextarea label={t('messageRequired', lang)} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
          <button type="button" className="pt-btn pt-btn-outline" onClick={closeModal} disabled={submitting}>{t('cancel', lang)}</button>
          <button type="button" className="pt-btn pt-btn-dark" onClick={submit} disabled={submitting}>{submitting ? t('submitting', lang) : t('submit', lang)}</button>
        </div>
      </ActionModal>
    </section>
  );
};

export default ClientActionBar;
