import {LETTERS, validateBank, makeUnits, shuffle, flattenUnits} from './core.mjs';
import {KEYS, read, write} from './store.mjs';
export const PROGRESS_KEY = '116.englishExam.quickProgress.v1';
export async function loadPool() {
 const banks=await Promise.all([108,111,112,113,114].map(async year=>{
  const response=await fetch(new URL(`../data/${year}.json`,import.meta.url));
  if(!response.ok) throw new Error('Bank unavailable');
  return validateBank(await response.json());
 }));
 const units=makeUnits(banks);
 return {units, ids:flattenUnits(units), questions:Object.fromEntries(banks.flatMap(b=>b.questions.map(q=>[q.id,q]))), groups:Object.fromEntries(banks.flatMap(b=>b.groups.map(g=>[g.id,g])))};
}
export const activeIds = session => session.questionIds.filter(id=>!session.completedBefore.includes(id));
export function importProgress(ids, stored, legacy=[]) {
 const allowed=new Set(ids);
 if(stored) {
  if(!Array.isArray(stored.completedQuestionIds)) throw new Error('Invalid saved progress');
  return {...stored,completedQuestionIds:[...new Set(stored.completedQuestionIds.filter(id=>allowed.has(id)))]};
 }
 const completed=legacy.flatMap(s=>Object.entries(s?.answers||{}).filter(([id,a])=>allowed.has(id)&&LETTERS.includes(a)).map(([id])=>id));
 return {completedQuestionIds:[...new Set(completed)], current:null};
}
export function loadProgress(ids) {
 // Import only recoverable answers once; old keys are left intact.
 return importProgress(ids,read(PROGRESS_KEY),[read(KEYS.current),read(KEYS.last)]);
}
export const saveProgress = progress => write(PROGRESS_KEY,progress);
export function createRound(units, completedIds, random=Math.random) {
 const done=new Set(completedIds), candidates=shuffle(units.filter(u=>u.questionIds.some(id=>!done.has(id))),random);
 // Keep each unit whole. Find an exact five when possible, rather than
 // greedily using a group that would leave an unfillable remainder.
 const combinations=Array(6).fill(null);combinations[0]=[];
 for(const unit of candidates){
  const size=unit.questionIds.filter(id=>!done.has(id)).length;
  if(size>5)continue;
  for(let count=5;count>=size;count--){
   if(!combinations[count]&&combinations[count-size])combinations[count]=[...combinations[count-size],unit];
  }
  if(combinations[5])break;
 }
 const selected=combinations[5]||combinations[4]||combinations[3]||combinations[2]||combinations[1];
 if(!selected)return null;
 const questionIds=flattenUnits(selected),completedBefore=questionIds.filter(id=>done.has(id));
 return {questionIds,completedBefore,answers:{},index:questionIds.findIndex(id=>!done.has(id)),finished:false};
}
export function restoreRound(session, ids) {
 if(!session)return null;
 if(!Array.isArray(session.questionIds)||!session.questionIds.length||!session.questionIds.every(id=>ids.includes(id))||!Array.isArray(session.completedBefore)||!session.answers)throw new Error('Invalid saved round');
 const index=session.questionIds.findIndex(id=>!session.completedBefore.includes(id)&&!LETTERS.includes(session.answers[id]));
 return {...session,index:index<0?session.index:index,finished:index<0};
}
export function recordAnswer(progress,id,answer) {
 const session=progress.current;
 if(!session||session.finished||session.questionIds[session.index]!==id||session.completedBefore.includes(id)||session.answers[id]||!LETTERS.includes(answer))return progress;
 return {...progress,completedQuestionIds:[...new Set([...progress.completedQuestionIds,id])],current:{...session,answers:{...session.answers,[id]:answer}}};
}
export const allCompleted = (ids,progress) => ids.every(id=>progress.completedQuestionIds.includes(id));
export function restartCycle(ids,progress) {
 if(!allCompleted(ids,progress))throw new Error('Cycle is not complete');
 return {completedQuestionIds:[],current:null};
}
