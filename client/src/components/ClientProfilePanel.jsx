import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { X, User, Mail, Phone, Building, Users, FolderKanban, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { TK, RADIUS, STATUS_TONE, PageHeader, Card, Badge, IconButton, Button, PageSpinner } from '../admin-ui';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
    <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: RADIUS.md, background: TK.accentBg, border: `1px solid ${TK.accentBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: '16px', height: '16px', color: TK.accent }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: '14px', fontWeight: 500, color: TK.text, margin: 0, wordBreak: 'break-word' }}>{value}</p>
    </div>
  </div>
);

const MiniStat = ({ value, label, tone = TK.text }) => (
  <div>
    <p style={{ fontSize: '24px', fontWeight: 700, color: tone, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{value}</p>
    <p style={{ fontSize: '10.5px', fontWeight: 500, color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
  </div>
);

const statusMeta = (status, progress, isRTL) => {
  if (status === 'cancelled') return { tone: 'danger', Icon: AlertCircle, label: isRTL ? 'ملغى' : 'Cancelled' };
  if (status === 'delivered' || progress === 100) return { tone: 'success', Icon: CheckCircle2, label: isRTL ? 'تم التسليم' : 'Delivered' };
  if (progress >= 80) return { tone: 'warning', Icon: Clock, label: isRTL ? 'قرب الإنجاز' : 'Near Completion' };
  if (progress > 0) return { tone: 'info', Icon: Clock, label: isRTL ? 'قيد التنفيذ' : 'In Progress' };
  return { tone: 'neutral', Icon: Clock, label: isRTL ? 'قيد الانتظار' : 'Pending' };
};

const ClientProfilePanel = ({ clientId, onClose }) => {
  const { isRTL } = useLanguage();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/users/${clientId}/client-details`);
        if (cancelled) return;
        setClient(response.data.client);
        setProjects(response.data.projects || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.error || (isRTL ? 'فشل تحميل بيانات العميل' : 'Failed to load client details'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (client) {
      gsap.fromTo('.client-panel', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, [client]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: TK.bg, overflowY: 'auto' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: loading || error ? 0 : '-4px' }}>
          <IconButton icon={X} variant="outline" size={34} onClick={onClose} aria-label={isRTL ? 'إغلاق' : 'Close'} />
        </div>

        {loading && <PageSpinner />}

        {!loading && (error || !client) && (
          <Card padding="32px" style={{ textAlign: 'center', maxWidth: '420px', margin: '80px auto 0' }}>
            <p style={{ fontSize: '13px', color: TK.textMuted, margin: '0 0 18px' }}>{error || (isRTL ? 'العميل غير موجود' : 'Client not found')}</p>
            <Button variant="primary" onClick={onClose}>{isRTL ? 'إغلاق' : 'Close'}</Button>
          </Card>
        )}

        {!loading && client && (
          <div className="client-panel">
            <Card padding="28px" style={{ marginBottom: '20px' }}>
              <PageHeader
                icon={User}
                eyebrow={isRTL ? 'ملف العميل' : 'Client Profile'}
                title={client.fullName || client.email}
                subtitle={isRTL ? 'البيانات الكاملة وسجل المشاريع' : 'Complete client information and project history'}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ marginTop: '4px' }}>
                <InfoRow icon={User} label={isRTL ? 'الاسم الكامل' : 'Full Name'} value={client.fullName || '—'} />
                <InfoRow icon={Mail} label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={client.email} />
                <InfoRow icon={Phone} label={isRTL ? 'رقم الهاتف' : 'Phone Number'} value={client.phoneNumber || 'N/A'} />
                <InfoRow icon={Building} label={isRTL ? 'نوع العميل' : 'Client Type'} value={client.clientType || (isRTL ? 'فرد' : 'Individual')} />
                {client.companyName && <InfoRow icon={Building} label={isRTL ? 'اسم الشركة' : 'Company Name'} value={client.companyName} />}
                {client.companySize && <InfoRow icon={Users} label={isRTL ? 'حجم الشركة' : 'Company Size'} value={client.companySize.replace('-', ' - ')} />}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginTop: '28px', paddingTop: '24px', borderTop: `1px solid ${TK.borderSoft}` }}>
                <MiniStat value={client.totalProjects || 0} label={isRTL ? 'إجمالي المشاريع' : 'Total Projects'} tone={TK.accent} />
                <MiniStat value={client.projectsByStatus?.['in-progress'] || 0} label={isRTL ? 'قيد التنفيذ' : 'In Progress'} tone={TK.accent} />
                <MiniStat value={client.projectsByStatus?.['near-completion'] || 0} label={isRTL ? 'قرب الإنجاز' : 'Near Completion'} tone={TK.amber} />
                <MiniStat value={client.projectsByStatus?.delivered || 0} label={isRTL ? 'تم التسليم' : 'Delivered'} tone={TK.green} />
              </div>

              {client.lastActivity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${TK.borderSoft}`, color: TK.textMuted }}>
                  <Calendar style={{ width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '12px' }}>
                    {isRTL ? 'آخر نشاط: ' : 'Last Activity: '}{new Date(client.lastActivity).toLocaleString()}
                  </span>
                </div>
              )}
            </Card>

            <Card padding="28px">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: TK.text, margin: 0, letterSpacing: '-0.01em' }}>{isRTL ? 'كل المشاريع' : 'All Projects'}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: TK.textMuted }}>
                  <FolderKanban style={{ width: '15px', height: '15px' }} />
                  <span style={{ fontSize: '12px' }}>{isRTL ? `${projects.length} مشروع` : `${projects.length} projects`}</span>
                </div>
              </div>

              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {projects.map((project) => {
                    const meta = statusMeta(project.status, project.progress || 0, isRTL);
                    return (
                      <Card key={project._id} hover padding="18px">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: TK.text, margin: '0 0 5px' }}>{project.title}</h4>
                            <p style={{
                              fontSize: '12px', color: TK.textMuted, margin: 0,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>{project.description}</p>
                          </div>
                          <meta.Icon style={{ width: '17px', height: '17px', color: STATUS_TONE[meta.tone].fg, flexShrink: 0 }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <Badge tone={meta.tone} dot>{meta.label}</Badge>
                          <span style={{ fontSize: '11.5px', color: TK.textLight }}>{project.progress || 0}% {isRTL ? 'مكتمل' : 'Complete'}</span>
                        </div>

                        {project.progress > 0 && (
                          <div style={{ width: '100%', height: '6px', borderRadius: RADIUS.pill, background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}`, overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{ height: '100%', borderRadius: RADIUS.pill, width: `${project.progress}%`, background: TK.accent, transition: 'width 0.4s ease' }} />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: TK.textLight }}>
                          <span>{isRTL ? 'المرحلة: ' : 'Phase: '}{project.phase}</span>
                          {project.updatedAt && <span>{isRTL ? 'تحديث: ' : 'Updated: '}{new Date(project.updatedAt).toLocaleDateString()}</span>}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: TK.textMuted, margin: 0 }}>{isRTL ? 'لا توجد مشاريع.' : 'No projects found.'}</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfilePanel;
