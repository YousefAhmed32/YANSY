import { forwardRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import RelationPicker from './RelationPicker';

const QUICK_CREATE_FIELDS = [
  { key: 'name', label: 'Name (English)', labelAr: 'الاسم (إنجليزي)', required: true, dir: 'ltr' },
  { key: 'nameAr', label: 'Name (Arabic)', labelAr: 'الاسم (عربي)', dir: 'rtl' },
];

// Keep both portfolio editors on the same reusable category library.
// Forward Field's id/error/ref so publish validation can still focus this picker.
const CategoryPicker = forwardRef((props, ref) => {
  const { isRTL } = useLanguage();
  return (
    <RelationPicker
      {...props}
      ref={ref}
      apiBase="/categories"
      displayField={(item) => isRTL ? item?.nameAr || item?.name : item?.name || item?.nameAr}
      placeholder={isRTL ? 'ابحث عن فئة أو أضف فئة جديدة…' : 'Search categories or add a new one…'}
      quickCreateFields={QUICK_CREATE_FIELDS}
      createTitle={{ ar: 'إضافة فئة جديدة', en: 'Add new category' }}
      createLabel={isRTL ? 'إضافة فئة جديدة' : 'Add new category'}
      createDescription={isRTL
        ? 'أضف أي فئة تحتاجها، مثل Sport. ستُختار للمشروع الحالي وتُحفظ في مكتبة الفئات لاستخدامها في مشاريع أخرى.'
        : 'Add any category you need, such as Sport. It will be selected for this project and saved in the category library for other projects.'}
    />
  );
});

CategoryPicker.displayName = 'CategoryPicker';

export default CategoryPicker;
