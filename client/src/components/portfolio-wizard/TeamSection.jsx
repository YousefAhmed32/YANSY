import { Plus, Trash2, Upload } from 'lucide-react';
import { TK, RADIUS, TextInput, IconButton, Spinner } from '../../admin-ui';
import { mediaSrc } from '../../utils/media';

const AvatarUpload = ({ asset, pending, onUpload, onRemove }) => (
  <label
    className="au-upload-tile"
    style={{
      position: 'relative', width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: TK.bgSubtle, border: `1px solid ${TK.border}`, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    {asset?.url ? (
      <img src={mediaSrc(asset)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.preventDefault(); onRemove(); }} />
    ) : pending ? (
      <Spinner size={16} />
    ) : (
      <Upload style={{ width: 14, height: 14, color: TK.textLight }} />
    )}
    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onUpload(f); }} style={{ display: 'none' }} />
  </label>
);

/**
 * The people credited on the project — name/role (+ optional photo) per
 * member. Rendered as the stacked-avatar row in the hero meta strip on the
 * public page.
 */
const TeamSection = ({ form, set, isRTL, uploadMedia, deleteMedia, pendingUploads }) => {
  const team = form.team || [];
  const updateMember = (i, patch) => set('team', team.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const removeMember = (i) => { deleteMedia(team[i]?.avatar); set('team', team.filter((_, idx) => idx !== i)); };
  const addMember = () => set('team', [...team, { name: '', role: '', roleAr: '' }]);

  const L = {
    intro: isRTL
      ? 'أعضاء الفريق المعتمدون يظهرون كصف صور متراكبة في دراسة الحالة. اختياري — حقل "حجم الفريق" البسيط في تبويب النظرة العامة يكفي وحده.'
      : 'Credited team members show as a stacked avatar row on the case study. Optional — the simple "Team size" field on the Overview tab is enough on its own.',
    name: isRTL ? 'الاسم' : 'Name',
    roleEn: isRTL ? 'الدور (إنجليزي)' : 'Role (EN)',
    roleAr: isRTL ? 'الدور (عربي)' : 'الدور (AR)',
    removeMember: isRTL ? 'إزالة العضو' : 'Remove member',
    addMember: isRTL ? 'إضافة عضو للفريق' : 'Add team member',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <p style={{ fontSize: 13, color: TK.textMuted, marginBottom: 20, lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
        {L.intro}
      </p>

      <div className="space-y-3">
        {team.map((m, i) => {
          const nameField = <TextInput key="name" value={m.name} onChange={(e) => updateMember(i, { name: e.target.value })} placeholder={L.name} />;
          const roleEnField = <TextInput key="roleEn" value={m.role} onChange={(e) => updateMember(i, { role: e.target.value })} placeholder={L.roleEn} />;
          const roleArField = <TextInput key="roleAr" value={m.roleAr} onChange={(e) => updateMember(i, { roleAr: e.target.value })} dir="rtl" placeholder={L.roleAr} />;

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.lg, border: `1px solid ${TK.border}`, background: TK.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <AvatarUpload
                asset={m.avatar}
                pending={pendingUploads.some((u) => u.key === `team-${i}`)}
                onUpload={async (file) => { const asset = await uploadMedia(file, `team-${i}`); updateMember(i, { avatar: asset }); }}
                onRemove={() => { deleteMedia(m.avatar); updateMember(i, { avatar: null }); }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" style={{ flex: 1 }}>
                {isRTL ? <>{nameField}{roleArField}{roleEnField}</> : <>{nameField}{roleEnField}{roleArField}</>}
              </div>
              <IconButton icon={Trash2} variant="outline" onClick={() => removeMember(i)} aria-label={L.removeMember} />
            </div>
          );
        })}
      </div>

      <button
        onClick={addMember}
        className="au-back-link"
        style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}
      >
        <Plus style={{ width: 14, height: 14 }} /> {L.addMember}
      </button>
    </div>
  );
};

export default TeamSection;
