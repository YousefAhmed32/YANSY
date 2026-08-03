const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../client/src/data/blogPosts.js');
let source = fs.readFileSync(targetFile, 'utf8');

// Translations map for all categories
const CATEGORIES_AR = {
  'web-development': { labelAr: 'تطوير الويب' },
  'saas': { labelAr: 'برمجيات SaaS' },
  'product-design': { labelAr: 'تصميم المنتج' },
  'ecommerce': { labelAr: 'التجارة الإلكترونية' },
  'startup-growth': { labelAr: 'نمو الشركات الناشئة' },
  'business-automation': { labelAr: 'أتمتة الأعمال' }
};

// Generic Arabic translation generator for any post that lacks titleAr/excerptAr
const generateArabicPostData = (post) => {
  const title = post.title || '';
  const excerpt = post.excerpt || '';
  const category = post.category || 'web-development';

  // Translate common patterns
  let titleAr = post.titleAr || '';
  let excerptAr = post.excerptAr || '';

  if (!titleAr) {
    if (title.includes('React')) titleAr = title.replace('How We Build High-Performance React Applications in 2025', 'كيف نبني تطبيقات React عالية الأداء لعام 2025').replace('React vs', 'مقارنة بين React و');
    else if (title.includes('Next.js')) titleAr = 'دليل أطر العمل المعاصرة بـ Next.js';
    else if (title.includes('SaaS')) titleAr = 'كيفية بناء وتطوير منصات SaaS الناجحة';
    else if (title.includes('E-Commerce') || title.includes('Shopify')) titleAr = 'استراتيجيات تطوير المتاجر الإلكترونية لزيادة المبيعات';
    else if (title.includes('Design') || title.includes('UI/UX')) titleAr = 'مبادئ تصميم الواجهات والتجربة الرقمية الممتازة';
    else if (title.includes('Automation') || title.includes('AI')) titleAr = 'أتمتة العمليات التجارية باستخدام الذكاء الاصطناعي';
    else titleAr = `استراتيجيات ${CATEGORIES_AR[category]?.labelAr || 'التطوير البرمجي'} والحلول الرقمية`;
  }

  if (!excerptAr) {
    excerptAr = `دليل شامل وعملي من فريق YANSY Tech حول ${titleAr}، يستعرض أفضل الممارسات الهندسية والتصميمية لتحقيق أفضل نتائج لأعمالك.`;
  }

  return { titleAr, excerptAr };
};

console.log('Blog posts data ready for direct localization handling in blogUtils.js');
