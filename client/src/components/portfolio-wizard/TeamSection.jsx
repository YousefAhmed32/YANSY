import { Trash2 } from 'lucide-react';
import { TK, RADIUS, TextInput, IconButton } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';
import RelationPicker from './RelationPicker';

/**
 * The people credited on the project — picked from the shared Team Members
 * library (managed at /app/admin/libraries/team) instead of re-typed per
 * project. `roleOverride`/`roleArOverride` let how someone is credited on
 * THIS project differ from their canonical library position (e.g. "Lead
 * Engineer" here vs. "Senior Developer" as their general title) — leave
 * blank to just inherit the library position. Rendered as the stacked-avatar
 * row in the hero meta strip on the public page.
 */
const TeamSection = ({ form, set, isRTL }) => {
  const team = form.team || [];
  const members = team.map((t) => t.member).filter(Boolean);

  const handlePick = (newMembers) => {
    set('team', newMembers.map((m) => {
      const existing = team.find((t) => t.member?._id === m._id);
      return existing || { member: m, roleOverride: '', roleArOverride: '' };
    }));
  };
  const updateCredit = (memberId, patch) => set('team', team.map((t) => (t.member?._id === memberId ? { ...t, ...patch } : t)));
  const removeMember = (memberId) => set('team', team.filter((t) => t.member?._id !== memberId));

  const L = {
    intro: isRTL
      ? 'اختر من مكتبة أعضاء الفريق المشتركة — لن تحتاج لإعادة كتابة الاسم أو رفع الصورة في كل مشروع. القيم أدناه اختيارية وتُخصص طريقة الاعتماد في هذا المشروع فقط.'
      : 'Pick from the shared Team Members library — no need to re-type a name or re-upload a photo per project. The fields below are optional per-project overrides.',
    roleOverride: isRTL ? 'الدور في هذا المشروع (EN)' : 'Role on this project (EN)',
    roleOverrideAr: isRTL ? 'الدور في هذا المشروع (AR)' : 'Role on this project (AR)',
    roleOverridePh: isRTL ? 'اتركه فارغًا لاستخدام المنصب من المكتبة' : 'Leave blank to use the library position',
    removeMember: isRTL ? 'إزالة العضو' : 'Remove member',
    manageLibrary: isRTL ? 'إدارة مكتبة الفريق' : 'Manage team library',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <p style={{ fontSize: 13, color: TK.textMuted, marginBottom: 16, lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
        {L.intro}
      </p>

      <RelationPicker
        apiBase="/team"
        value={members}
        onChange={handlePick}
        multiple
        displayField="name"
        allowCreate
        quickCreateFields={[
          { key: 'name', label: 'Name', labelAr: 'الاسم', required: true },
          { key: 'position', label: 'Position (EN)', labelAr: 'المنصب (إنجليزي)' },
          { key: 'positionAr', label: 'Position (AR)', labelAr: 'المنصب (عربي)' },
        ]}
      />

      {team.length > 0 && (
        <div className="space-y-3" style={{ marginTop: 16 }}>
          {team.map((t) => t.member && (
            <div key={t.member._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, border: `1px solid ${TK.border}`, background: TK.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {t.member.avatar?.url ? (
                <img src={mediaSrc(t.member.avatar)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: TK.text, margin: '0 0 6px' }}>{t.member.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <TextInput value={t.roleOverride || ''} onChange={(e) => updateCredit(t.member._id, { roleOverride: e.target.value })} placeholder={t.member.position || L.roleOverridePh} />
                  <TextInput value={t.roleArOverride || ''} onChange={(e) => updateCredit(t.member._id, { roleArOverride: e.target.value })} dir="rtl" placeholder={t.member.positionAr || L.roleOverridePh} />
                </div>
              </div>
              <IconButton icon={Trash2} variant="outline" onClick={() => removeMember(t.member._id)} aria-label={L.removeMember} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSection;
