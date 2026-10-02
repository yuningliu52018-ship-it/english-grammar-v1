export const STREAK_KEY='englishQuickPracticeStreak.v1';
const empty=()=>({currentStreak:0,lastCompletedDate:null,totalCompletedDays:0});
export function localDate(date=new Date()) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function dayNumber(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;
 const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date.getTime()/86400000:NaN;
}
export function readStreak(storage=localStorage){
 try{const s=JSON.parse(storage.getItem(STREAK_KEY));
 if(s&&Number.isSafeInteger(s.currentStreak)&&s.currentStreak>0&&Number.isSafeInteger(s.totalCompletedDays)&&s.totalCompletedDays>=s.currentStreak&&Number.isFinite(dayNumber(s.lastCompletedDate)))return s;
 }catch{}
 return empty();
}
export function nextStreak(state,date=new Date()){
 const today=localDate(date),gap=dayNumber(today)-dayNumber(state.lastCompletedDate);
 if(gap<=0)return state; // Same day (or clock moved backwards) never earns another day.
 return {currentStreak:gap===1?state.currentStreak+1:1,lastCompletedDate:today,totalCompletedDays:state.totalCompletedDays+1};
}
export function checkIn(storage=localStorage,date=new Date()){
 const before=readStreak(storage),after=nextStreak(before,date);
 try{if(after!==before)storage.setItem(STREAK_KEY,JSON.stringify(after));return {state:after,saved:true};}
 catch{return {state:before,saved:false};}
}
export function streakView(state,date=new Date()){
 const gap=dayNumber(localDate(date))-dayNumber(state.lastCompletedDate);
 return {count:gap===0||gap===1?state.currentStreak:0,todayDone:gap===0};
}
export function streakMessage(count){return ({1:'第一天完成！',3:'連續 3 天了！',7:'一週達成！',14:'兩週連續打卡！',30:'30 天達成！'})[count]||`連續 ${count} 天，繼續保持！`;}
export function roundQualifies(session,ids){return ids.length>=5&&ids.every(id=>['A','B','C','D'].includes(session.answers[id]));}
