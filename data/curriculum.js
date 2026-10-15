/**
 * curriculum.js
 * يعرّف بنية المنهج كاملة: الفصول ودروسها، وحالة كل درس
 * (متاح / لم يُضَف بعد)، وشروط فتح مراجعة الفصل والمراجعة
 * الشاملة. هذا الملف هو مصدر الحقيقة الوحيد لبنية التنقل —
 * لا تُبنى صفحة الرئيسية من أي مكان آخر.
 *
 * لإضافة درس جديد لاحقًا:
 *   1) أنشئ data/lessons/lessonX.js بنفس بنية lesson1.js.
 *   2) أضف <script> له في index.html بعد الدروس السابقة.
 *   3) غيّر available إلى true هنا لهذا الدرس فقط.
 * لا تحتاج لتعديل أي كود عرض آخر.
 */
var CURRICULUM = {
  title: "دفتر المراجعة التاريخي",
  subtitle: "منصة المراجعة التفاعلية لمادة التاريخ",
  chapters: [
    {
      id: "chapter1",
      title: "الفصل الأول",
      lessons: [
        { id: "lesson1", available: true },
        { id: "lesson2", available: true },
        { id: "lesson3", available: true },
        { id: "lesson4", available: true }
      ]
    },
    {
      id: "chapter2",
      title: "الفصل الثاني",
      lessons: [
        { id: "lesson5", available: true },
        { id: "lesson6", available: false },
        { id: "lesson7", available: false },
        { id: "lesson8", available: false }
      ]
    }
  ]
};

// ---------- دوال مساعدة عامة (لا تُعدَّل، تُستخدم من home.js وrouter.js) ----------

function curriculumAllLessonIds() {
  return CURRICULUM.chapters.flatMap(c => c.lessons.map(l => l.id));
}

function curriculumChapterOf(lessonId) {
  return CURRICULUM.chapters.find(c => c.lessons.some(l => l.id === lessonId));
}

function curriculumLessonMeta(lessonId) {
  for (const c of CURRICULUM.chapters) {
    const found = c.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return null;
}

function curriculumIsLessonReady(lessonId) {
  const meta = curriculumLessonMeta(lessonId);
  return !!(meta && meta.available && typeof LESSONS !== "undefined" && LESSONS[lessonId]);
}

function curriculumChapterReadyLessons(chapterId) {
  const chapter = CURRICULUM.chapters.find(c => c.id === chapterId);
  if (!chapter) return [];
  return chapter.lessons.filter(l => curriculumIsLessonReady(l.id));
}

function curriculumIsChapterComplete(chapterId) {
  const chapter = CURRICULUM.chapters.find(c => c.id === chapterId);
  if (!chapter) return false;
  return chapter.lessons.every(l => curriculumIsLessonReady(l.id));
}

function curriculumIsFullCurriculumComplete() {
  return CURRICULUM.chapters.every(c => curriculumIsChapterComplete(c.id));
}

function curriculumTotalReadyCount() {
  return curriculumAllLessonIds().filter(curriculumIsLessonReady).length;
}

function curriculumTotalCount() {
  return curriculumAllLessonIds().length;
}
