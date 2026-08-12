import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Monitor, Tablet, Smartphone, History, RefreshCw, Copy, ExternalLink,
  Send, AlertTriangle,
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, FONT, PageSpinner, Button, IconButton, Badge, Drawer, Modal, TextInput, TextArea } from '../admin-ui';
import ImportedHTMLViewer from '../components/imported-html/ImportedHTMLViewer';
import StepClient from '../components/proposal-editor/StepClient';
import FormField from '../components/proposal-editor/FormField';

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' };

/**
 * Manage an existing IMPORTED_HTML proposal: preview (same sandboxed
 * viewer the public page uses), edit metadata, Replace HTML (versioned,
 * with an explicit confirm step), version history + restore.
 */
const AdminProposalImportEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef(null);

  const T = {
    back: isRTL ? 'العودة' : 'Back',
    versions: isRTL ? 'النسخ' : 'Versions',
    save: isRTL ? 'حفظ' : 'Save',
    publish: isRTL ? 'نشر' : 'Publish',
    saved: isRTL ? 'تم الحفظ ✓' : 'Saved ✓',
    published: isRTL ? 'تم النشر ✓' : 'Published ✓',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    loadFailed: isRTL ? 'فشل تحميل العرض' : 'Failed to load proposal',
    metadata: isRTL ? 'بيانات العميل والمشروع' : 'Client & Project Details',
    projectTitle: isRTL ? 'عنوان العرض' : 'Proposal Title',
    projectTitleAr: isRTL ? 'عنوان العرض (عربي)' : 'Proposal Title (Arabic)',
    validityDate: isRTL ? 'تاريخ انتهاء الصلاحية' : 'Validity Date',
    notes: isRTL ? 'ملاحظات' : 'Notes',
    replaceHtml: isRTL ? 'استبدال ملف HTML' : 'Replace HTML',
    replaceTitle: isRTL ? 'تأكيد استبدال الملف' : 'Confirm HTML Replacement',
    currentVersion: isRTL ? 'النسخة الحالية' : 'Current Version',
    newVersion: isRTL ? 'النسخة الجديدة' : 'New Version',
    replaceWarning: isRTL ? 'سيتم الاحتفاظ بالنسخة القديمة في سجل النسخ ويمكن استعادتها لاحقًا.' : 'The old version is kept in version history and can be restored later.',
    confirmReplace: isRTL ? 'تأكيد الاستبدال' : 'Confirm Replace',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    replaced: isRTL ? 'تم استبدال الملف ✓' : 'HTML replaced ✓',
    noVersions: isRTL ? 'لا توجد نسخ محفوظة بعد' : 'No saved versions yet',
    restore: isRTL ? 'استعادة هذه النسخة' : 'Restore this version',
    view: isRTL ? 'عرض' : 'View',
    restored: isRTL ? 'تمت الاستعادة ✓' : 'Restored ✓',
    restoreFailed: isRTL ? 'فشل الاستعادة' : 'Restore failed',
    versionsLoadFailed: isRTL ? 'فشل تحميل النسخ' : 'Failed to load versions',
    by: isRTL ? 'بواسطة' : 'by',
    copyLink: isRTL ? 'نسخ الرابط' : 'Copy Link',
    openProposal: isRTL ? 'فتح العرض' : 'Open Proposal',
    linkCopied: isRTL ? 'تم نسخ الرابط ✓' : 'Link copied ✓',
    invalidType: isRTL ? 'يُسمح فقط بملفات .html أو .htm' : 'Only .html or .htm files are accepted',
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/proposals/${id}`)
      .then(({ data }) => setProposal(data.item))
      .catch(() => toast.error(T.loadFailed))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = (fields) => setProposal((p) => ({ ...p, ...fields }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/proposals/${id}`, {
        client: proposal.client?._id || proposal.client,
        project: proposal.project,
        validityDate: proposal.validityDate,
        notes: proposal.notes,
      });
      setProposal(data.item);
      toast.success(T.saved);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      await save();
      const { data } = await api.post(`/proposals/${id}/publish`);
      setProposal(data.item);
      toast.success(T.published);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setPublishing(false);
    }
  };

  const onPickReplaceFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same filename again later
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['html', 'htm'].includes(ext)) { toast.error(T.invalidType); return; }
    setPendingFile(file);
  };

  const confirmReplace = async () => {
    setReplacing(true);
    try {
      const formData = new FormData();
      formData.append('html', pendingFile);
      const { data } = await api.post(`/proposals/${id}/html`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProposal(data.item);
      toast.success(T.replaced);
      setPendingFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setReplacing(false);
    }
  };

  const openVersions = async () => {
    setVersionsOpen(true);
    try {
      const { data } = await api.get(`/proposals/${id}/versions`);
      setVersions(data.items || []);
    } catch {
      toast.error(T.versionsLoadFailed);
    }
  };

  const restoreVersion = async (versionId) => {
    try {
      const { data } = await api.post(`/proposals/${id}/restore/${versionId}`);
      setProposal(data.item);
      toast.success(T.restored);
      setVersionsOpen(false);
    } catch {
      toast.error(T.restoreFailed);
    }
  };

  const viewVersionHtml = (version) => {
    const fileId = version.snapshot?.htmlAsset?.fileId;
    if (!fileId) return;
    window.open(`${(api.defaults.baseURL || '').replace(/\/api\/?$/, '')}/api/media/${fileId}`, '_blank', 'noopener,noreferrer');
  };

  const copyLink = () => {
    const url = `${window.location.origin}/p/${proposal.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success(T.linkCopied)).catch(() => {});
  };

  if (loading || !proposal) return <PageSpinner />;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, fontFamily: font }}>
      <style>{`
        .ihe-grid { display: grid; grid-template-columns: minmax(360px, 440px) 1fr; min-height: calc(100vh - 96px); }
        @media (max-width: 960px) { .ihe-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: TK.surface, borderBottom: `1px solid ${TK.border}`, padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{isRTL ? (proposal.project?.titleAr || proposal.project?.title) : proposal.project?.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: TK.textMuted, fontFamily: 'monospace' }}>{proposal.proposalNumber}</span>
              <Badge tone="purple">{isRTL ? 'HTML مستورد' : 'Imported HTML'}</Badge>
              <Badge tone="info">{proposal.status}</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton icon={History} onClick={openVersions} title={T.versions} />
            <Button variant="secondary" size="sm" onClick={save} loading={saving}>{T.save}</Button>
            <Button variant="primary" size="sm" icon={Send} onClick={publish} loading={publishing}>{T.publish}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/admin/proposals')}>{T.back}</Button>
          </div>
        </div>
      </div>

      <div className="ihe-grid">
        <div style={{ padding: 24, borderInlineEnd: `1px solid ${TK.border}`, overflowY: 'auto', maxHeight: 'calc(100vh - 96px)' }}>
          {proposal.status !== 'DRAFT' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button variant="secondary" size="sm" icon={Copy} onClick={copyLink}>{T.copyLink}</Button>
              <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => window.open(`/p/${proposal.slug}`, '_blank', 'noopener,noreferrer')}>{T.openProposal}</Button>
            </div>
          )}

          <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>{T.metadata}</p>
          <StepClient value={proposal.client} onChange={(v) => patch({ client: v })} isRTL={isRTL} />
          <FormField label={T.projectTitle} required>
            <TextInput value={proposal.project?.title || ''} onChange={(e) => patch({ project: { ...proposal.project, title: e.target.value } })} />
          </FormField>
          <FormField label={T.projectTitleAr}>
            <TextInput dir="rtl" value={proposal.project?.titleAr || ''} onChange={(e) => patch({ project: { ...proposal.project, titleAr: e.target.value } })} />
          </FormField>
          <FormField label={T.validityDate}>
            <TextInput type="date" value={proposal.validityDate ? String(proposal.validityDate).slice(0, 10) : ''} onChange={(e) => patch({ validityDate: e.target.value })} />
          </FormField>
          <FormField label={T.notes}>
            <TextArea rows={3} value={proposal.notes || ''} onChange={(e) => patch({ notes: e.target.value })} />
          </FormField>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${TK.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              {isRTL ? 'مستند العرض' : 'Proposal Document'}
            </p>
            <p style={{ fontSize: 12, color: TK.textLight, marginBottom: 10 }}>
              {isRTL ? `النسخة الحالية: v${proposal.currentVersion}` : `Current version: v${proposal.currentVersion}`}
            </p>
            <input ref={replaceInputRef} type="file" accept=".html,.htm,text/html" hidden onChange={onPickReplaceFile} />
            <Button variant="secondary" icon={RefreshCw} style={{ width: '100%' }} onClick={() => replaceInputRef.current?.click()}>
              {T.replaceHtml}
            </Button>
          </div>
        </div>

        <div style={{ background: TK.bgSubtle, padding: 24, overflowY: 'auto', maxHeight: 'calc(100vh - 96px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            <IconButton icon={Monitor} variant={device === 'desktop' ? 'filled' : 'outline'} onClick={() => setDevice('desktop')} title="Desktop" />
            <IconButton icon={Tablet} variant={device === 'tablet' ? 'filled' : 'outline'} onClick={() => setDevice('tablet')} title="Tablet" />
            <IconButton icon={Smartphone} variant={device === 'mobile' ? 'filled' : 'outline'} onClick={() => setDevice('mobile')} title="Mobile" />
          </div>
          <div style={{
            maxWidth: DEVICE_WIDTHS[device], margin: '0 auto', background: '#fff', border: `1px solid ${TK.border}`,
            borderRadius: device === 'desktop' ? 12 : 20, overflow: 'hidden', boxShadow: '0 8px 30px rgba(16,24,40,.08)',
            transition: 'max-width .25s ease',
          }}>
            {proposal.htmlAssetUrl
              ? <ImportedHTMLViewer htmlAssetUrl={proposal.htmlAssetUrl} height="80vh" title={proposal.project?.title} />
              : <p style={{ padding: 24, fontSize: 13, color: TK.textMuted, textAlign: 'center' }}>{isRTL ? 'لا يوجد ملف HTML بعد' : 'No HTML file uploaded yet'}</p>}
          </div>
        </div>
      </div>

      <Modal
        open={!!pendingFile}
        onClose={() => !replacing && setPendingFile(null)}
        title={T.replaceTitle}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setPendingFile(null)} disabled={replacing}>{T.cancel}</Button>
            <Button variant="primary" onClick={confirmReplace} loading={replacing}>{T.confirmReplace}</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{T.currentVersion}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: TK.textMuted, margin: '4px 0 0' }}>v{proposal.currentVersion}</p>
          </div>
          <span style={{ fontSize: 18, color: TK.textLight }}>{isRTL ? '←' : '→'}</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: TK.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{T.newVersion}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: TK.accent, margin: '4px 0 0' }}>v{proposal.currentVersion + 1}</p>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: TK.textMuted, textAlign: 'center', margin: 0 }}>{pendingFile?.name}</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 16, background: TK.bgSubtle, borderRadius: RADIUS.md, padding: 12 }}>
          <AlertTriangle size={14} color={TK.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: TK.textMuted, margin: 0 }}>{T.replaceWarning}</p>
        </div>
      </Modal>

      <Drawer open={versionsOpen} onClose={() => setVersionsOpen(false)} title={T.versions}>
        {versions.length === 0 && <p style={{ fontSize: 13, color: TK.textMuted }}>{T.noVersions}</p>}
        {versions.map((v) => (
          <div key={v._id} style={{ border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>v{v.versionNumber}</span>
              <span style={{ fontSize: 11, color: TK.textLight }}>{new Date(v.createdAt).toLocaleString()}</span>
            </div>
            {v.changeSummary && <p style={{ fontSize: 12, color: TK.textMuted, marginTop: 4 }}>{v.changeSummary}</p>}
            <p style={{ fontSize: 11, color: TK.textLight, marginTop: 4 }}>{T.by} {v.createdBy?.fullName || v.createdBy?.email || '—'}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {v.snapshot?.htmlAsset?.fileId && (
                <Button size="sm" variant="secondary" onClick={() => viewVersionHtml(v)}>{T.view}</Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => restoreVersion(v._id)}>{T.restore}</Button>
            </div>
          </div>
        ))}
      </Drawer>
    </div>
  );
};

export default AdminProposalImportEditor;
