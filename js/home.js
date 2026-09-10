/**
 * home.js
 * الصفحة الرئيسية (مركز التحكم): تعرض الفصول والدروس وحالتها،
 * وتتيح الوصول لأدوات المراجعة الشاملة عبر كل المنهج. كل شيء
 * هنا مبني من data/curriculum.js + data/lessons/*.js — لا يوجد
 * محتوى مكتوب مباشرة هنا.
 */

function homeLessonCardLabel(lesson) {
  return LESSONS[lesson.meta.id] ? (lesson.meta.shortTitle || lesson.meta.title) : "";
}

function renderHome() {
  const root = document.getElementById("homeScreen");
  root.innerHTML = "";

  const progress = loadProgress();
  const totalReady = curriculumTotalReadyCount();
  const totalAll = curriculumTotalCount();

  // ---------- الرأس ----------
  const header = el("div", { class: "home-header" });
  header.appendChild(el("p", { class: "eyebrow", text: CURRICULUM.subtitle }));
  header.appendChild(el("h1", { class: "home-title", text: CURRICULUM.title }));

  const progressRow = el("div", { class: "home-progress-row" }, [
    el("div", { class: "home-progress-track" }, [
      el("div", { class: "home-progress-fill", attrs: { style: `width:${Math.round((totalReady / totalAll) * 100)}%` } })
    ]),
    el("span", { class: "home-progress-label", text: `${totalReady} من ${totalAll} دروس متاحة` })
  ]);
  header.appendChild(progressRow);

  if (progress.lastVisited && curriculumIsLessonReady(progress.lastVisited)) {
    const lastLesson = LESSONS[progress.lastVisited];
    header.appendChild(el("button", {
      class: "btn btn-primary home-continue-btn",
      html: `<span>متابعة آخر درس: ${lastLesson.meta.shortTitle || lastLesson.meta.title}</span><span>←</span>`,
      on: { click: () => navigateTo(`#/lesson/${progress.lastVisited}`) }
    }));
  }
  root.appendChild(header);

  // ---------- الفصول ----------
  CURRICULUM.chapters.forEach(chapter => {
    root.appendChild(renderChapterSection(chapter));
  });

  // ---------- المنهج كاملًا ----------
  root.appendChild(renderCurriculumWideSection());
}

function renderChapterSection(chapter) {
  const section = el("div", { class: "chapter-section" });
  section.appendChild(el("h2", { class: "chapter-heading", text: chapter.title }));

  const grid = el("div", { class: "lesson-cards-grid" });
  chapter.lessons.forEach((lessonMeta, idx) => {
    grid.appendChild(renderLessonCard(lessonMeta, idx + 1));
  });
  section.appendChild(grid);

  // بطاقة مراجعة الفصل
  const complete = curriculumIsChapterComplete(chapter.id);
  const readyCount = curriculumChapterReadyLessons(chapter.id).length;
  const reviewCard = el("div", { class: `chapter-review-card ${complete ? "" : "locked"}` });
  reviewCard.appendChild(el("div", { class: "chapter-review-icon", text: "🧠" }));
  reviewCard.appendChild(el("div", { class: "chapter-review-info" }, [
    el("h3", { text: `مراجعة ${chapter.title}` }),
    el("p", { text: complete ? "مراجعة متكاملة لدروس الفصل الأربعة معًا." : `تُفتح تلقائيًا بعد اكتمال دروس الفصل (${readyCount} من ${chapter.lessons.length} الآن).` })
  ]));
  if (complete) {
    reviewCard.appendChild(el("button", { class: "btn btn-primary", text: "ابدأ المراجعة", on: { click: () => navigateTo(`#/chapter/${chapter.id}/review`) } }));
  } else {
    reviewCard.appendChild(el("span", { class: "locked-badge", text: "🔒 قريبًا" }));
  }
  section.appendChild(reviewCard);

  return section;
}

function renderLessonCard(lessonMeta, orderInChapter) {
  const ready = curriculumIsLessonReady(lessonMeta.id);
  const progress = loadProgress();
  const card = el("div", { class: `lesson-card ${ready ? "" : "locked"}` });

  if (!ready) {
    card.appendChild(el("div", { class: "lesson-card-icon", text: "🔒" }));
    card.appendChild(el("h3", { text: `الدرس ${arabicOrdinalWord(orderInChapter)}` }));
    card.appendChild(el("p", { class: "lesson-card-status", text: "لم يُضَف بعد" }));
    return card;
  }

  const lesson = LESSONS[lessonMeta.id];
  const visited = !!progress.visited[lessonMeta.id];
  const bestScore = progress.quizBest[lessonMeta.id];

  card.appendChild(el("div", { class: "lesson-card-icon", text: lesson.meta.icon || "📖" }));
  card.appendChild(el("h3", { text: lesson.meta.title }));
  card.appendChild(el("p", { class: "lesson-card-status", text: lesson.meta.subtitle }));

  const meta = el("div", { class: "lesson-card-meta" });
  if (visited) meta.appendChild(el("span", { class: "lesson-tag visited", text: "✓ تمت الزيارة" }));
  if (typeof bestScore === "number") meta.appendChild(el("span", { class: "lesson-tag score", text: `أفضل نتيجة: ${bestScore}%` }));
  card.appendChild(meta);

  card.addEventListener("click", () => navigateTo(`#/lesson/${lessonMeta.id}`));
  return card;
}

function arabicOrdinalWord(n) {
  const words = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن"];
  return words[n] || String(n);
}

function renderCurriculumWideSection() {
  const section = el("div", { class: "chapter-section curriculum-wide" });
  section.appendChild(el("h2", { class: "chapter-heading", text: "🔥 المنهج كاملًا" }));

  const full = curriculumIsFullCurriculumComplete();
  const totalReady = curriculumTotalReadyCount();
  const totalAll = curriculumTotalCount();

  const grid = el("div", { class: "curriculum-tools-grid" });

  grid.appendChild(renderToolCard({
    icon: "🧠", title: "المراجعة الشاملة", desc: full ? "خريطة المنهج كاملًا وأهم الأفكار والعلاقات بين الفصول." : `تُفتح تلقائيًا بعد اكتمال المنهج (${totalReady} من ${totalAll} الآن).`,
    locked: !full, action: () => navigateTo("#/curriculum/review")
  }));
  grid.appendChild(renderToolCard({
    icon: "📝", title: "الاختبار الشامل", desc: full ? "اختبار واحد يغطي دروس المنهج الثمانية." : `تُفتح تلقائيًا بعد اكتمال المنهج (${totalReady} من ${totalAll} الآن).`,
    locked: !full, action: () => navigateTo("#/curriculum/exam")
  }));
  grid.appendChild(renderToolCard({
    icon: "🃏", title: "المراجعة بالبطاقات", desc: `بطاقات من كل الدروس المتاحة حاليًا (${totalReady} من ${totalAll}).`,
    locked: totalReady === 0, action: () => navigateTo("#/global/flashcards")
  }));
  grid.appendChild(renderToolCard({
    icon: "🚨", title: "مراجعة الأخطاء", desc: "كل الأخطاء التي سجّلتها عبر كل الدروس، في مكان واحد.",
    locked: false, action: () => navigateTo("#/global/mistakes")
  }));

  section.appendChild(grid);
  return section;
}

function renderToolCard({ icon, title, desc, locked, action }) {
  const card = el("div", { class: `tool-card ${locked ? "locked" : ""}` });
  card.appendChild(el("div", { class: "tool-card-icon", text: icon }));
  card.appendChild(el("h3", { text: title }));
  card.appendChild(el("p", { text: desc }));
  if (locked) {
    card.appendChild(el("span", { class: "locked-badge", text: "🔒 قريبًا" }));
  } else {
    card.appendChild(el("button", { class: "btn btn-primary", text: "فتح", on: { click: action } }));
  }
  return card;
}

// ============================= 🚨 بنك الأخطاء الشامل =============================
function renderGlobalMistakes() {
  const wrap = document.getElementById("globalContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🚨 بنك الأخطاء — كل المنهج" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "كل الأسئلة التي أخطأت فيها عبر كل الدروس، مجمّعة هنا." }));

  const list = loadAllMistakes();
  if (list.length === 0) {
    wrap.appendChild(el("div", { class: "empty-state" }, [
      el("div", { class: "icon", text: "🌙" }),
      el("p", { text: "لا توجد أخطاء محفوظة حتى الآن في أي درس." })
    ]));
    return;
  }

  // تجميع حسب الدرس
  const byLesson = {};
  list.forEach(m => {
    if (!byLesson[m.lessonId]) byLesson[m.lessonId] = [];
    byLesson[m.lessonId].push(m);
  });

  Object.entries(byLesson).forEach(([lessonId, items]) => {
    const block = el("div", { class: "topic-block" });
    block.appendChild(el("h3", { class: "topic-title" }, [
      el("span", { class: "num", text: "🔖" }),
      el("span", { text: items[0].lessonTitle || lessonId })
    ]));
    items.slice().reverse().forEach(m => {
      const item = el("div", { class: `mistake-item ${m.mastered ? "mastered" : ""}` });
      if (m.mastered) item.appendChild(el("span", { class: "mistake-badge", text: "✔ تم إتقانه" }));
      item.appendChild(el("p", { class: "mistake-q", text: m.question }));
      item.appendChild(el("p", { class: "mistake-a", text: `الإجابة الصحيحة: ${m.correctAnswer}` }));
      if (m.explanation) item.appendChild(el("p", { class: "mistake-exp", text: m.explanation }));
      const actions = el("div", { class: "mistake-actions" });
      if (!m.mastered) {
        actions.appendChild(el("button", {
          class: "btn btn-outline", text: "تم إتقانه ✔",
          on: { click: () => { toggleMistakeMastered(m.lessonId, m.qid); renderGlobalMistakes(); showToast("أحسنت! تم تمييزه كمتقَن"); } }
        }));
      }
      actions.appendChild(el("button", {
        class: "btn btn-danger", text: "حذف 🗑",
        on: { click: () => { deleteMistake(m.lessonId, m.qid); renderGlobalMistakes(); showToast("تم حذف الخطأ من البنك"); } }
      }));
      item.appendChild(actions);
      block.appendChild(item);
    });
    wrap.appendChild(block);
  });
}

// ============================= 🃏 بطاقات مراجعة شاملة =============================
var globalFlashDeck = [];
var globalFlashIndex = 0;

function renderGlobalFlashcards() {
  const wrap = document.getElementById("globalContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🃏 المراجعة بالبطاقات — كل المنهج" }));

  globalFlashDeck = [];
  curriculumAllLessonIds().forEach(id => {
    if (!curriculumIsLessonReady(id)) return;
    const lesson = LESSONS[id];
    lesson.flashcards.forEach(f => globalFlashDeck.push(Object.assign({}, f, { lessonTitle: lesson.meta.shortTitle || lesson.meta.title })));
  });

  if (globalFlashDeck.length === 0) {
    wrap.appendChild(el("div", { class: "empty-state" }, [
      el("div", { class: "icon", text: "🌙" }),
      el("p", { text: "لا توجد دروس متاحة بعد لعرض بطاقاتها." })
    ]));
    return;
  }

  globalFlashIndex = 0;
  const toolbar = el("div", { class: "flash-toolbar" }, [
    el("span", { class: "flash-counter", attrs: { id: "globalFlashCounter" } }),
    el("button", { class: "btn btn-outline", text: "خلط البطاقات 🔀", on: { click: shuffleGlobalFlashcards } })
  ]);
  wrap.appendChild(toolbar);
  wrap.appendChild(el("div", { class: "flash-stage", attrs: { id: "globalFlashStage" } }));
  wrap.appendChild(el("p", { class: "flash-hint", text: "اضغط على البطاقة لقلبها ورؤية الإجابة" }));
  wrap.appendChild(el("div", { class: "flash-nav" }, [
    el("button", { class: "btn btn-outline", text: "السابق ←", on: { click: () => moveGlobalFlash(1) } }),
    el("button", { class: "btn btn-primary", text: "→ التالي", on: { click: () => moveGlobalFlash(-1) } })
  ]));

  drawGlobalFlashcard();
}

function shuffleGlobalFlashcards() {
  for (let i = globalFlashDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [globalFlashDeck[i], globalFlashDeck[j]] = [globalFlashDeck[j], globalFlashDeck[i]];
  }
  globalFlashIndex = 0;
  drawGlobalFlashcard();
  showToast("تم خلط البطاقات");
}

function moveGlobalFlash(dir) {
  const n = globalFlashDeck.length;
  globalFlashIndex = (globalFlashIndex + (dir === -1 ? 1 : -1) + n) % n;
  drawGlobalFlashcard();
}

function drawGlobalFlashcard() {
  const stage = document.getElementById("globalFlashStage");
  const counter = document.getElementById("globalFlashCounter");
  if (!stage) return;
  const card = globalFlashDeck[globalFlashIndex];
  counter.textContent = `بطاقة ${globalFlashIndex + 1} من ${globalFlashDeck.length} — ${card.lessonTitle}`;
  stage.innerHTML = "";
  const flip = el("div", { class: "flash-card", attrs: { id: "globalFlashCardInner" } }, [
    el("div", { class: "flash-face flash-front" }, [
      el("span", { class: "flash-type", text: `${card.type} · ${card.lessonTitle}` }),
      el("p", { class: "q", text: card.question })
    ]),
    el("div", { class: "flash-face flash-back" }, [
      el("span", { class: "flash-type", text: "الإجابة" }),
      el("p", { class: "a", text: card.answer }),
      card.explanation ? el("p", { class: "exp", text: card.explanation }) : null
    ])
  ]);
  flip.addEventListener("click", () => flip.classList.toggle("flipped"));
  stage.appendChild(flip);
}

// ============================= صفحات "قريبًا" (مراجعة الفصل / المنهج قبل اكتمالها) =============================
function renderLockedPlaceholder(title, message) {
  const wrap = document.getElementById("globalContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: title }));
  wrap.appendChild(el("div", { class: "empty-state" }, [
    el("div", { class: "icon", text: "🔒" }),
    el("p", { text: message })
  ]));
}
