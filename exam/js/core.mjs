export const LETTERS = ['A', 'B', 'C', 'D'];
export function validateBank(bank) {
  const ids = new Set();
  for (const q of bank.questions) {
    if (ids.has(q.id) || q.year !== bank.year || !LETTERS.every(k => typeof q.choices[k] === 'string') || !LETTERS.includes(q.answer) || !q.explanation) throw new Error('Invalid question data');
    ids.add(q.id);
  }
  const grouped = new Set();
  for (const g of bank.groups) {
    if (!g.passageImages.length) throw new Error('Missing passage');
    for (const id of g.questionIds) {
      if (grouped.has(id) || !bank.questions.some(q => q.id === id && q.groupId === g.id)) throw new Error('Invalid group');
      grouped.add(id);
    }
  }
  if (bank.questions.some(q => q.groupId && !grouped.has(q.id))) throw new Error('Missing group');
  return bank;
}
export function makeUnits(banks) {
  return banks.flatMap(bank => [
    ...bank.questions.filter(q => !q.groupId && q.status === 'approved').map(q => ({id:q.id, year:q.year, questionIds:[q.id]})),
    ...bank.groups.filter(g => g.status === 'approved' && g.questionIds.every(id => bank.questions.some(q => q.id === id && q.status === 'approved'))).map(g => ({id:g.id, year:bank.year, questionIds:[...g.questionIds]}))
  ]);
}
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function takeWholeUnits(units, target) {
  const result = []; let count = 0;
  for (const unit of units) { if (count >= target) break; result.push(unit); count += unit.questionIds.length; }
  return result;
}
export function chooseUnits(units, {mode, year, wrongQuestionIds = []}, random = Math.random) {
  if (mode === 'year') return units.filter(u => u.year === year).sort((a,b) => a.questionIds[0].localeCompare(b.questionIds[0]));
  if (mode === 'retry') return units.filter(u => u.questionIds.some(id => wrongQuestionIds.includes(id)));
  const mixed = shuffle(units, random);
  if (mode === 'random') return mixed;
  return takeWholeUnits(mixed, mode === 'mock' ? 20 : 10);
}
export const flattenUnits = units => units.flatMap(u => u.questionIds);
export function scoreRound(ids, answers, questions) {
  const answeredIds = ids.filter(id => LETTERS.includes(answers[id]));
  const wrongQuestionIds = answeredIds.filter(id => answers[id] !== questions[id].answer);
  return {score:answeredIds.length - wrongQuestionIds.length, total:answeredIds.length, answers:{...answers}, wrongQuestionIds};
}
export function groupBoundary(ids, index, questions) {
  return index + 1 === ids.length || !questions[ids[index]].groupId || questions[ids[index]].groupId !== questions[ids[index+1]].groupId;
}
