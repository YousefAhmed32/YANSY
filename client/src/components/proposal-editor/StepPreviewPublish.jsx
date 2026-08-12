import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Link2, Send } from 'lucide-react';
import { TK, RADIUS, Card, Button, Badge } from '../../admin-ui';

const ChecklistRow = ({ ok, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
    {ok ? <CheckCircle2 size={16} color={TK.green} /> : <Circle size={16} color={TK.textLight} />}
    <span style={{ fontSize: 13, color: ok ? TK.text : TK.textMuted }}>{label}</span>
  </div>
);

const StepPreviewPublish = ({ proposal, onSaveDraft, onPublish, saving, publishing, isRTL }) => {
  const checks = [
    { ok: !!proposal.client, label: isRTL ? 'تم اختيار العميل' : 'Client selected' },
    { ok: !!proposal.project?.title?.trim(), label: isRTL ? 'تم إدخال عنوان المشروع' : 'Project title set' },
    { ok: (proposal.sections || []).length > 0, label: isRTL ? 'تمت إضافة قسم واحد على الأقل' : 'At least one scope section added' },
    { ok: Number(proposal.pricing?.price) > 0 || !!proposal.pricing?.hidePriceFromClient, label: isRTL ? 'تم تحديد السعر (أو إخفاؤه عمدًا)' : 'Price set (or intentionally hidden)' },
    { ok: (proposal.timeline?.phases || []).length > 0, label: isRTL ? 'تم إدخال مراحل الجدول الزمني' : 'Timeline phases added' },
  ];
  const readyToPublish = checks[0].ok && checks[1].ok;

  const publicUrl = proposal.slug ? `${window.location.origin}/p/${proposal.slug}` : null;
  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success(isRTL ? 'تم نسخ الرابط ✓' : 'Link copied ✓')).catch(() => {});
  };

  return (
    <div>
      <Card padding="16px" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          {isRTL ? 'قائمة التحقق' : 'Checklist'}
        </p>
        {checks.map((c, i) => <ChecklistRow key={i} ok={c.ok} label={c.label} />)}
      </Card>

      {proposal._id && (
        <Card padding="16px" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: publicUrl ? 10 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{proposal.proposalNumber}</span>
            <Badge tone="info">{proposal.status}</Badge>
          </div>
          {publicUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TK.bgSubtle, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: '8px 10px' }}>
              <Link2 size={13} color={TK.textMuted} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: TK.textMuted, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'left' }}>{publicUrl}</span>
              <Button size="sm" variant="secondary" onClick={copyLink}>{isRTL ? 'نسخ' : 'Copy'}</Button>
            </div>
          )}
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button variant="secondary" onClick={onSaveDraft} loading={saving}>{isRTL ? 'حفظ كمسودة' : 'Save Draft'}</Button>
        <Button variant="primary" icon={Send} onClick={onPublish} loading={publishing} disabled={!readyToPublish}>
          {isRTL ? 'نشر العرض' : 'Publish Proposal'}
        </Button>
        {!readyToPublish && (
          <p style={{ fontSize: 11, color: TK.textLight, textAlign: 'center' }}>
            {isRTL ? 'أكمل العميل وعنوان المشروع على الأقل للنشر' : 'Complete at least the client and project title to publish'}
          </p>
        )}
      </div>
    </div>
  );
};

export default StepPreviewPublish;
