/**
 * storage.js
 * طبقة تخزين محلي مشتركة بين كل الدروس والصفحة الرئيسية.
 * بنك الأخطاء مخزَّن تحت مفتاح واحد عام، وكل خطأ مُعلَّم برقم
 * الدرس الذي جاء منه — بهذا يمكن عرضه لكل درس على حدة، أو
 * عرضه مجمّعًا من الصفحة الرئيسية.
 */

var STORE_KEYS = {
  mistakes: "history_app_mistakes_v1",
  progress: "history_app_progress_v1"
};

function storageSafeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function storageSafeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}

// ---------- بنك الأخطاء (عبر كل الدروس) ----------
function loadAllMistakes() {
  return storageSafeGet(STORE_KEYS.mistakes, []);
}
function saveAllMistakes(list) {
  storageSafeSet(STORE_KEYS.mistakes, list);
}
function loadMistakesForLesson(lessonId) {
  return loadAllMistakes().filter(m => m.lessonId === lessonId);
}
function addMistake(entry) {
  // entry: { qid, lessonId, lessonTitle, question, correctAnswer, explanation }
  const list = loadAllMistakes();
  if (list.some(m => m.qid === entry.qid && m.lessonId === entry.lessonId)) return;
  list.push(Object.assign({ mastered: false, addedAt: Date.now() }, entry));
  saveAllMistakes(list);
}
function toggleMistakeMastered(lessonId, qid) {
  const list = loadAllMistakes();
  const item = list.find(m => m.lessonId === lessonId && m.qid === qid);
  if (item) item.mastered = true;
  saveAllMistakes(list);
}
function deleteMistake(lessonId, qid) {
  const list = loadAllMistakes().filter(m => !(m.lessonId === lessonId && m.qid === qid));
  saveAllMistakes(list);
}

// ---------- التقدّم ----------
function loadProgress() {
  return storageSafeGet(STORE_KEYS.progress, { visited: {}, quizBest: {}, lastVisited: null });
}
function saveProgress(p) {
  storageSafeSet(STORE_KEYS.progress, p);
}
function markLessonVisited(lessonId) {
  const p = loadProgress();
  p.visited[lessonId] = true;
  p.lastVisited = lessonId;
  saveProgress(p);
}
function recordQuizScore(lessonId, pct) {
  const p = loadProgress();
  const prevBest = p.quizBest[lessonId] || 0;
  p.quizBest[lessonId] = Math.max(prevBest, pct);
  saveProgress(p);
}
