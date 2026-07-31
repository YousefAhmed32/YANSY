import {
  GraduationCap, Cloud, Stethoscope, Pill, UtensilsCrossed, BedDouble, Building2,
  ShoppingBag, Users, Boxes, Sparkles, Palette, Dumbbell, Scale, Factory, Wand2,
} from 'lucide-react';
import { buildDemoProject } from './shared';

import lms from './lms';
import saas from './saas';
import medicalClinic from './medicalClinic';
import pharmacy from './pharmacy';
import restaurant from './restaurant';
import hotel from './hotel';
import realEstate from './realEstate';
import ecommerce from './ecommerce';
import crm from './crm';
import erp from './erp';
import aiPlatform from './aiPlatform';
import portfolioSite from './portfolioSite';
import gym from './gym';
import lawFirm from './lawFirm';
import manufacturing from './manufacturing';
import custom from './custom';

// Registry of demo verticals shown in the "Generate Demo Data" picker. Each
// entry pairs a content pack (the writing) with display metadata (the UI) —
// adding a new vertical means writing one pack file and adding one line here.
export const DEMO_CATEGORIES = [
  { key: 'lms', en: 'LMS', ar: 'نظام إدارة تعلم', icon: GraduationCap, pack: lms },
  { key: 'saas', en: 'SaaS', ar: 'برمجيات كخدمة', icon: Cloud, pack: saas },
  { key: 'medicalClinic', en: 'Medical Clinic', ar: 'عيادة طبية', icon: Stethoscope, pack: medicalClinic },
  { key: 'pharmacy', en: 'Pharmacy', ar: 'صيدلية', icon: Pill, pack: pharmacy },
  { key: 'restaurant', en: 'Restaurant', ar: 'مطعم', icon: UtensilsCrossed, pack: restaurant },
  { key: 'hotel', en: 'Hotel', ar: 'فندق', icon: BedDouble, pack: hotel },
  { key: 'realEstate', en: 'Real Estate', ar: 'عقارات', icon: Building2, pack: realEstate },
  { key: 'ecommerce', en: 'E-Commerce', ar: 'تجارة إلكترونية', icon: ShoppingBag, pack: ecommerce },
  { key: 'crm', en: 'CRM', ar: 'إدارة علاقات العملاء', icon: Users, pack: crm },
  { key: 'erp', en: 'ERP', ar: 'تخطيط موارد المؤسسة', icon: Boxes, pack: erp },
  { key: 'aiPlatform', en: 'AI Platform', ar: 'منصة ذكاء اصطناعي', icon: Sparkles, pack: aiPlatform },
  { key: 'portfolioSite', en: 'Portfolio', ar: 'معرض أعمال', icon: Palette, pack: portfolioSite },
  { key: 'gym', en: 'Gym', ar: 'نادي رياضي', icon: Dumbbell, pack: gym },
  { key: 'lawFirm', en: 'Law Firm', ar: 'مكتب محاماة', icon: Scale, pack: lawFirm },
  { key: 'manufacturing', en: 'Manufacturing', ar: 'تصنيع', icon: Factory, pack: manufacturing },
  { key: 'custom', en: 'Custom', ar: 'مخصص', icon: Wand2, pack: custom },
];

const REGISTRY = Object.fromEntries(DEMO_CATEGORIES.map((c) => [c.key, c.pack]));

/** Generates a complete, realistic demo project for the given category key. */
export const generateDemoProject = (categoryKey) => {
  const pack = REGISTRY[categoryKey];
  if (!pack) throw new Error(`Unknown demo category: ${categoryKey}`);
  return buildDemoProject(pack);
};
