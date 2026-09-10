/**
 * lesson-app.js
 * محرك عرض الدرس — عام تمامًا، لا يحتوي على أي محتوى خاص بدرس
 * بعينه. يقرأ كل شيء من كائن الدرس الحالي (currentLesson)، الذي
 * يضبطه router.js عبر initLessonApp(lessonId) قبل أي استدعاء.
 * هذا هو نفس محرك العرض الذي بُني لأول مرة للدرس الأول، مع فروق
 * بسيطة فقط لجعله يعمل لأي درس ولإضافة تنقّل بين الدروس.
 */

const NAV_META_BASE = {
  "overview": { label: "نظرة عامة", icon: "🏠" },
  "full-content": { label: "المحتوى الكامل", icon: "📚" },
  "places": { label: "الأماكن", icon: "🗺️" },
  "cause-effect": { label: "السبب والنتيجة", icon: "🔗" },
  "why": { label: "لماذا؟", icon: "❓" },
  "comparisons": { label: "المقارنات", icon: "⚖️" },
  "relations-map": { label: "خريطة العلاقات", icon: "🧠" },
  "sequence": { label: "التسلسل التاريخي", icon: "🗓️" },
  "flashcards": { label: "بطاقات المراجعة", icon: "🃏" },
  "quiz": { label: "الاختبار", icon: "📝" },
  "mistakes": { label: "بنك الأخطاء", icon: "🚨" },
  "final-review": { label: "المراجعة النهائية", icon: "🔥" }
};

var currentLesson = null;

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.html !== undefined) node.innerHTML = opts.html;
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (opts.on) Object.entries(opts.on).forEach(([evt, fn]) => node.addEventListener(evt, fn));
  children.forEach(c => c && node.appendChild(c));
  return node;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function navMetaFor(lesson) {
  const m = Object.assign({}, NAV_META_BASE);
  m["places"] = { label: lesson.meta.entitiesLabel || "الأماكن", icon: lesson.meta.entitiesIcon || "🗺️" };
  return m;
}

function buildLessonNav() {
  const nav = document.getElementById("sectionNav");
  nav.innerHTML = "";
  const navMeta = navMetaFor(currentLesson);
  currentLesson.meta.order.forEach(id => {
    const meta = navMeta[id];
    if (!meta) return;
    const btn = el("button", {
      class: "nav-btn",
      html: `<span>${meta.icon}</span><span>${meta.label}</span>`,
      attrs: { "data-target": id }
    }, []);
    btn.addEventListener("click", () => goToSection(id));
    nav.appendChild(btn);
  });
}

function goToSection(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const page = document.getElementById(`page-${id}`);
  const btn = document.querySelector(`.nav-btn[data-target="${id}"]`);
  if (page) page.classList.add("active");
  if (btn) btn.classList.add("active");
  if (id === "mistakes") renderMistakes();
  try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
  document.getElementById("sectionNav").classList.remove("open");
  location.hash = `#/lesson/${currentLesson.meta.id}/${id}`;
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "navToggle") {
    document.getElementById("sectionNav").classList.toggle("open");
  }
});

function renderChain(chain) {
  const route = el("div", { class: "chain-route" });
  chain.forEach((step, i) => {
    route.appendChild(el("div", { class: "chain-step", text: step }));
    if (i < chain.length - 1) route.appendChild(el("div", { class: "chain-arrow" }));
  });
  return route;
}

function renderStatBars(stats) {
  const wrap = el("div", { class: "stat-bars" });
  if (stats.title) wrap.appendChild(el("p", { class: "stat-bars-title", text: stats.title }));
  const bars = el("div", { class: "stat-bars-list" });
  stats.bars.forEach(b => {
    const pct = Math.round((b.value / b.max) * 100);
    bars.appendChild(el("div", { class: "stat-bar-row" }, [
      el("span", { class: "stat-bar-label", text: b.label }),
      el("div", { class: "stat-bar-track" }, [
        el("div", { class: "stat-bar-fill", attrs: { style: `width:${pct}%` } })
      ]),
      el("span", { class: "stat-bar-value", text: String(b.value) })
    ]));
  });
  wrap.appendChild(bars);
  if (stats.note) wrap.appendChild(el("p", { class: "stat-bars-note", text: stats.note }));
  return wrap;
}

function renderOverview() {
  const wrap = document.getElementById("overviewContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: `🏠 ${currentLesson.meta.title}` }));
  wrap.appendChild(el("div", { class: "intro-box", text: currentLesson.overview.intro }));

  wrap.appendChild(el("h2", { class: "section-heading", text: "خريطة الدرس الذهنية" }));
  const map = el("div", { class: "mindmap" });
  currentLesson.overview.mindMap.forEach((node, i) => {
    map.appendChild(el("div", { class: "mindmap-node" }, [
      el("b", { text: node.label }),
      el("span", { text: node.note })
    ]));
    if (i < currentLesson.overview.mindMap.length - 1) {
      map.appendChild(el("div", { class: "mindmap-connector" }));
    }
  });
  wrap.appendChild(map);

  wrap.appendChild(el("h2", { class: "section-heading", text: "أهم العلاقات في الدرس" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "هذه العلاقات مدخل سريع فقط، وليست بديلًا عن المحتوى الكامل في القسم التالي." }));
  const rel = el("div", { class: "key-relations" });
  currentLesson.overview.keyRelations.forEach(r => rel.appendChild(el("div", { class: "key-relation-card", text: r })));
  wrap.appendChild(rel);
}

function renderFullContent() {
  const wrap = document.getElementById("fullContentContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "📚 المحتوى الكامل" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "هذا القسم يحتوي على كل معلومة موجودة في الملاحظات الأصلية، مرتبة في موضوعات." }));

  currentLesson.fullContent.sections.forEach((section, i) => {
    const block = el("div", { class: "topic-block" });
    block.appendChild(el("h3", { class: "topic-title" }, [
      el("span", { class: "num", text: String(i + 1) }),
      el("span", { text: section.title })
    ]));
    const list = el("ul", { class: "point-list" });
    section.points.forEach(p => {
      const isUnclear = p.startsWith("⚠️");
      list.appendChild(el("li", { class: isUnclear ? "unclear" : "", text: p }));
    });
    block.appendChild(list);

    if (section.stats) block.appendChild(renderStatBars(section.stats));

    const extras = (currentLesson.fullContent.extraInfo || []).filter(e => e.relatedTo === section.id);
    extras.forEach(ex => {
      block.appendChild(el("div", { class: "extra-info-box" }, [
        el("span", { class: "tag", text: "معلومة إضافية (خارج الملاحظات الأصلية)" }),
        el("p", { text: ex.text })
      ]));
    });

    wrap.appendChild(block);
  });
}

function renderPlaces() {
  const wrap = document.getElementById("placesContent");
  wrap.innerHTML = "";
  const meta = navMetaFor(currentLesson)["places"];
  wrap.appendChild(el("h1", { class: "section-heading", text: `${meta.icon} ${meta.label}` }));
  const grid = el("div", { class: "places-grid" });
  currentLesson.places.forEach(p => {
    const card = el("div", { class: "place-card" });
    card.appendChild(el("span", { class: "place-type", text: p.type }));
    card.appendChild(el("h3", { text: p.name }));
    if (p.capital) card.appendChild(el("p", { class: "place-capital", text: `العاصمة: ${p.capital}` }));
    const ul = el("ul");
    p.facts.forEach(f => ul.appendChild(el("li", { text: f })));
    card.appendChild(ul);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
}

function renderCauseEffect() {
  const wrap = document.getElementById("causeEffectContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🔗 السبب والنتيجة" }));
  currentLesson.causeEffect.forEach(c => {
    const card = el("div", { class: "chain-card" });
    card.appendChild(el("h3", { text: c.title }));
    card.appendChild(renderChain(c.chain));
    wrap.appendChild(card);
  });
}

function renderWhy() {
  const wrap = document.getElementById("whyContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "❓ لماذا؟" }));
  currentLesson.why.forEach((item) => {
    const box = el("div", { class: "why-item" });
    const btn = el("button", { class: "why-question" }, [
      el("span", { text: item.question }),
      el("span", { class: "chevron", text: "⌄" })
    ]);
    const body = el("div", { class: "why-body" }, [
      el("div", { class: "why-answer", text: item.answer }),
      el("p", { class: "why-explain", text: item.explanation })
    ]);
    btn.addEventListener("click", () => box.classList.toggle("open"));
    box.appendChild(btn);
    box.appendChild(body);
    wrap.appendChild(box);
  });
}

function renderComparisons() {
  const wrap = document.getElementById("comparisonsContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "⚖️ المقارنات" }));
  currentLesson.comparisons.forEach(c => {
    const card = el("div", { class: "compare-card" });
    card.appendChild(el("h3", { text: c.title }));
    const grid = el("div", { class: "compare-grid" });
    c.items.forEach(item => {
      const col = el("div", { class: "compare-col" });
      col.appendChild(el("h4", { text: item.label }));
      const ul = el("ul");
      item.points.forEach(p => ul.appendChild(el("li", { text: p })));
      col.appendChild(ul);
      grid.appendChild(col);
    });
    card.appendChild(grid);
    wrap.appendChild(card);
  });
}

function renderRelationsMap() {
  const wrap = document.getElementById("relationsMapContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🧠 خريطة العلاقات" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "كيف ترتبط أهم أفكار الدرس ببعضها البعض." }));
  currentLesson.relationsMap.forEach(r => {
    const card = el("div", { class: "chain-card" });
    card.appendChild(el("h3", { text: r.title }));
    card.appendChild(renderChain(r.chain));
    wrap.appendChild(card);
  });
}

function renderSequence() {
  const wrap = document.getElementById("sequenceContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🗓️ التسلسل التاريخي" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "الترتيب هنا كما ورد في مصدر الدرس (زمنيًا أو منطقيًا وسببيًا)." }));
  const tl = el("div", { class: "timeline" });
  currentLesson.sequence.forEach(s => {
    tl.appendChild(el("div", { class: "timeline-item" }, [
      el("h4", { text: s.label }),
      el("p", { text: s.description })
    ]));
  });
  wrap.appendChild(tl);
}

let flashIndex = 0;

function renderFlashcards() {
  flashIndex = 0;
  const wrap = document.getElementById("flashcardsContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🃏 بطاقات المراجعة" }));

  const toolbar = el("div", { class: "flash-toolbar" }, [
    el("span", { class: "flash-counter", attrs: { id: "flashCounter" } }),
    el("button", { class: "btn btn-outline", text: "خلط البطاقات 🔀", on: { click: shuffleFlashcards } })
  ]);
  wrap.appendChild(toolbar);

  const stage = el("div", { class: "flash-stage", attrs: { id: "flashStage" } });
  wrap.appendChild(stage);
  wrap.appendChild(el("p", { class: "flash-hint", text: "اضغط على البطاقة لقلبها ورؤية الإجابة" }));

  const nav = el("div", { class: "flash-nav" }, [
    el("button", { class: "btn btn-outline", text: "السابق ←", on: { click: () => moveFlash(1) } }),
    el("button", { class: "btn btn-primary", text: "→ التالي", on: { click: () => moveFlash(-1) } })
  ]);
  wrap.appendChild(nav);

  drawFlashcard();
}

function shuffleFlashcards() {
  const cards = currentLesson.flashcards;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  flashIndex = 0;
  drawFlashcard();
  showToast("تم خلط البطاقات");
}

function moveFlash(dir) {
  const n = currentLesson.flashcards.length;
  flashIndex = (flashIndex + (dir === -1 ? 1 : -1) + n) % n;
  drawFlashcard();
}

function drawFlashcard() {
  const stage = document.getElementById("flashStage");
  const counter = document.getElementById("flashCounter");
  if (!stage) return;
  const cards = currentLesson.flashcards;
  const card = cards[flashIndex];
  counter.textContent = `بطاقة ${flashIndex + 1} من ${cards.length}`;
  stage.innerHTML = "";
  const flip = el("div", { class: "flash-card", attrs: { id: "flashCardInner" } }, [
    el("div", { class: "flash-face flash-front" }, [
      el("span", { class: "flash-type", text: card.type }),
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

let quizState = null;

function initQuiz() {
  quizState = { order: currentLesson.quiz.map(q => q.id), index: 0, answers: {}, finished: false };
  renderQuizQuestion();
}

function renderQuiz() {
  const wrap = document.getElementById("quizContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "📝 الاختبار" }));
  wrap.appendChild(el("div", { attrs: { id: "quizArea" } }));
  initQuiz();
}

function getQuizQuestion(id) { return currentLesson.quiz.find(q => q.id === id); }

function renderQuizQuestion() {
  const area = document.getElementById("quizArea");
  if (!area) return;
  area.innerHTML = "";

  if (quizState.index >= quizState.order.length) {
    renderQuizResult();
    return;
  }

  const qid = quizState.order[quizState.index];
  const q = getQuizQuestion(qid);
  const options = q.type === "tf" ? ["صح", "خطأ"] : q.options;
  const correctIndex = q.type === "tf" ? (q.correct ? 0 : 1) : q.correct;

  const progressPct = Math.round((quizState.index / quizState.order.length) * 100);
  area.appendChild(el("div", { class: "quiz-progress" }, [
    el("div", { class: "quiz-progress-fill", attrs: { style: `width:${progressPct}%` } })
  ]));

  const card = el("div", { class: "quiz-q-card" });
  card.appendChild(el("p", { class: "quiz-q-meta", text: `سؤال ${quizState.index + 1} من ${quizState.order.length}` }));
  card.appendChild(el("p", { class: "quiz-q-text", text: q.question }));

  const optsWrap = el("div", { class: "quiz-options" });
  const existing = quizState.answers[qid];

  options.forEach((opt, i) => {
    const optBtn = el("button", { class: "quiz-opt", text: opt });
    if (existing) {
      optBtn.setAttribute("disabled", "true");
      if (i === correctIndex) optBtn.classList.add("correct");
      if (i === existing.selected && i !== correctIndex) optBtn.classList.add("incorrect");
      if (i === existing.selected && i === correctIndex) optBtn.classList.add("correct");
    } else {
      optBtn.addEventListener("click", () => answerQuiz(qid, i, correctIndex));
    }
    optsWrap.appendChild(optBtn);
  });
  card.appendChild(optsWrap);

  if (existing) {
    card.appendChild(el("div", { class: "quiz-explain", text: `💡 ${q.explanation || ""}` }));
  }

  const actions = el("div", { class: "quiz-actions" });
  if (existing) {
    actions.appendChild(el("button", {
      class: "btn btn-primary",
      text: quizState.index === quizState.order.length - 1 ? "عرض النتيجة" : "السؤال التالي ←",
      on: { click: () => { quizState.index++; renderQuizQuestion(); } }
    }));
  }
  card.appendChild(actions);
  area.appendChild(card);
}

function answerQuiz(qid, selected, correctIndex) {
  const isCorrect = selected === correctIndex;
  quizState.answers[qid] = { selected, correct: isCorrect };
  if (!isCorrect) {
    const q = getQuizQuestion(qid);
    const options = q.type === "tf" ? ["صح", "خطأ"] : q.options;
    addMistake({
      qid: q.id,
      lessonId: currentLesson.meta.id,
      lessonTitle: currentLesson.meta.shortTitle || currentLesson.meta.title,
      question: q.question,
      correctAnswer: options[correctIndex],
      explanation: q.explanation || ""
    });
  }
  renderQuizQuestion();
}

function renderQuizResult() {
  const area = document.getElementById("quizArea");
  const total = quizState.order.length;
  const correctCount = Object.values(quizState.answers).filter(a => a.correct).length;
  const wrongCount = total - correctCount;
  const pct = Math.round((correctCount / total) * 100);
  recordQuizScore(currentLesson.meta.id, pct);

  const result = el("div", { class: "quiz-result" });
  result.appendChild(el("div", { class: "quiz-score-circle" }, [
    el("div", { class: "num", text: `${pct}%` }),
    el("div", { class: "lbl", text: "الدرجة" })
  ]));
  const stats = el("div", { class: "quiz-result-stats" }, [
    el("div", { class: "stat-correct" }, [el("div", { class: "n", text: String(correctCount) }), el("div", { class: "l", text: "إجابات صحيحة" })]),
    el("div", { class: "stat-wrong" }, [el("div", { class: "n", text: String(wrongCount) }), el("div", { class: "l", text: "إجابات خاطئة" })])
  ]);
  result.appendChild(stats);

  result.appendChild(el("h3", { class: "section-heading", text: "مراجعة الإجابات", attrs: { style: "font-size:18px;margin-top:10px;" } }));
  quizState.order.forEach(qid => {
    const q = getQuizQuestion(qid);
    const a = quizState.answers[qid];
    const options = q.type === "tf" ? ["صح", "خطأ"] : q.options;
    const correctIndex = q.type === "tf" ? (q.correct ? 0 : 1) : q.correct;
    const item = el("div", { class: `review-item ${a.correct ? "right" : "wrong"}` });
    item.appendChild(el("p", { class: "rq", text: `${a.correct ? "✅" : "❌"} ${q.question}` }));
    item.appendChild(el("p", { class: "ra", text: `الإجابة الصحيحة: ${options[correctIndex]}` }));
    if (q.explanation) item.appendChild(el("p", { class: "ra", text: q.explanation }));
    result.appendChild(item);
  });

  if (wrongCount > 0) {
    result.appendChild(el("p", { class: "section-desc", text: `تمت إضافة ${wrongCount} سؤال/أسئلة أخطأت فيها إلى "بنك الأخطاء" تلقائيًا.`, attrs: { style: "margin-top:16px;" } }));
  }

  const actions = el("div", { class: "quiz-actions", attrs: { style: "justify-content:center;" } }, [
    el("button", { class: "btn btn-primary", text: "إعادة الاختبار 🔄", on: { click: initQuiz } }),
    el("button", { class: "btn btn-outline", text: "الذهاب لبنك الأخطاء 🚨", on: { click: () => goToSection("mistakes") } })
  ]);
  result.appendChild(actions);

  area.innerHTML = "";
  area.appendChild(result);
}

function renderMistakes() {
  const wrap = document.getElementById("mistakesContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🚨 بنك الأخطاء" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "أخطاء هذا الدرس فقط. يمكنك أيضًا مراجعة أخطاء كل المنهج من الصفحة الرئيسية." }));

  const list = loadMistakesForLesson(currentLesson.meta.id);
  if (list.length === 0) {
    wrap.appendChild(el("div", { class: "empty-state" }, [
      el("div", { class: "icon", text: "🌙" }),
      el("p", { text: "لا توجد أخطاء محفوظة في هذا الدرس حتى الآن. حل الاختبار وستظهر هنا أي إجابة خاطئة تلقائيًا." })
    ]));
    return;
  }

  list.slice().reverse().forEach(m => {
    const item = el("div", { class: `mistake-item ${m.mastered ? "mastered" : ""}` });
    if (m.mastered) item.appendChild(el("span", { class: "mistake-badge", text: "✔ تم إتقانه" }));
    item.appendChild(el("p", { class: "mistake-q", text: m.question }));
    item.appendChild(el("p", { class: "mistake-a", text: `الإجابة الصحيحة: ${m.correctAnswer}` }));
    if (m.explanation) item.appendChild(el("p", { class: "mistake-exp", text: m.explanation }));
    const actions = el("div", { class: "mistake-actions" });
    if (!m.mastered) {
      actions.appendChild(el("button", {
        class: "btn btn-outline", text: "تم إتقانه ✔",
        on: { click: () => { toggleMistakeMastered(m.lessonId, m.qid); renderMistakes(); showToast("أحسنت! تم تمييزه كمتقَن"); } }
      }));
    }
    actions.appendChild(el("button", {
      class: "btn btn-danger", text: "حذف 🗑",
      on: { click: () => { deleteMistake(m.lessonId, m.qid); renderMistakes(); showToast("تم حذف الخطأ من البنك"); } }
    }));
    item.appendChild(actions);
    wrap.appendChild(item);
  });
}

function renderFinalReview() {
  const wrap = document.getElementById("finalReviewContent");
  wrap.innerHTML = "";
  wrap.appendChild(el("h1", { class: "section-heading", text: "🔥 المراجعة النهائية" }));
  wrap.appendChild(el("p", { class: "section-desc", text: "نسخة سريعة جدًا قبل الامتحان — إن احتجت التفاصيل الكاملة عُد إلى قسم «المحتوى الكامل»." }));
  const grid = el("div", { class: "final-grid" });
  currentLesson.finalReview.sections.forEach(sec => {
    const card = el("div", { class: "final-card" });
    card.appendChild(el("h3", { text: sec.title }));
    const ul = el("ul");
    sec.items.forEach(i => ul.appendChild(el("li", { text: i })));
    card.appendChild(ul);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
}

function renderLessonSwitcher(lessonId) {
  const wrap = document.getElementById("lessonSwitcher");
  if (!wrap) return;
  wrap.innerHTML = "";
  const allIds = curriculumAllLessonIds();
  const idx = allIds.indexOf(lessonId);
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx >= 0 && idx < allIds.length - 1 ? allIds[idx + 1] : null;

  const prevReady = prevId && curriculumIsLessonReady(prevId);
  const nextReady = nextId && curriculumIsLessonReady(nextId);
  if (!prevReady && !nextReady) return;

  if (prevReady) {
    wrap.appendChild(el("button", {
      class: "btn btn-outline switcher-btn",
      html: `<span>←</span><span>${LESSONS[prevId].meta.shortTitle || LESSONS[prevId].meta.title}</span>`,
      on: { click: () => navigateTo(`#/lesson/${prevId}`) }
    }));
  } else {
    wrap.appendChild(el("span", {}));
  }
  if (nextReady) {
    wrap.appendChild(el("button", {
      class: "btn btn-outline switcher-btn",
      html: `<span>${LESSONS[nextId].meta.shortTitle || LESSONS[nextId].meta.title}</span><span>→</span>`,
      on: { click: () => navigateTo(`#/lesson/${nextId}`) }
    }));
  }
}

function initLessonApp(lessonId, initialSection) {
  currentLesson = LESSONS[lessonId];
  if (!currentLesson) return false;

  document.getElementById("lessonTitle").textContent = currentLesson.meta.title;
  document.getElementById("lessonSubtitle").textContent = currentLesson.meta.subtitle;
  buildLessonNav();
  renderLessonSwitcher(lessonId);

  renderOverview();
  renderFullContent();
  renderPlaces();
  renderCauseEffect();
  renderWhy();
  renderComparisons();
  renderRelationsMap();
  renderSequence();
  renderFlashcards();
  renderQuiz();
  renderMistakes();
  renderFinalReview();

  markLessonVisited(lessonId);

  const startId = currentLesson.meta.order.includes(initialSection) ? initialSection : currentLesson.meta.order[0];
  goToSection(startId);
  return true;
}
