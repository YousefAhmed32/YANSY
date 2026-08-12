import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileUp, Monitor, Tablet, Smartphone, AlertTriangle, Check, Copy, ExternalLink, Send } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, FONT, PageHeader, Card, Button, IconButton, TextInput, TextArea } from '../admin-ui';
import HtmlDropzone from '../components/imported-html/HtmlDropzone';
import ImportedHTMLViewer from '../components/imported-html/ImportedHTMLViewer';
import StepClient from '../components/proposal-editor/StepClient';
import FormField from '../components/proposal-editor/FormField';

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' };

/**
 * "Import HTML Proposal" — drop the file → preview it exactly as designed
 * (via the same sandboxed ImportedHTMLViewer the public page uses) → enter
 * client/project metadata → Save Draft or Publish. Deliberately does NOT
 * touch the uploaded document itself (no parsing into sections, no CSS
 * rewrite) — see server/media/htmlSanitizer.js and Proposal.type ===
 * 'IMPORTED_HTML' for why.
 */
const AdminProposalImport = () => {
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);
  const navigate = useNavigate();

  const [htmlAsset, setHtmlAsset] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [device, setDevice] = useState('desktop');
  const [client, setClient] = useState(null);
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null); // { publicUrl }

  const T = {
    title: isRTL ? 'استيراد عرض HTML' : 'Import HTML Proposal',
    subtitle: isRTL ? 'ارفع ملف عرض جاهز التصميم وانشره مباشرة كما هو' : 'Upload an already-designed proposal file and publish it exactly as-is',
    metadata: isRTL ? 'بيانات العميل والمشروع' : 'Client & Project Details',
    projectTitle: isRTL ? 'عنوان العرض' : 'Proposal Title',
    projectTitleAr: isRTL ? 'عنوان العرض (عربي)' : 'Proposal Title (Arabic)',
    validityDate: isRTL ? 'تاريخ انتهاء الصلاحية' : 'Validity Date',
    notes: isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)',
    saveDraft: isRTL ? 'حفظ كمسودة' : 'Save Draft',
    publish: isRTL ? 'نشر العرض' : 'Publish Proposal',
    needFile: isRTL ? 'يرجى رفع ملف HTML أولًا' : 'Please upload an HTML file first',
    needClient: isRTL ? 'يرجى اختيار العميل' : 'Please select a client',
    needTitle: isRTL ? 'يرجى إدخال عنوان العرض' : 'Please enter a proposal title',
    savedDraft: isRTL ? 'تم الحفظ كمسودة ✓' : 'Saved as draft ✓',
    saveFailed: isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again',
    publishedTitle: isRTL ? 'تم نشر العرض بنجاح' : 'Proposal published successfully',
    publishedBody: isRTL ? 'العرض متاح الآن على الرابط العام التالي.' : 'The proposal is now live at the public link below.',
    copyLink: isRTL ? 'نسخ الرابط' : 'Copy Link',
    openProposal: isRTL ? 'فتح العرض' : 'Open Proposal',
    backToList: isRTL ? 'العودة إلى العروض' : 'Back to Proposals',
    linkCopied: isRTL ? 'تم نسخ الرابط ✓' : 'Link copied ✓',
  };

  const handleUpload = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('html', file);
    const { data } = await api.post('/proposals/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => { if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100)); },
    });
    setHtmlAsset(data.htmlAsset);
    setWarnings(data.warnings || []);
    if (!title) setTitle(file.name.replace(/\.html?$/i, ''));
  };

  const buildPayload = () => ({
    type: 'IMPORTED_HTML',
    client: client?._id || client,
    project: { title: title.trim(), titleAr: titleAr.trim() || undefined },
    htmlAsset,
    validityDate: validityDate || undefined,
    notes: notes.trim() || undefined,
  });

  const validate = () => {
    if (!htmlAsset) { toast.error(T.needFile); return false; }
    if (!client) { toast.error(T.needClient); return false; }
    if (!title.trim()) { toast.error(T.needTitle); return false; }
    return true;
  };

  const saveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/proposals', buildPayload());
      toast.success(T.savedDraft);
      navigate(`/app/admin/proposals/${data.item._id}/edit-html`);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!validate()) return;
    setPublishing(true);
    try {
      const { data } = await api.post('/proposals', buildPayload());
      const publishRes = await api.post(`/proposals/${data.item._id}/publish`);
      setPublished({ publicUrl: publishRes.data.publicUrl });
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}${published.publicUrl}`;
    navigator.clipboard.writeText(url).then(() => toast.success(T.linkCopied)).catch(() => {});
  };

  if (published) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, padding: 24 }}>
        <Card padding="40px" style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={28} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{T.publishedTitle}</h2>
          <p style={{ fontSize: 13, color: TK.textMuted, marginTop: 8 }}>{T.publishedBody}</p>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" icon={Copy} onClick={copyLink}>{T.copyLink}</Button>
            <Button variant="secondary" icon={ExternalLink} onClick={() => window.open(published.publicUrl, '_blank', 'noopener,noreferrer')}>{T.openProposal}</Button>
            <Button variant="ghost" onClick={() => navigate('/app/admin/proposals')}>{T.backToList}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: 32, fontFamily: font }}>
      <PageHeader icon={FileUp} eyebrow={isRTL ? 'نظام العروض' : 'Proposal System'} title={T.title} subtitle={T.subtitle} />

      <div style={{ display: 'grid', gridTemplateColumns: htmlAsset ? 'minmax(360px, 440px) 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <Card padding="20px">
            <HtmlDropzone onUpload={handleUpload} isRTL={isRTL} />
          </Card>

          {warnings.length > 0 && (
            <Card padding="16px" style={{ marginTop: 14, background: '#FFFBEB', borderColor: '#FDE68A' }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < warnings.length - 1 ? 8 : 0 }}>
                  <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>{w}</p>
                </div>
              ))}
            </Card>
          )}

          {htmlAsset && (
            <Card padding="20px" style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>{T.metadata}</p>
              <StepClient value={client} onChange={setClient} isRTL={isRTL} />
              <FormField label={T.projectTitle} required>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormField>
              <FormField label={T.projectTitleAr}>
                <TextInput dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
              </FormField>
              <FormField label={T.validityDate}>
                <TextInput type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
              </FormField>
              <FormField label={T.notes}>
                <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </FormField>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <Button variant="secondary" onClick={saveDraft} loading={saving} disabled={publishing}>{T.saveDraft}</Button>
                <Button variant="primary" icon={Send} onClick={publish} loading={publishing} disabled={saving}>{T.publish}</Button>
              </div>
            </Card>
          )}
        </div>

        {htmlAsset && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
              <IconButton icon={Monitor} variant={device === 'desktop' ? 'filled' : 'outline'} onClick={() => setDevice('desktop')} title="Desktop" />
              <IconButton icon={Tablet} variant={device === 'tablet' ? 'filled' : 'outline'} onClick={() => setDevice('tablet')} title="Tablet" />
              <IconButton icon={Smartphone} variant={device === 'mobile' ? 'filled' : 'outline'} onClick={() => setDevice('mobile')} title="Mobile" />
            </div>
            <div style={{
              maxWidth: DEVICE_WIDTHS[device], margin: '0 auto', border: `1px solid ${TK.border}`,
              borderRadius: device === 'desktop' ? 12 : 20, overflow: 'hidden', boxShadow: '0 8px 30px rgba(16,24,40,.08)',
              transition: 'max-width .25s ease',
            }}>
              <ImportedHTMLViewer htmlAssetUrl={htmlAsset.url} height="80vh" title={title || 'Proposal preview'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProposalImport;
