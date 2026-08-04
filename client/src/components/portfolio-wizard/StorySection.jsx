import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Target, AlertTriangle, ShieldAlert, CheckCircle2, Compass,
  Sparkles, Layers, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react';
import { TK, RADIUS, SHADOW } from '../../admin-ui';
import { TagInput } from './shared';
import StoryQualityMeter from './StoryQualityMeter';
import StoryBlockEditor from './StoryBlockEditor';

const BLOCK_DEFS = [
  {
    id: 'summary',
    icon: Sparkles,
    en: 'Executive Summary',
    ar: 'الملخص التنفيذي',
    hintEn: 'Shown on cards, search results, and case study hero lead. Recommended 120–250 chars.',
    hintAr: 'يظهر في البطاقات ومحركات البحث ومقدمة دراسة الحالة.',
    min: 120,
    max: 250,
    enKey: 'description',
    arKey: 'descriptionAr',
    templates: [
      {
        titleEn: 'Platform Rebuild',
        titleAr: 'إعادة بناء منصة',
        en: 'Rebuilt the entire platform architecture from scratch to handle 3x higher traffic, reducing average load times by 65% and boosting conversion rates.',
        ar: 'أعدنا بناء بنية المنصة بالكامل من الصفر للتعامل مع 3 أضعاف حركة الزيارات، ما خفّض زمن التحميل بنسبة 65٪ ورفع معدلات التحويل.',
      },
      {
        titleEn: 'Digital Transformation',
        titleAr: 'تحول رقمي كامل',
        en: 'Digitized legacy manual paper and spreadsheet operations into a unified real-time cloud platform with instant automated workflows.',
        ar: 'حوّلنا العمليات اليدوية والورقية القديمة إلى منصة سحابية موحّدة تعمل فوريًا وتوفر سير عمل مؤتمت بالكامل.',
      },
    ],
  },
  {
    id: 'goal',
    icon: Target,
    en: 'Client Goal',
    ar: 'الهدف والمبتغى',
    hintEn: 'What the client wanted to achieve going in.',
    hintAr: 'ما أراد العميل تحقيقه في البداية.',
    min: 40,
    max: 200,
    enKey: 'goals',
    arKey: 'goalsAr',
    templates: [
      {
        titleEn: 'Scale & Automate',
        titleAr: 'التوسع والأتمتة',
        en: 'Transform manual spreadsheet workflows into a scalable production SaaS platform capable of serving 10,000+ active users with real-time analytics.',
        ar: 'تحويل العمليات اليدوية بجداول البيانات إلى منصة SaaS إنتاجية قابلة للتوسع تخدم أكثر من 10,000 مستخدم نشط مع تحليلات فورية.',
      },
    ],
  },
  {
    id: 'painPoints',
    icon: AlertTriangle,
    en: 'Pain Points',
    ar: 'نقاط الألم والإحباط',
    hintEn: 'The core operational frustrations before this project.',
    hintAr: 'نقاط الإحباط التشغيلية قبل تنفية المشروع.',
    min: 40,
    max: 200,
    enKey: 'painPoints',
    arKey: 'painPointsAr',
    templates: [
      {
        titleEn: 'Manual Friction',
        titleAr: 'احتكاك يدوي وتأخير',
        en: 'High drop-off rates due to forced account creation, 5-second mobile load times, and manual WhatsApp/email booking delays.',
        ar: 'معدلات تسرب عالية بسبب التدفّق الإجباري لإنشاء الحساب، وزمن تحميل 5 ثوانٍ على الجوال، وتأخير المتابعة اليدوية عبر البريد والواتساب.',
      },
    ],
  },
  {
    id: 'challenge',
    icon: ShieldAlert,
    en: 'Technical Challenge',
    ar: 'التحدي التقني المعقد',
    hintEn: 'Explain what was wrong or technically difficult.',
    hintAr: 'اشرح ما كان معقدًا أو بطيئًا من الناحية التقنية.',
    min: 80,
    max: 300,
    enKey: 'challenge',
    arKey: 'challengeAr',
    templates: [
      {
        titleEn: 'Legacy Bottlenecks',
        titleAr: 'عقبات البنية القديمة',
        en: 'The legacy infrastructure suffered from severe latency during peak traffic, fragmented data silos across 5 unintegrated systems, and lack of real-time visibility.',
        ar: 'عانت البنية التحتية القديمة من بطء شديد أثناء ذروة الاستخدام، وجزر بيانات مبعثرة عبر 5 أنظمة غير متكاملة، وغياب أي رؤية فورية.',
      },
    ],
  },
  {
    id: 'solution',
    icon: CheckCircle2,
    en: 'Architectural Solution',
    ar: 'الحل المعماري والهندسي',
    hintEn: 'Explain what changed technically and architecturally.',
    hintAr: 'اشرح الحل المعماري والهندسي الذي تم تنفيذه.',
    min: 80,
    max: 300,
    enKey: 'solution',
    arKey: 'solutionAr',
    templates: [
      {
        titleEn: 'Next.js & Realtime Engine',
        titleAr: 'معمارية Next.js والبيانات الفورية',
        en: 'We architected a modern Next.js frontend paired with a high-concurrency Node.js backend, automated real-time WebSocket data routing, and PostgreSQL row-level security.',
        ar: 'صمّمنا واجهة معاصرة بـNext.js مقترنة بخادم Node.js عالي الأداء، وتوجيه بيانات فوري عبر WebSockets، وأمان بيانات مؤمَّن في PostgreSQL.',
      },
    ],
  },
  {
    id: 'process',
    icon: Compass,
    en: 'Our Process',
    ar: 'منهجية العمل والخطوات',
    hintEn: 'Explain how the project was delivered step-by-step.',
    hintAr: 'اشرح خطوات تنفيذ وتسليم المشروع.',
    min: 40,
    max: 200,
    enKey: 'process',
    arKey: 'processAr',
    templates: [
      {
        titleEn: '5-Phase Agile Delivery',
        titleAr: 'تسليم مرن بـ 5 مراحل',
        en: '1. Discovery & User Research → 2. High-Fidelity UI/UX Prototyping → 3. Agile Next.js Engineering → 4. QA & Performance Testing → 5. Zero-Downtime Launch.',
        ar: '1. البحث والاستكشاف ← 2. النماذج الأولية وتجربة المستخدم ← 3. الهندسة والتطوير بـNext.js ← 4. الاختبار والأداء ← 5. الإطلاق بدون أي توقف.',
      },
    ],
  },
];

const StorySection = ({ form, set, isRTL, projectId }) => {
  const [blocksOrder, setBlocksOrder] = useState(() => BLOCK_DEFS.map((b) => b.id));

  const moveBlock = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= blocksOrder.length) return;
    setBlocksOrder((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, [blocksOrder.length]);

  const orderedBlockDefs = blocksOrder
    .map((id) => BLOCK_DEFS.find((b) => b.id === id))
    .filter(Boolean);

  const L = {
    workspaceTitle: isRTL ? 'مساحة كتابة القصة والـ Case Study' : 'Case Study Editorial Workspace',
    workspaceDesc: isRTL ? 'صمم قصة المشروع بأسلوب احترافي يشبه Notion و Linear.' : 'Craft your case study narrative using a structured block builder.',
    reorderHint: isRTL ? 'يمكنك إعادة ترتيب الفقرات حسب الرغبة' : 'Reorder blocks using up/down controls',
    tagsLabel: isRTL ? 'إدارة تقنيات المشروع (Technologies Manager)' : 'Project Technology Manager',
    tagsHint: isRTL ? 'تظهر كبطاقات تقنيات المستخدمة في الصفحة العامة للمشروع' : 'Doubles as the "Built With" technology stack badges',
    tagsPh: isRTL ? 'اكتب تقنية أو قم بلصق نص كامل...' : 'Type or paste technology stack...',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Workspace Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: TK.accent }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TK.text, margin: 0 }}>
            {L.workspaceTitle}
          </h3>
        </div>
        <p style={{ fontSize: 12, color: TK.textMuted, margin: 0 }}>
          {L.workspaceDesc}
        </p>
      </div>

      {/* Story Quality & Completion Widget */}
      <StoryQualityMeter form={form} isRTL={isRTL} />

      {/* Reorderable Story Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnimatePresence margin={false}>
          {orderedBlockDefs.map((blockDef, idx) => (
            <motion.div
              key={blockDef.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <StoryBlockEditor
                id={blockDef.id}
                title={blockDef.en}
                titleAr={blockDef.ar}
                icon={blockDef.icon}
                hintEn={blockDef.hintEn}
                hintAr={blockDef.hintAr}
                recommendedMin={blockDef.min}
                recommendedMax={blockDef.max}
                enValue={form[blockDef.enKey] || ''}
                arValue={form[blockDef.arKey] || ''}
                onEnChange={(v) => set(blockDef.enKey, v)}
                onArChange={(v) => set(blockDef.arKey, v)}
                templates={blockDef.templates}
                isRTL={isRTL}
                dragHandleProps={{
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, idx - 1)}
                        disabled={idx === 0}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, opacity: idx === 0 ? 0.2 : 0.6 }}
                      >
                        <ArrowUp style={{ width: 11, height: 11 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, idx + 1)}
                        disabled={idx === orderedBlockDefs.length - 1}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, opacity: idx === orderedBlockDefs.length - 1 ? 0.2 : 0.6 }}
                      >
                        <ArrowDown style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  ),
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Technology Manager Section */}
      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', textTransform: 'uppercase', marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
          {L.tagsLabel}
        </p>
        <TagInput
          value={form.tags}
          onChange={(v) => set('tags', v)}
          placeholder={L.tagsPh}
          isRTL={isRTL}
          projectId={projectId}
          category={form.category}
        />
      </div>
    </div>
  );
};

export default StorySection;
