import {readStreak,streakView,streakMessage} from './streak.mjs';
import {loadPool,loadProgress,saveProgress,allCompleted,restartCycle} from './quick-round.mjs';
const button=document.querySelector('#start'),progressText=document.querySelector('#progress'),notice=document.querySelector('#notice');
const bubble=document.querySelector('#home-bubble');
const encouragements=['今天一起做 5 題吧！','先做一點點，就很厲害！','做完今天 5 題就休息～','我陪你一起讀！','從 5 題開始最輕鬆！'];
const streak=streakView(readStreak());
document.querySelector('#streak-count').textContent=`🔥 連續 ${streak.count} 天`;
document.querySelector('#streak-today').textContent=streak.todayDone?'今天已打卡 ✓':'今天還差 5 題！';
const greeting=streak.todayDone?streakMessage(streak.count):encouragements[Math.floor(Math.random()*encouragements.length)];
bubble.textContent=greeting;
button.addEventListener('pointerenter',()=>{if(!button.disabled&&matchMedia('(hover: hover)').matches){bubble.textContent='走吧！5 題很快就完成！';document.body.classList.add('buddy-ready');}});
button.addEventListener('pointerleave',()=>{bubble.textContent=greeting;document.body.classList.remove('buddy-ready');});
button.addEventListener('click',()=>{bubble.textContent='出發！我陪你～';},{capture:true});
try {
 const {ids}=await loadPool();let progress=loadProgress(ids);
 function render(){
  const complete=allCompleted(ids,progress);
  progressText.textContent=complete?'這一輪已全部完成！':`這一輪 ${progress.completedQuestionIds.length} / ${ids.length}`;
  button.textContent=complete?'重新開始新一輪':'開始 5 題';button.disabled=false;
  button.onclick=()=>{
   if(complete){const next=restartCycle(ids,progress);if(!saveProgress(next)){notice.textContent='進度暫時無法保存，請稍後再試。';return;}progress=next;}
   if(progress.current?.finished){const next={...progress,current:null};if(!saveProgress(next)){notice.textContent='進度暫時無法保存，請稍後再試。';return;}}
   location.href='exam/play.html';
  };
 }
 if(!saveProgress(progress))notice.textContent='進度暫時無法保存，請確認瀏覽器允許儲存。';
 render();
}catch{notice.textContent='題目暫時無法載入，請重新整理。';}
