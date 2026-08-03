/**
 * Robust Blog Utility for Multilingual Content Extraction & Fallbacks
 * Supports Legacy schema, Multilingual object schema, and Hybrid schema.
 */

export const getLocalizedField = (field, lang = 'en', fallbackLang = 'en') => {
  if (field === null || field === undefined) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  
  if (typeof field === 'object') {
    const primary = field[lang];
    if (primary && typeof primary === 'string' && primary.trim()) return primary;

    const secondary = field[fallbackLang];
    if (secondary && typeof secondary === 'string' && secondary.trim()) return secondary;

    const otherLang = lang === 'ar' ? 'en' : 'ar';
    const tertiary = field[otherLang];
    if (tertiary && typeof tertiary === 'string' && tertiary.trim()) return tertiary;

    const firstVal = Object.values(field).find(v => typeof v === 'string' && v.trim());
    if (firstVal) return firstVal;
  }

  return '';
};

export const getLocalizedPost = (post, lang = 'en') => {
  if (!post) return null;

  const isRTL = lang === 'ar';
  
  // 1. Slug (EN & AR fallback)
  let slug = '';
  if (typeof post.slug === 'object' && post.slug !== null) {
    slug = post.slug[lang] || post.slug.en || post.slug.ar || '';
  } else if (typeof post.slug === 'string') {
    slug = post.slug;
  }

  // 2. Title
  let title = '';
  if (isRTL && post.titleAr && typeof post.titleAr === 'string' && post.titleAr.trim()) {
    title = post.titleAr;
  } else {
    title = getLocalizedField(post.title, lang, 'en');
  }

  // 3. Excerpt
  let excerpt = '';
  if (isRTL && post.excerptAr && typeof post.excerptAr === 'string' && post.excerptAr.trim()) {
    excerpt = post.excerptAr;
  } else {
    excerpt = getLocalizedField(post.excerpt, lang, 'en');
  }

  // 4. SEO Title & Description
  let seoTitle = isRTL && post.seoTitleAr ? post.seoTitleAr : getLocalizedField(post.seoTitle, lang, 'en');
  if (!seoTitle) seoTitle = title;

  let seoDescription = isRTL && post.seoDescriptionAr ? post.seoDescriptionAr : getLocalizedField(post.seoDescription, lang, 'en');
  if (!seoDescription) seoDescription = excerpt;

  // 5. Tags
  let tags = [];
  if (isRTL && post.tagsAr && Array.isArray(post.tagsAr) && post.tagsAr.length > 0) {
    tags = post.tagsAr;
  } else if (post.tags) {
    if (Array.isArray(post.tags)) {
      tags = post.tags;
    } else if (typeof post.tags === 'object') {
      tags = post.tags[lang] || post.tags.en || post.tags.ar || [];
    }
  }

  // 6. Author
  const authorName = isRTL
    ? (post.author?.nameAr || post.authorNameAr || post.author?.name || post.authorName || 'فريق يانسي تك')
    : (post.author?.name || post.authorName || 'YANSY Tech Team');

  const authorRole = isRTL
    ? (post.author?.roleAr || post.authorRoleAr || post.author?.role || post.authorRole || 'خبير تطوير برمجيات')
    : (post.author?.role || post.authorRole || 'Senior Software Architect');

  const authorAvatar = post.author?.avatar || post.authorAvatar || '/placeholders/author-default.webp';

  // 7. Content Normalization & Heading ID Mapping for TOC
  let rawContent = post.content;
  if (isRTL && post.contentAr && Array.isArray(post.contentAr) && post.contentAr.length > 0) {
    rawContent = post.contentAr;
  } else if (rawContent && typeof rawContent === 'object' && !Array.isArray(rawContent)) {
    rawContent = rawContent[lang] || rawContent.en || rawContent.ar || [];
  }

  let headingCounter = 0;

  const contentBlocks = (Array.isArray(rawContent) ? rawContent : []).map((block, idx) => {
    if (typeof block === 'string') {
      return { type: 'paragraph', text: block, id: `block-${idx}` };
    }

    if (!block || typeof block !== 'object') {
      return { type: 'paragraph', text: '', id: `block-${idx}` };
    }

    // Legacy section block: { heading, body, headingAr, bodyAr, code, quote, list, image }
    if (block.heading || block.headingAr || block.body || block.bodyAr) {
      let heading = isRTL && block.headingAr ? block.headingAr : getLocalizedField(block.heading, lang, 'en');
      let body = isRTL && block.bodyAr ? block.bodyAr : getLocalizedField(block.body, lang, 'en');
      
      const headingId = heading ? `heading-${headingCounter++}` : `block-${idx}`;

      return {
        type: 'section',
        id: headingId,
        heading,
        body,
        code: block.code,
        language: block.language || 'javascript',
        quote: isRTL && block.quoteAr ? block.quoteAr : block.quote,
        quoteAuthor: block.quoteAuthor || block.author,
        list: isRTL && block.listAr ? block.listAr : (Array.isArray(block.list) ? block.list : (Array.isArray(block.items) ? block.items : null)),
        image: block.image,
      };
    }

    // Standardized block types
    const blockHeading = isRTL && block.headingAr ? block.headingAr : getLocalizedField(block.heading || block.text, lang, 'en');
    const blockId = (block.type === 'heading' || block.type === 'h2' || block.type === 'h3' || blockHeading)
      ? `heading-${headingCounter++}`
      : `block-${idx}`;

    return {
      ...block,
      id: blockId,
      heading: blockHeading,
      text: isRTL && block.textAr ? block.textAr : getLocalizedField(block.text || block.body, lang, 'en'),
      caption: isRTL && block.captionAr ? block.captionAr : getLocalizedField(block.caption, lang, 'en'),
      items: isRTL && block.itemsAr ? block.itemsAr : (Array.isArray(block.items) ? block.items : (Array.isArray(block.list) ? block.list : [])),
    };
  });

  // Reading time
  let readTime = 5;
  if (typeof post.readTime === 'object' && post.readTime !== null) {
    readTime = post.readTime[lang] || post.readTime.en || post.readTime.ar || 5;
  } else if (typeof post.readTime === 'number') {
    readTime = post.readTime;
  }

  return {
    ...post,
    _id: post._id || post.id || slug,
    slug,
    title,
    excerpt,
    seoTitle,
    seoDescription,
    tags,
    category: post.category || 'web-development',
    author: {
      name: authorName,
      role: authorRole,
      avatar: authorAvatar,
    },
    content: contentBlocks,
    coverImage: post.coverImage || post.image || '/placeholders/blog-default.webp',
    readTime,
    publishDate: post.publishDate || post.createdAt || '2025-04-15',
  };
};

/**
 * Calculate reading time in minutes based on text length
 */
export const calculateReadingTime = (text = '', lang = 'en') => {
  const wordsPerMinute = lang === 'ar' ? 180 : 220;
  const words = (text || '').trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};
