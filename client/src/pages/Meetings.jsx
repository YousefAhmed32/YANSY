import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Calendar, Clock, Video, MessageCircle, Zap, Check,
  User, Mail, Phone, CalendarDays, ExternalLink, Download, AlertCircle,
  CheckCircle2, RefreshCw, Sparkles
} from 'lucide-react';
import { trackSchedule } from '../utils/metaPixel';
import { TK } from '../admin-ui';
import api from '../utils/api';

const MEETING_TYPES = [
  {
    id: 'discovery',
    icon: Video,
    duration: '30 min',
    durationMinutes: 30,
    color: '#2563EB',
    title_en: 'Discovery & Strategy Call',
    title_ar: 'مكالمة استكشاف واستراتيجية',
    desc_en: "Best for new projects. We'll analyze your project scope, roadmap, budget, and recommend the best technical stack.",
    desc_ar: 'مثالية للمشاريع الجديدة. سنحلل نطاق مشروعك، والجدول الزمني، والميزانية، ونقترح أفضل بنية تقنية.',
    items_en: ['Project scope & business goals', 'Tech stack & feasibility assessment', 'Rough timeline & investment estimate'],
    items_ar: ['نطاق المشروع وأهدافه', 'تقييم الجدوى والبنية التقنية', 'تقدير مبدئي للوقت والميزانية'],
  },
  {
    id: 'review',
    icon: Zap,
    duration: '45 min',
    durationMinutes: 45,
    color: '#7c3aed',
    title_en: 'Project Milestone Review',
    title_ar: 'مراجعة مراحل المشروع',
    desc_en: 'For active clients. Review deliverables, inspect live staging previews, address feedback, and sign off milestones.',
    desc_ar: 'للعملاء الحاليين. استعراض التسليمات ومعاينات النسخة الحية، وتعديل الملاحظات واعتماد المراحل.',
    items_en: ['Milestone deliverable demo', 'Design & UI/UX feedback alignment', 'Sprint sign-off & next phase rollout'],
    items_ar: ['عرض حي لتسليمات المرحلة', 'مواءمة ملاحظات التصميم والتجربة', 'اعتماد السبرنت وإطلاق المرحلة التالية'],
  },
  {
    id: 'technical',
    icon: MessageCircle,
    duration: '60 min',
    durationMinutes: 60,
    color: '#0891b2',
    title_en: 'Architecture & System Deep Dive',
    title_ar: 'جلسة معمارية ونظام متعمقة',
    desc_en: 'For enterprise & complex systems. Integrations, microservices, database modeling, and security hardening.',
    desc_ar: 'للأنظمة المتقدمة والمؤسسات. التكاملات، الخدمات السحابية، نماذج قواعد البيانات والأمان السيبراني.',
    items_en: ['System & database architecture', 'Third-party API & payment integration', 'Security, performance & scalability SLA'],
    items_ar: ['معمارية النظام وقواعد البيانات', 'تكامل بوابات الدفع والـ APIs', 'معايير الأمان والأداء العالي'],
  },
];

const WHATSAPP_NUMBER = '201090385390';

// Generate list of next business days (Sun-Thu)
function getNextBusinessDays(count = 12) {
  const days = [];
  const curr = new Date();
  curr.setDate(curr.getDate() + 1); // start tomorrow

  while (days.length < count) {
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      days.push(new Date(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

export default function Meetings() {
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const currentUser = useSelector((state) => state.auth?.user);
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'whatsapp' | 'admin'
  const [selectedType, setSelectedType] = useState(MEETING_TYPES[0]);
  const [availableDays] = useState(() => getNextBusinessDays(12));
  const [selectedDay, setSelectedDay] = useState(availableDays[0]);
  
  // Availability state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [formError, setFormError] = useState('');

  // Admin view state
  const [adminBookings, setAdminBookings] = useState([]);
  const [loadingAdminBookings, setLoadingAdminBookings] = useState(false);
  const [adminFilter, setAdminFilter] = useState('all');

  // Load available slots when selected day or type changes
  useEffect(() => {
    if (!selectedDay) return;
    const dateStr = selectedDay.toISOString().split('T')[0];
    setLoadingSlots(true);
    setSelectedSlot(null);

    api.get(`/bookings/availability?date=${dateStr}&meetingType=${selectedType.id}`)
      .then((res) => {
        setAvailableSlots(res.data.slots || []);
      })
      .catch((err) => {
        console.error('Failed to load slots:', err);
        setAvailableSlots([
          { time: '11:00 AM', value: '11:00', available: true },
          { time: '01:00 PM', value: '13:00', available: true },
          { time: '03:00 PM', value: '15:00', available: true },
          { time: '04:30 PM', value: '16:30', available: true },
        ]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDay, selectedType]);

  // Load admin bookings if admin tab active
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      setLoadingAdminBookings(true);
      api.get('/bookings')
        .then((res) => {
          setAdminBookings(res.data.bookings || []);
        })
        .catch((err) => console.error('Failed to load admin bookings:', err))
        .finally(() => setLoadingAdminBookings(false));
    }
  }, [activeTab, isAdmin]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedSlot) {
      setFormError(ar ? 'يرجى اختيار موعد متاح أولاً' : 'Please select an available time slot first.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError(ar ? 'يرجى إدخال الاسم والبريد الإلكتروني' : 'Please provide both your name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = selectedDay.toISOString().split('T')[0];
      const scheduledAt = new Date(`${dateStr}T${selectedSlot.value}:00+03:00`).toISOString();

      const payload = {
        clientName: formData.name.trim(),
        clientEmail: formData.email.trim(),
        clientPhone: formData.phone.trim(),
        meetingType: selectedType.id,
        scheduledAt,
        durationMinutes: selectedType.durationMinutes,
        timeZone: 'Africa/Cairo',
        notes: formData.notes.trim(),
      };

      const res = await api.post('/bookings', payload);
      setBookingConfirmed(res.data.booking);
      trackSchedule({ content_name: selectedType.id, content_category: selectedType.duration });
    } catch (err) {
      console.error('Booking creation failed:', err);
      setFormError(err.response?.data?.error || (ar ? 'تعذر تأكيد الحجز، يرجى المحاولة مجدداً.' : 'Failed to book slot. Please try another time.'));
    } finally {
      setSubmitting(false);
    }
  };

  const generateGoogleCalendarUrl = (booking) => {
    if (!booking) return '#';
    const start = new Date(booking.scheduledAt);
    const end = new Date(start.getTime() + (booking.durationMinutes || 30) * 60000);
    const formatTime = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(`YANSY Tech: ${ar ? selectedType.title_ar : selectedType.title_en}`);
    const details = encodeURIComponent(`Meeting Link: ${booking.meetingLink}\n\nClient: ${booking.clientName}\nEmail: ${booking.clientEmail}\nNotes: ${booking.notes || 'None'}`);
    const loc = encodeURIComponent(booking.meetingLink || 'Google Meet / Online');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatTime(start)}/${formatTime(end)}&details=${details}&location=${loc}`;
  };

  const downloadICS = (booking) => {
    if (!booking) return;
    const start = new Date(booking.scheduledAt);
    const end = new Date(start.getTime() + (booking.durationMinutes || 30) * 60000);
    const formatTime = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YANSY Tech//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:booking-${booking._id || Date.now()}@yansytech.com`,
      `DTSTAMP:${formatTime(new Date())}`,
      `DTSTART:${formatTime(start)}`,
      `DTEND:${formatTime(end)}`,
      `SUMMARY:YANSY Tech - ${selectedType.title_en}`,
      `DESCRIPTION:Meeting with YANSY Tech team. Link: ${booking.meetingLink}`,
      `LOCATION:${booking.meetingLink}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `yansy-meeting-${booking._id || 'booking'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      setAdminBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: TK.bg,
      padding: '36px 32px 80px',
      direction: isRTL ? 'rtl' : 'ltr',
      fontFamily: isRTL ? "'IBM Plex Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif"
    }}>
      {/* Header */}
      <div style={{ maxWidth: '960px', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px', borderRadius: '20px',
          border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.08)',
          marginBottom: '16px'
        }}>
          <Sparkles style={{ width: '13px', height: '13px', color: TK.accent }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: TK.accent, letterSpacing: ar ? 0 : '0.1em', textTransform: 'uppercase' }}>
            {ar ? 'نظام الحجز المباشر والمزامنة' : 'Confirmed Live Architecture Booking'}
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 700, color: TK.text, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {ar ? 'احجز جلسة استراتيجية وهندسية' : 'Book a Strategy & Engineering Session'}
        </h1>
        <p style={{ fontSize: '15px', color: TK.textMuted, maxWidth: '640px', lineHeight: 1.6, margin: 0 }}>
          {ar
            ? 'اختر نوع الجلسة والموعد الأنسب لك من جدول مهندسينا، واحصل فوراً على رابط الاجتماع ودعوة التقويم الرسمية.'
            : 'Select a session type and pick an available slot directly on our team calendar with instant Google Meet link and calendar sync.'}
        </p>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('calendar'); setBookingConfirmed(null); }}
            style={{
              padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              border: activeTab === 'calendar' ? `1px solid ${TK.accent}` : `1px solid ${TK.border}`,
              background: activeTab === 'calendar' ? TK.accent : TK.surface,
              color: activeTab === 'calendar' ? '#fff' : TK.textMuted,
              transition: 'all 0.2s'
            }}
          >
            <CalendarDays style={{ width: '15px', height: '15px' }} />
            {ar ? 'التقويم المباشر' : 'Live Calendar Booking'}
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            style={{
              padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              border: activeTab === 'whatsapp' ? '1px solid #10b981' : `1px solid ${TK.border}`,
              background: activeTab === 'whatsapp' ? '#10b981' : TK.surface,
              color: activeTab === 'whatsapp' ? '#fff' : TK.textMuted,
              transition: 'all 0.2s'
            }}
          >
            <MessageCircle style={{ width: '15px', height: '15px' }} />
            {ar ? 'محادثة سريعة عبر واتساب' : 'Quick WhatsApp Chat'}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                border: activeTab === 'admin' ? '1px solid #8b5cf6' : `1px solid ${TK.border}`,
                background: activeTab === 'admin' ? '#8b5cf6' : TK.surface,
                color: activeTab === 'admin' ? '#fff' : TK.textMuted,
                transition: 'all 0.2s'
              }}
            >
              <Zap style={{ width: '15px', height: '15px' }} />
              {ar ? 'إدارة المواعيد (الإدارة)' : 'Manage Bookings (Admin)'}
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LIVE CALENDAR BOOKING */}
      {activeTab === 'calendar' && (
        <div style={{ maxWidth: '1080px' }}>
          {/* If already booked, show Confirmation Screen */}
          {bookingConfirmed ? (
            <div style={{
              background: TK.surface, border: `1px solid ${TK.border}`,
              borderRadius: '20px', padding: '40px', maxWidth: '680px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: '#10b981'
              }}>
                <CheckCircle2 style={{ width: '36px', height: '36px' }} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 700, color: TK.text, textAlign: 'center', margin: '0 0 8px' }}>
                {ar ? 'تم تأكيد موعد جلستك بنجاح!' : 'Your Session is Confirmed!'}
              </h2>
              <p style={{ fontSize: '14px', color: TK.textMuted, textAlign: 'center', margin: '0 0 28px' }}>
                {ar
                  ? `تم حجز الجلسة باسم ${bookingConfirmed.clientName} وإرسال تفاصيل الرابط إلى ${bookingConfirmed.clientEmail}.`
                  : `Booked for ${bookingConfirmed.clientName}. Details have been sent to ${bookingConfirmed.clientEmail}.`}
              </p>

              {/* Summary Box */}
              <div style={{
                background: TK.bg, border: `1px solid ${TK.border}`,
                borderRadius: '14px', padding: '20px', marginBottom: '28px',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: TK.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {ar ? 'نوع الجلسة' : 'Session Type'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: TK.text }}>
                    {ar ? selectedType.title_ar : selectedType.title_en}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: TK.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {ar ? 'الموعد المحدد' : 'Scheduled Time'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                    {new Date(bookingConfirmed.scheduledAt).toLocaleString(ar ? 'ar-EG' : 'en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} (Cairo)
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11px', color: TK.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {ar ? 'رابط الاجتماع المباشر' : 'Live Meeting Link'}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: TK.surface, borderRadius: '8px', border: `1px solid ${TK.border}`
                  }}>
                    <a
                      href={bookingConfirmed.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#60a5fa', textDecoration: 'none', wordBreak: 'break-all' }}
                    >
                      {bookingConfirmed.meetingLink}
                    </a>
                    <ExternalLink style={{ width: '14px', height: '14px', color: '#60a5fa', flexShrink: 0, marginInlineStart: '8px' }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a
                  href={generateGoogleCalendarUrl(bookingConfirmed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 20px', borderRadius: '10px',
                    background: '#2563EB', color: '#fff', textDecoration: 'none',
                    fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Calendar style={{ width: '16px', height: '16px' }} />
                  {ar ? 'إضافة إلى Google Calendar' : 'Add to Google Calendar'}
                </a>

                <button
                  onClick={() => downloadICS(bookingConfirmed)}
                  style={{
                    padding: '12px 20px', borderRadius: '10px',
                    background: TK.surface, border: `1px solid ${TK.border}`,
                    color: TK.text, fontWeight: 500, fontSize: '13px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  {ar ? 'تحميل دعوة التقويم (.ics لـ Apple & Outlook)' : 'Download .ics Calendar Invite'}
                </button>

                <button
                  onClick={() => setBookingConfirmed(null)}
                  style={{
                    marginTop: '10px', background: 'transparent', border: 'none',
                    color: TK.textMuted, fontSize: '12px', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  {ar ? 'حجز موعد إضافي' : 'Book another session'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Left Column: Meeting Type Selector & Date/Slot Picker */}
              <div>
                {/* Step 1: Meeting Type */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TK.text, marginBottom: '12px' }}>
                    1. {ar ? 'اختر نوع الجلسة' : 'Select Session Type'}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {MEETING_TYPES.map((type) => {
                      const isSelected = selectedType.id === type.id;
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setSelectedType(type)}
                          style={{
                            padding: '14px 18px', borderRadius: '12px',
                            background: isSelected ? 'rgba(37,99,235,0.08)' : TK.surface,
                            border: isSelected ? `1.5px solid ${type.color}` : `1px solid ${TK.border}`,
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Icon style={{ width: '16px', height: '16px', color: type.color }} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: TK.text }}>
                                {ar ? type.title_ar : type.title_en}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: `${type.color}20`, color: type.color, fontWeight: 600 }}>
                              {type.duration}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: TK.textMuted, margin: 0, lineHeight: 1.4 }}>
                            {ar ? type.desc_ar : type.desc_en}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Date Selector */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: TK.text }}>
                      2. {ar ? 'اختر يوم المقابلة' : 'Select Date'}
                    </label>
                    <span style={{ fontSize: '11px', color: TK.textMuted }}>
                      {ar ? 'الأحد - الخميس (أيام العمل)' : 'Sun - Thu (Business Days)'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
                    scrollbarWidth: 'thin'
                  }}>
                    {availableDays.map((dateObj, idx) => {
                      const isSelected = selectedDay.toDateString() === dateObj.toDateString();
                      const dayName = dateObj.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short' });
                      const dayNum = dateObj.getDate();
                      const monthName = dateObj.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { month: 'short' });

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDay(dateObj)}
                          style={{
                            minWidth: '68px', padding: '10px 8px', borderRadius: '12px',
                            background: isSelected ? '#2563EB' : TK.surface,
                            border: isSelected ? '1px solid #2563EB' : `1px solid ${TK.border}`,
                            color: isSelected ? '#fff' : TK.text,
                            textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                            flexShrink: 0
                          }}
                        >
                          <div style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6, marginBottom: '2px' }}>{dayName}</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>{dayNum}</div>
                          <div style={{ fontSize: '10px', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px' }}>{monthName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Slots Grid */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: TK.text }}>
                      3. {ar ? 'المواعيد المتاحة (توقيت القاهرة GMT+3)' : 'Available Slots (Cairo Time)'}
                    </label>
                    {loadingSlots && <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite', color: TK.accent }} />}
                  </div>

                  {loadingSlots ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: TK.textMuted, fontSize: '13px' }}>
                      {ar ? 'جارٍ التحقق من المواعيد المتاحة...' : 'Checking calendar availability...'}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '13px' }}>
                      {ar ? 'عذراً، هذا اليوم مكتمل الحجوزات. يرجى اختيار يوم آخر.' : 'No slots available for this day. Please pick another date.'}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '8px' }}>
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.value === slot.value;
                        const isAvailable = slot.available;
                        return (
                          <button
                            key={slot.value}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '10px 6px', borderRadius: '10px',
                              background: !isAvailable ? 'rgba(0,0,0,0.1)' : isSelected ? '#10b981' : TK.surface,
                              border: isSelected ? '1px solid #10b981' : `1px solid ${TK.border}`,
                              color: !isAvailable ? TK.textMuted : isSelected ? '#fff' : TK.text,
                              fontSize: '12px', fontWeight: 600,
                              cursor: isAvailable ? 'pointer' : 'not-allowed',
                              opacity: isAvailable ? 1 : 0.4,
                              transition: 'all 0.15s'
                            }}
                          >
                            <Clock style={{ width: '12px', height: '12px', marginInlineEnd: '4px', verticalAlign: '-1px' }} />
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Contact Information Form */}
              <div style={{
                background: TK.surface, border: `1px solid ${TK.border}`,
                borderRadius: '16px', padding: '28px', height: 'fit-content'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: TK.text, margin: '0 0 8px' }}>
                  {ar ? 'بيانات الحضور وتأكيد الجلسة' : 'Attendee Information'}
                </h3>
                <p style={{ fontSize: '12px', color: TK.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
                  {ar
                    ? 'أدخل بياناتك لتصلك دعوة Google Meet وتفاصيل التحضير للاجتماع.'
                    : 'Enter your details to receive the Google Meet invitation and agenda.'}
                </p>

                {formError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#ef4444', fontSize: '12px', marginBottom: '16px'
                  }}>
                    <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {ar ? 'الاسم بالكامل *' : 'Full Name *'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '12px', width: '15px', height: '15px', color: TK.textMuted }} />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={ar ? 'مثال: أحمد محمود' : 'e.g. John Doe'}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: isRTL ? '10px 38px 10px 14px' : '10px 14px 10px 38px',
                          borderRadius: '8px', background: TK.bg, border: `1px solid ${TK.border}`,
                          color: TK.text, fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {ar ? 'البريد الإلكتروني *' : 'Email Address *'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '12px', width: '15px', height: '15px', color: TK.textMuted }} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@company.com"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: isRTL ? '10px 38px 10px 14px' : '10px 14px 10px 38px',
                          borderRadius: '8px', background: TK.bg, border: `1px solid ${TK.border}`,
                          color: TK.text, fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {ar ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '12px', width: '15px', height: '15px', color: TK.textMuted }} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+20 100 000 0000"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: isRTL ? '10px 38px 10px 14px' : '10px 14px 10px 38px',
                          borderRadius: '8px', background: TK.bg, border: `1px solid ${TK.border}`,
                          color: TK.text, fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {ar ? 'ما الذي ترغب بمناقشته؟ (اختياري)' : 'Topics to cover (optional)'}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={ar ? 'فكرة المشروع، التحديات التقنية الحالية، أو موعد الإطلاق المستهدف...' : 'Project brief, key challenges, target launch date...'}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px', borderRadius: '8px',
                        background: TK.bg, border: `1px solid ${TK.border}`,
                        color: TK.text, fontSize: '13px', resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Booking selection recap */}
                  {selectedSlot && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                      fontSize: '12px', color: '#60a5fa'
                    }}>
                      <strong>{ar ? 'الموعد المختار:' : 'Selected:'} </strong>
                      {selectedDay.toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @ {selectedSlot.time} (Cairo)
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedSlot}
                    style={{
                      marginTop: '8px', padding: '14px 20px', borderRadius: '10px',
                      background: !selectedSlot ? TK.border : '#2563EB',
                      color: !selectedSlot ? TK.textMuted : '#fff',
                      border: 'none', fontSize: '14px', fontWeight: 600,
                      cursor: selectedSlot && !submitting ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {submitting ? (
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Check style={{ width: '16px', height: '16px' }} />
                    )}
                    {submitting
                      ? (ar ? 'جارٍ تأكيد الحجز...' : 'Confirming Reservation...')
                      : (ar ? 'تأكيد الحجز وتوليد رابط الاجتماع' : 'Confirm Booking & Generate Meet')}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INSTANT WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px' }}>
          {MEETING_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                style={{
                  padding: '24px', background: TK.surface,
                  border: `1px solid ${TK.border}`, borderRadius: '14px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${type.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: '20px', height: '20px', color: type.color }} />
                    </div>
                    <span style={{ fontSize: '11px', color: TK.textMuted, border: `1px solid ${TK.border}`, padding: '2px 8px', borderRadius: '10px' }}>
                      {type.duration}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: TK.text, margin: '0 0 6px' }}>
                    {ar ? type.title_ar : type.title_en}
                  </h3>
                  <p style={{ fontSize: '12px', color: TK.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
                    {ar ? type.desc_ar : type.desc_en}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    {(ar ? type.items_ar : type.items_en).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: type.color }} />
                        <span style={{ fontSize: '11px', color: TK.textMuted }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const msg = ar ? `مرحباً، أود التنسيق لجلسة ${type.title_ar} (${type.duration}).` : `Hi, I'd like to book a ${type.title_en} (${type.duration}).`;
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
                    trackSchedule({ content_name: type.id, content_category: type.duration });
                  }}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: '#10b981', color: '#fff', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MessageCircle style={{ width: '14px', height: '14px' }} />
                  {ar ? 'تواصل عبر واتساب فوراً' : 'Chat on WhatsApp Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ADMIN BOOKING MANAGEMENT */}
      {activeTab === 'admin' && isAdmin && (
        <div style={{ maxWidth: '1080px' }}>
          <div style={{
            background: TK.surface, border: `1px solid ${TK.border}`,
            borderRadius: '16px', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: TK.text, margin: '0 0 4px' }}>
                  {ar ? 'سجل حجوزات الاجتماعات والمكالمات' : 'Client Scheduled Bookings'}
                </h3>
                <p style={{ fontSize: '13px', color: TK.textMuted, margin: 0 }}>
                  {ar ? `إجمالي الحجوزات: ${adminBookings.length}` : `Total bookings: ${adminBookings.length}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'confirmed', 'completed', 'cancelled'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAdminFilter(f)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                      textTransform: 'uppercase', cursor: 'pointer',
                      background: adminFilter === f ? TK.accent : TK.bg,
                      color: adminFilter === f ? '#fff' : TK.textMuted,
                      border: `1px solid ${adminFilter === f ? TK.accent : TK.border}`
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loadingAdminBookings ? (
              <div style={{ padding: '36px', textAlign: 'center', color: TK.textMuted }}>
                <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                {ar ? 'جارٍ تحميل الحجوزات...' : 'Loading bookings...'}
              </div>
            ) : adminBookings.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: TK.textMuted }}>
                {ar ? 'لا توجد حجوزات مسجلة حالياً.' : 'No bookings found.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${TK.border}`, textAlign: isRTL ? 'right' : 'left' }}>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'العميل' : 'Client'}</th>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'نوع الجلسة' : 'Session Type'}</th>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'الموعد' : 'Date & Time'}</th>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'رابط Meet' : 'Meet Link'}</th>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'الحالة' : 'Status'}</th>
                      <th style={{ padding: '12px 14px', color: TK.textMuted, fontWeight: 600 }}>{ar ? 'الإجراء' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookings
                      .filter(b => adminFilter === 'all' || b.status === adminFilter)
                      .map((b) => (
                        <tr key={b._id} style={{ borderBottom: `1px solid ${TK.border}` }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: TK.text }}>{b.clientName}</div>
                            <div style={{ fontSize: '11px', color: TK.textMuted }}>{b.clientEmail}</div>
                            {b.clientPhone && <div style={{ fontSize: '11px', color: '#10b981' }}>{b.clientPhone}</div>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '11px',
                              background: 'rgba(37,99,235,0.1)', color: '#3b82f6', fontWeight: 600
                            }}>
                              {b.meetingType} ({b.durationMinutes}m)
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: TK.text }}>
                            {new Date(b.scheduledAt).toLocaleString(ar ? 'ar-EG' : 'en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <a
                              href={b.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Video style={{ width: '13px', height: '13px' }} />
                              <span>Join Call</span>
                            </a>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                              background: b.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : b.status === 'completed' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                              color: b.status === 'confirmed' ? '#10b981' : b.status === 'completed' ? '#3b82f6' : '#ef4444',
                              textTransform: 'uppercase'
                            }}>
                              {b.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <select
                              value={b.status}
                              onChange={(e) => handleStatusChange(b._id, e.target.value)}
                              style={{
                                padding: '4px 8px', borderRadius: '6px',
                                background: TK.bg, border: `1px solid ${TK.border}`,
                                color: TK.text, fontSize: '11px'
                              }}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no_show">No Show</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
