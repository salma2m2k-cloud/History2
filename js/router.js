/**
 * router.js
 * الموجّه الرئيسي للتطبيق. يقرر أي "شاشة" تظهر بناءً على الـ hash:
 *   #/home                          -> الصفحة الرئيسية
 *   #/lesson/<id>[/<section>]       -> شاشة الدرس (نفس تجربة الدرس الأول كاملة)
 *   #/global/mistakes               -> بنك الأخطاء الشامل
 *   #/global/flashcards             -> المراجعة بالبطاقات الشاملة
 *   #/chapter/<id>/review           -> مراجعة الفصل (تُفتح فقط عند اكتمال الفصل)
 *   #/curriculum/review|exam        -> مراجعة/اختبار المنهج كامل (يُفتح فقط عند اكتمال 8 دروس)
 */

function navigateTo(hash) {
  if (location.hash === hash) { handleRoute(); return; }
  location.hash = hash;
  // لا نعتمد فقط على حدث hashchange (قد يتأخر أو لا يُطلق في بعض البيئات) —
  // نستدعي المعالج مباشرة لضمان استجابة فورية دائمًا.
  handleRoute();
}

function goHome() {
  navigateTo("#/home");
}

function showScreen(name) {
  document.getElementById("homeScreen").classList.toggle("active", name === "home");
  document.getElementById("lessonScreen").classList.toggle("active", name === "lesson");
  document.getElementById("globalScreen").classList.toggle("active", name === "global");
  window.scrollTo(0, 0);
}

function handleRoute() {
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

  if (parts[0] === "lesson" && parts[1]) {
    const lessonId = parts[1];
    const section = parts[2];
    if (curriculumIsLessonReady(lessonId)) {
      showScreen("lesson");
      initLessonApp(lessonId, section);
      return;
    }
    goHome();
    return;
  }

  if (parts[0] === "global" && parts[1] === "mistakes") {
    showScreen("global");
    renderGlobalMistakes();
    return;
  }

  if (parts[0] === "global" && parts[1] === "flashcards") {
    showScreen("global");
    renderGlobalFlashcards();
    return;
  }

  if (parts[0] === "chapter" && parts[1] && parts[2] === "review") {
    const chapterId = parts[1];
    const reviewId = chapterId + "-review";
    if (curriculumIsChapterComplete(chapterId) && typeof LESSONS !== "undefined" && LESSONS[reviewId]) {
      showScreen("lesson");
      initLessonApp(reviewId, parts[3]);
      return;
    }
    if (curriculumIsChapterComplete(chapterId)) {
      showScreen("global");
      const chapter = CURRICULUM.chapters.find(c => c.id === chapterId);
      renderLockedPlaceholder(`🧠 مراجعة ${chapter ? chapter.title : ""}`, "مراجعة الفصل قيد الإعداد بعد اكتمال دروسه الأربعة — سيتم بناؤها قريبًا.");
      return;
    }
    goHome();
    return;
  }

  if (parts[0] === "curriculum" && (parts[1] === "review" || parts[1] === "exam")) {
    if (curriculumIsFullCurriculumComplete()) {
      showScreen("global");
      renderLockedPlaceholder(
        parts[1] === "review" ? "🧠 المراجعة الشاملة للمنهج" : "📝 الاختبار الشامل",
        "أداة المراجعة الشاملة قيد الإعداد بعد اكتمال دروس المنهج الثمانية."
      );
      return;
    }
    goHome();
    return;
  }

  // الافتراضي: الصفحة الرئيسية
  showScreen("home");
  renderHome();
}

window.addEventListener("hashchange", handleRoute);
document.addEventListener("DOMContentLoaded", handleRoute);

document.addEventListener("click", (e) => {
  const homeBtn = e.target.closest && e.target.closest("[data-go-home]");
  if (homeBtn) goHome();
  const globalBackBtn = e.target.closest && e.target.closest("[data-global-back]");
  if (globalBackBtn) goHome();
});
