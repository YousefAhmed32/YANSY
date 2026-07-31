export default {
  category: 'Other',
  industry: 'Manufacturing — Production Monitoring & Downtime Tracking',

  clients: [
    { name: 'Sterling Precision Parts', nameAr: 'ستيرلينج للقطع الدقيقة', location: 'Detroit, USA', locationAr: 'ديترويت، الولايات المتحدة' },
    { name: 'Al-Fanar Industries', nameAr: 'صناعات الفنار', location: 'Sharjah, UAE', locationAr: 'الشارقة، الإمارات العربية المتحدة' },
  ],

  titleTemplate: '{client} — Production Monitoring & Downtime Dashboard',
  titleTemplateAr: 'لوحة تحكم مراقبة الإنتاج وتتبع التوقف لـ {clientAr}',
  tagline: 'A shop floor that finally knows why a machine is down, in real time, not the next morning.',
  taglineAr: 'أرضية مصنع أصبحت تعرف أخيرًا سبب توقف الآلة، لحظيًا لا في الصباح التالي.',

  description: '{client} tracked machine downtime on paper clipboards that got compiled into a report a full day later — by which point the cause of any given stoppage was already forgotten. We built a real-time production monitoring dashboard connected to shop-floor sensors, with instant downtime-reason logging and OEE tracking per machine.',
  descriptionAr: 'كانت {clientAr} تتبّع توقف الآلات على ألواح ورقية تُجمَّع في تقرير بعد يوم كامل — وبحلول ذلك الوقت يكون سبب أي توقف قد نُسي بالفعل. بنينا لوحة تحكم لمراقبة الإنتاج لحظيًا متصلة بأجهزة استشعار أرضية المصنع، مع تسجيل فوري لسبب التوقف وتتبع كفاءة المعدات (OEE) لكل آلة.',

  myRole: 'Systems engineering for the sensor data pipeline, and dashboard design for shop-floor and management views.',
  myRoleAr: 'هندسة الأنظمة لمسار بيانات أجهزة الاستشعار، وتصميم لوحة التحكم لعروض أرضية المصنع والإدارة.',

  goals: 'Replace paper-based downtime tracking with real-time data, help operators log the actual reason for a stoppage while it\'s fresh, and give plant managers accurate OEE numbers instead of estimates.',
  goalsAr: 'استبدال تتبع التوقف الورقي ببيانات لحظية، ومساعدة المشغّلين على تسجيل السبب الفعلي للتوقف وقت حدوثه، ومنح مديري المصنع أرقام كفاءة معدات دقيقة بدلاً من التقديرات.',

  painPoints: 'Downtime reasons were written on paper hours after the fact and often reconstructed from memory, machine utilization reports arrived a full day late, and there was no reliable way to tell whether a slowdown was a mechanical issue, a material shortage, or an operator break.',
  painPointsAr: 'كانت أسباب التوقف تُكتب على الورق بعد ساعات من حدوثها وغالبًا ما تُعاد بناؤها من الذاكرة، وكانت تقارير استخدام الآلات تصل متأخرة بيوم كامل، ولم تكن هناك طريقة موثوقة لمعرفة ما إذا كان التباطؤ عطلًا ميكانيكيًا أو نقصًا في المواد أو استراحة مشغّل.',

  challenge: 'The dashboard had to ingest sensor data from a mix of older and newer machines on the shop floor without a full equipment retrofit, and present it in a way operators — not just engineers — could act on in the moment a machine stopped.',
  challengeAr: 'كان على لوحة التحكم استيعاب بيانات أجهزة الاستشعار من مزيج من الآلات القديمة والحديثة في أرضية المصنع دون تجديد كامل للمعدات، وعرضها بطريقة يستطيع المشغّلون — لا المهندسون فقط — التصرف بناءً عليها لحظة توقف الآلة.',

  solution: 'We deployed lightweight retrofit sensors on older machines alongside native connectivity on newer ones, streaming everything into a unified real-time dashboard, a one-tap downtime-reason log for operators at the machine, and an OEE calculation engine that breaks performance into availability, performance, and quality per machine and shift.',
  solutionAr: 'نشرنا أجهزة استشعار خفيفة للتحديث على الآلات القديمة إلى جانب الاتصال الأصلي على الآلات الحديثة، مع بث كل البيانات إلى لوحة تحكم لحظية موحّدة، وتسجيل سبب توقف بضغطة واحدة للمشغّلين عند الآلة، ومحرك حساب كفاءة معدات (OEE) يقسّم الأداء إلى التوفر والأداء والجودة لكل آلة ووردية.',

  process: 'We instrumented one production line first to validate sensor reliability and the downtime-logging UX with real operators, then scaled the rollout line by line as shift supervisors saw the data hold up against what they knew was actually happening on the floor.',
  processAr: 'جهّزنا خط إنتاج واحد أولاً للتحقق من موثوقية أجهزة الاستشعار وتجربة تسجيل التوقف مع مشغّلين حقيقيين، ثم وسّعنا الطرح خطًا تلو الآخر بعد أن رأى مشرفو الورديات تطابق البيانات مع ما كانوا يعرفونه فعليًا يحدث في أرضية المصنع.',

  results: 'Overall equipment effectiveness (OEE) visibility went from a monthly estimate to a live, per-shift number, unplanned downtime dropped as root causes became identifiable in real time instead of the next day, and plant managers now catch recurring stoppage patterns within the same shift they occur.',
  resultsAr: 'انتقلت رؤية كفاءة المعدات الإجمالية (OEE) من تقدير شهري إلى رقم حي لكل وردية، وانخفض التوقف غير المخطط له بعد أن أصبحت الأسباب الجذرية قابلة للتحديد لحظيًا بدلاً من اليوم التالي، ويكتشف مديرو المصنع الآن أنماط التوقف المتكررة خلال نفس الوردية التي تحدث فيها.',

  metrics: [
    { label: 'Unplanned downtime', labelAr: 'التوقف غير المخطط له', value: '-27%', trend: 'down' },
    { label: 'OEE visibility lag', labelAr: 'تأخر رؤية كفاءة المعدات', value: 'Monthly → Live', trend: 'down' },
    { label: 'Downtime-reason logging rate', labelAr: 'معدل تسجيل سبب التوقف', value: '91%', trend: 'up' },
    { label: 'Avg. OEE across lines', labelAr: 'متوسط كفاءة المعدات عبر الخطوط', value: '+14 pts', trend: 'up' },
  ],

  performanceMetrics: [
    { label: 'Downtime-reason logging time', labelAr: 'وقت تسجيل سبب التوقف', before: '~10 min (paper, later)', after: '< 10 sec (at machine)' },
    { label: 'Report availability', labelAr: 'توفر التقرير', before: 'Next day', after: 'Real-time' },
    { label: 'Sensor data latency', labelAr: 'زمن استجابة بيانات الاستشعار', before: 'N/A', after: '< 2s' },
  ],

  faqs: [
    { question: 'Did older machines need full replacement to be monitored?', questionAr: 'هل احتاجت الآلات القديمة لاستبدال كامل لتُراقَب؟', answer: 'No — lightweight retrofit sensors were added to older equipment, while newer machines connected through their existing native interfaces.', answerAr: 'لا — أُضيفت أجهزة استشعار خفيفة للتحديث على المعدات القديمة، بينما اتصلت الآلات الحديثة عبر واجهاتها الأصلية الموجودة.' },
    { question: 'How do operators log a downtime reason?', questionAr: 'كيف يسجّل المشغّلون سبب التوقف؟', answer: 'A one-tap panel at the machine lets the operator select the reason (mechanical, material, changeover, break) the moment it happens.', answerAr: 'تتيح لوحة بضغطة واحدة عند الآلة للمشغّل اختيار السبب (ميكانيكي، مواد، تبديل، استراحة) لحظة حدوثه.' },
    { question: 'What does the OEE calculation account for?', questionAr: 'ماذا يأخذ حساب كفاءة المعدات (OEE) بعين الاعتبار؟', answer: 'It breaks performance into availability, performance, and quality per machine and shift, matching the standard industry OEE formula.', answerAr: 'يقسّم الأداء إلى التوفر والأداء والجودة لكل آلة ووردية، مطابقًا لمعادلة OEE المعيارية في الصناعة.' },
    { question: 'Can plant managers see trends across multiple lines?', questionAr: 'هل يمكن لمديري المصنع رؤية الاتجاهات عبر خطوط متعددة؟', answer: 'Yes — a management view rolls up OEE and downtime data across every monitored line for cross-line comparison.', answerAr: 'نعم — يجمّع عرض الإدارة بيانات كفاءة المعدات والتوقف عبر كل خط مُراقَب للمقارنة بين الخطوط.' },
  ],

  team: [
    { name: 'Trevor Sandberg', role: 'Product Manager', roleAr: 'مدير منتج' },
    { name: 'Nadia El-Amrani', role: 'Lead IoT/Backend Engineer', roleAr: 'مهندسة IoT/باكند رئيسية' },
    { name: 'Hana Kobayashi', role: 'UI/UX Designer', roleAr: 'مصممة واجهات وتجربة مستخدم' },
    { name: 'Peter Novak', role: 'QA & Field Engineer', roleAr: 'مهندس ضمان جودة وميداني' },
  ],

  testimonial: {
    quote: 'We used to argue about why a line went down using yesterday\'s paperwork. Now we settle it in the same shift, with real data instead of memory.',
    quoteAr: 'كنا نتجادل حول سبب توقف خط الإنتاج مستخدمين أوراق الأمس. الآن نحسم الأمر في نفس الوردية، ببيانات حقيقية بدلاً من الذاكرة.',
    author: 'Plant Operations Manager', role: 'Plant Operations Manager', roleAr: 'مدير عمليات المصنع',
  },

  tags: ['React', 'Node.js', 'MQTT', 'InfluxDB', 'Grafana', 'Docker', 'IoT', 'Production Monitoring', 'OEE Tracking'],
  duration: '17 weeks',
  teamSize: '4 people',

  businessValue: 'Real-time visibility into downtime root causes let {client} act on recurring mechanical and material issues within the same shift instead of the next day, directly recovering production hours that used to disappear into "unknown" on a paper log.',
  businessValueAr: 'سمحت الرؤية اللحظية لأسباب التوقف الجذرية لـ {clientAr} بالتصرف حيال المشكلات الميكانيكية والمواد المتكررة خلال نفس الوردية بدلاً من اليوم التالي، ما استرد مباشرة ساعات إنتاج كانت تختفي سابقًا تحت خانة "غير معروف" في السجل الورقي.',

  futureImprovements: 'Next: predictive maintenance alerts based on sensor trend anomalies, a mobile app for supervisors to check line status off the floor, and automated shift-handover reports generated from the live data.',
  futureImprovementsAr: 'التالي: تنبيهات صيانة تنبؤية بناءً على شذوذ اتجاهات أجهزة الاستشعار، تطبيق جوال للمشرفين لمتابعة حالة الخط خارج الأرضية، وتقارير تسليم وردية آلية تُولَّد من البيانات الحية.',

  highlightStats: [
    { value: '-27%', label: 'Unplanned downtime', labelAr: 'التوقف غير المخطط' },
    { value: '91%', label: 'Reason logging rate', labelAr: 'معدل تسجيل السبب' },
    { value: '+14', label: 'Avg. OEE points', labelAr: 'نقاط كفاءة المعدات' },
  ],

  gallerySuggestions: [
    { caption: 'Real-time production line status dashboard', captionAr: 'لوحة تحكم حالة خط الإنتاج لحظيًا' },
    { caption: 'One-tap downtime-reason logging panel at the machine', captionAr: 'لوحة تسجيل سبب التوقف بضغطة واحدة عند الآلة' },
    { caption: 'OEE breakdown view by machine and shift', captionAr: 'عرض تفصيل كفاءة المعدات حسب الآلة والوردية' },
    { caption: 'Retrofit sensor installed on an older machine', captionAr: 'جهاز استشعار تحديث مركّب على آلة قديمة' },
  ],

  metaTitle: '{client} Manufacturing Case Study — Real-Time Production Monitoring | YANSY Tech',
  metaDescription: 'How we built {client} a real-time production monitoring dashboard that cut unplanned downtime by 27%.',
};
