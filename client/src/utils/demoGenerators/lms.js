export default {
  category: 'Educational',
  industry: 'Learning Management Systems',

  clients: [
    { name: 'BrightPath Academy', nameAr: 'أكاديمية برايت باث', location: 'Austin, USA', locationAr: 'أوستن، الولايات المتحدة' },
    { name: 'Nexus Learning Institute', nameAr: 'معهد نيكسس للتعلم', location: 'Toronto, Canada', locationAr: 'تورونتو، كندا' },
  ],

  titleTemplate: '{client} — Learning Management Platform',
  titleTemplateAr: 'منصة إدارة تعلم لـ {clientAr}',
  tagline: 'A course platform that turns instructors into publishers and learners into finishers.',
  taglineAr: 'منصة تعليمية تحوّل المدرّبين إلى ناشرين والمتعلمين إلى منجزين.',

  description: '{client} needed to move hundreds of hours of instructor-led training online without losing the structure that made their in-person courses work. We built a full learning management system spanning course authoring, cohort scheduling, video lessons, quizzes, certificates, and progress analytics — used daily by instructors and thousands of learners.',
  descriptionAr: 'احتاجت {clientAr} إلى نقل مئات الساعات من التدريب الذي يقوده المدرّبون إلى الإنترنت دون فقدان البنية التي جعلت دوراتها الحضورية ناجحة. بنينا نظام إدارة تعلم متكاملاً يشمل تأليف الدورات، جدولة الأفواج، دروس الفيديو، الاختبارات، الشهادات، وتحليلات التقدم — يستخدمه المدرّبون وآلاف المتعلمين يوميًا.',

  myRole: 'Product strategy, full-stack engineering, and UX design for the learner and instructor experiences.',
  myRoleAr: 'استراتيجية المنتج، الهندسة الكاملة، وتصميم تجربة المستخدم لكل من المتعلم والمدرّب.',

  goals: 'Launch a branded LMS within one semester, support live and self-paced cohorts side by side, and give instructors a course builder simple enough to use without engineering support.',
  goalsAr: 'إطلاق نظام تعلم بعلامة {clientAr} الخاصة خلال فصل دراسي واحد، ودعم الأفواج المباشرة والذاتية جنبًا إلى جنب، ومنح المدرّبين أداة بناء دورات بسيطة بما يكفي للاستخدام دون دعم هندسي.',

  painPoints: 'Course content was scattered across shared drives, call recordings, and spreadsheets; instructors had no way to see who was actually finishing lessons, and learners kept losing their place between sessions.',
  painPointsAr: 'كان محتوى الدورات مبعثرًا بين مساحات تخزين مشتركة وتسجيلات المكالمات وجداول البيانات؛ ولم يكن لدى المدرّبين طريقة لمعرفة من ينهي الدروس فعليًا، وكان المتعلمون يفقدون مكانهم باستمرار بين الجلسات.',

  challenge: 'Course structure varies wildly between a 6-week bootcamp and a self-paced 40-hour certification — the platform had to model both without forcing instructors into one rigid template, while still producing consistent progress data for every course.',
  challengeAr: 'يختلف هيكل الدورات بشكل كبير بين معسكر تدريبي مدته 6 أسابيع وشهادة ذاتية التعلم مدتها 40 ساعة — كان على المنصة أن تُمثّل الحالتين دون إجبار المدرّبين على قالب واحد جامد، مع إنتاج بيانات تقدم متسقة لكل دورة.',

  solution: 'We designed a flexible course-tree model (modules → lessons → assessments) that supports cohort-based scheduling and self-paced unlocking from the same data structure, plus a drag-and-drop course builder, native video hosting with resume-from-last-position, auto-graded quizzes, and downloadable completion certificates.',
  solutionAr: 'صممنا نموذج شجرة دورات مرن (وحدات ← دروس ← تقييمات) يدعم الجدولة القائمة على الأفواج وفتح المحتوى الذاتي من نفس بنية البيانات، بالإضافة إلى أداة بناء دورات بالسحب والإفلات، واستضافة فيديو أصلية مع استئناف من آخر موضع، واختبارات تُصحَّح تلقائيًا، وشهادات إتمام قابلة للتنزيل.',

  process: 'We started with instructor shadowing sessions to map the real teaching workflow, shipped a single pilot course end-to-end in week three to validate the authoring flow with real content, then scaled to the full catalog with a phased rollout by department.',
  processAr: 'بدأنا بجلسات مراقبة للمدرّبين لرسم سير العمل التعليمي الفعلي، وأطلقنا دورة تجريبية واحدة كاملة في الأسبوع الثالث للتحقق من مسار التأليف بمحتوى حقيقي، ثم توسّعنا إلى الكتالوج الكامل بطرح تدريجي حسب القسم.',

  results: 'Course completion rates rose from an estimated 40% before launch to 78% within the first two cohorts, instructor course-setup time dropped from days to hours, and the platform now hosts the entire course catalog with zero reliance on third-party video tools.',
  resultsAr: 'ارتفعت معدلات إتمام الدورات من نحو 40% قبل الإطلاق إلى 78% خلال أول فوجين، وانخفض وقت إعداد الدورة من قبل المدرّب من أيام إلى ساعات، وتستضيف المنصة الآن الكتالوج الكامل دون أي اعتماد على أدوات فيديو خارجية.',

  metrics: [
    { label: 'Course completion rate', labelAr: 'معدل إتمام الدورات', value: '78%', trend: 'up' },
    { label: 'Active learners', labelAr: 'المتعلمون النشطون', value: '6,400+', trend: 'up' },
    { label: 'Instructor setup time', labelAr: 'وقت إعداد المدرّب', value: '-85%', trend: 'down' },
    { label: 'Avg. session length', labelAr: 'متوسط مدة الجلسة', value: '34 min', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Video start time', labelAr: 'زمن بدء تشغيل الفيديو', before: '4.1s', after: '0.8s' },
    { label: 'Lighthouse performance', labelAr: 'أداء Lighthouse', before: '58', after: '96' },
    { label: 'Quiz grading time', labelAr: 'وقت تصحيح الاختبارات', before: 'Manual, 2–3 days', after: 'Instant' },
  ],

  faqs: [
    { question: 'Does the platform support both live cohorts and self-paced courses?', questionAr: 'هل تدعم المنصة الأفواج المباشرة والدورات الذاتية معًا؟', answer: 'Yes — both run on the same course-tree model, so instructors can mix live sessions with self-paced modules inside one course.', answerAr: 'نعم — يعمل الاثنان على نفس نموذج شجرة الدورات، ما يتيح للمدرّبين مزج الجلسات المباشرة مع الوحدات الذاتية داخل دورة واحدة.' },
    { question: 'How is video content hosted?', questionAr: 'كيف يتم استضافة محتوى الفيديو؟', answer: 'Natively, with adaptive streaming and resume-from-last-position, so learners never lose their place between devices.', answerAr: 'بشكل أصلي، مع بث تكيفي واستئناف من آخر موضع، بحيث لا يفقد المتعلمون مكانهم بين الأجهزة.' },
    { question: 'Can instructors see who is falling behind?', questionAr: 'هل يمكن للمدرّبين معرفة من تأخر في التقدم؟', answer: "A cohort dashboard flags learners who haven't opened a lesson in five or more days, with one-click nudge emails.", answerAr: 'توضّح لوحة تحكم الفوج المتعلمين الذين لم يفتحوا درسًا منذ خمسة أيام أو أكثر، مع إمكانية إرسال تذكير بضغطة واحدة.' },
    { question: 'Are completion certificates verifiable?', questionAr: 'هل شهادات الإتمام قابلة للتحقق؟', answer: 'Each certificate has a unique verification URL that confirms the learner, course, and completion date.', answerAr: 'تحتوي كل شهادة على رابط تحقق فريد يؤكد اسم المتعلم والدورة وتاريخ الإتمام.' },
  ],

  team: [
    { name: 'Elena Marsh', role: 'Product Manager', roleAr: 'مديرة منتج' },
    { name: 'Tarek Aboul-Fotouh', role: 'Lead Full-Stack Engineer', roleAr: 'مهندس برمجيات رئيسي' },
    { name: 'Yuna Park', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Marcus Webb', role: 'QA Engineer', roleAr: 'مهندس ضمان الجودة' },
  ],

  testimonial: {
    quote: 'We went from juggling five different tools to one platform our instructors actually enjoy using — and our completion rates prove it.',
    quoteAr: 'انتقلنا من التعامل مع خمس أدوات مختلفة إلى منصة واحدة يستمتع مدرّبونا فعليًا باستخدامها — ومعدلات الإتمام تثبت ذلك.',
    author: 'Director of Academic Programs', role: 'Director of Academic Programs', roleAr: 'مديرة البرامج الأكاديمية',
  },

  tags: ['React', 'Node.js', 'MongoDB', 'Mux Video', 'WebSockets', 'Stripe', 'Learning Management System', 'Course Platform', 'EdTech'],
  duration: '14 weeks',
  teamSize: '4 people',

  businessValue: 'By replacing five disconnected tools with one owned platform, {client} cut recurring software spend while gaining first-party data on exactly how learners engage with every course — data it now uses to redesign underperforming modules instead of guessing.',
  businessValueAr: 'باستبدال خمس أدوات منفصلة بمنصة واحدة مملوكة، خفّضت {clientAr} إنفاقها المتكرر على البرمجيات مع الحصول على بيانات مباشرة حول كيفية تفاعل المتعلمين مع كل دورة — بيانات تستخدمها الآن لإعادة تصميم الوحدات ضعيفة الأداء بدلاً من التخمين.',

  futureImprovements: 'Next on the roadmap: AI-generated practice questions from lesson transcripts, a mobile app for offline lesson downloads, and cohort-vs-cohort analytics to compare instructor performance across semesters.',
  futureImprovementsAr: 'التالي في خارطة الطريق: أسئلة تدريبية مولّدة بالذكاء الاصطناعي من نصوص الدروس، تطبيق جوال لتنزيل الدروس دون اتصال، وتحليلات مقارنة بين الأفواج لقياس أداء المدرّبين عبر الفصول الدراسية.',

  highlightStats: [
    { value: '78%', label: 'Completion rate', labelAr: 'معدل الإتمام' },
    { value: '6,400+', label: 'Active learners', labelAr: 'متعلم نشط' },
    { value: '96', label: 'Lighthouse score', labelAr: 'نقاط Lighthouse' },
  ],

  gallerySuggestions: [
    { caption: 'Learner dashboard showing in-progress and completed courses', captionAr: 'لوحة تحكم المتعلم تعرض الدورات الجارية والمكتملة' },
    { caption: 'Instructor course builder — drag-and-drop module editor', captionAr: 'أداة بناء الدورات للمدرّب — محرر وحدات بالسحب والإفلات' },
    { caption: 'In-lesson video player with resume-from-last-position', captionAr: 'مشغل فيديو داخل الدرس مع خاصية الاستئناف من آخر موضع' },
    { caption: 'Downloadable certificate with verification link', captionAr: 'شهادة قابلة للتنزيل مع رابط تحقق' },
  ],

  metaTitle: '{client} LMS Case Study — Custom Learning Platform | YANSY Tech',
  metaDescription: 'How we built {client} a full learning management system — course authoring, video lessons, quizzes, and certificates — raising completion rates to 78%.',
};
