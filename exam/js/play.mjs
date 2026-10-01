import {LETTERS,scoreRound} from './core.mjs';
import {escapeHTML as h} from './store.mjs';
import {renderPassage} from './passage.mjs';
import {loadPool,loadProgress,saveProgress,createRound,restoreRound,recordAnswer,activeIds} from './quick-round.mjs';
const app=document.querySelector('#app'),notice=document.querySelector('#notice');
let progress,pool;
const imageHTML=(path,alt)=>`<button type="button" class="image-link" data-image="${h(path)}" aria-label="放大${h(alt)}"><img class="source-image" src="${h(path)}" alt="${h(alt)}"></button>`;
function bindImages(){document.querySelectorAll('[data-image]').forEach(button=>button.onclick=()=>{document.querySelector('#largeImage').src=button.dataset.image;document.querySelector('#imageDialog').showModal();});}
document.querySelector('#closeImage').onclick=()=>document.querySelector('#imageDialog').close();
function persist(next){if(!saveProgress(next)){notice.textContent='進度暫時無法保存，請稍後再試。';return false;}progress=next;notice.textContent='';return true;}
function completedGroupContext(group,session){
 const prior=group.questionIds.filter(id=>session.completedBefore.includes(id));
 if(!prior.length)return '';
 return `<details class="previous-group"><summary>本組先前已完成 ${prior.length} 題（不需重作）</summary>${prior.map(id=>{const q=pool.questions[id];return `<p>第 ${q.questionNumber} 題：${h(q.question)}</p>${q.images.map(p=>imageHTML(p,'原題圖片')).join('')}${LETTERS.map(k=>`<p>${k}. ${h(q.choices[k])}</p>${q.optionImages[k]?imageHTML(q.optionImages[k],`${k} 選項`):''}`).join('')}`;}).join('')}</details>`;
}
function render(){
 const s=progress.current;
 if(!s){app.innerHTML='<section class="card"><h1>這一輪已全部完成！</h1><a class="primary" href="../">回首頁</a></section>';return;}
 const ids=activeIds(s);
 if(s.finished){
  const result=scoreRound(ids,s.answers,pool.questions);
  document.querySelector('#buddy-progress').textContent='今天完成了！你好棒！';
  app.innerHTML=`<section class="card session-complete"><img class="squirrel-finish" src="../icon-512.png?v=2" alt="松鼠陪你完成了"><p class="speech finish-bubble">今天完成了！你好棒！</p><h1>今天完成了！</h1><p class="score">本次答對 ${result.score} / ${ids.length}</p><a class="primary" href="../">回首頁</a></section>`;return;
 }
 const id=s.questionIds[s.index],q=pool.questions[id],answer=s.answers[id],group=q.groupId?pool.groups[q.groupId]:null;
 const position=ids.indexOf(id)+1;
 document.querySelector('#buddy-progress').textContent=(ids.length===5?['第一題，慢慢看就好！','很好，繼續！','一半囉！','剩最後兩題！','最後一題！'][position-1]:(position===1?'第一題，慢慢看就好！':position===ids.length?'最後一題！':`第 ${position} 題了，還有 ${ids.length-position+1} 題，我陪你！`));
 app.innerHTML=`<div class="topline"><b>⚡ 快刷</b><span>第 ${position} 題 / ${ids.length}</span></div><div class="progress"><span style="width:${position/ids.length*100}%"></span></div><article class="card"><span class="tag">${q.year} 年 · 第 ${q.questionNumber} 題</span>${group?`<section class="card passage"><h2>題組 ${group.firstQuestion}–${group.lastQuestion} · 本組 ${group.questionIds.indexOf(id)+1}/${group.questionIds.length}</h2>${renderPassage(group,imageHTML)}${completedGroupContext(group,s)}</section>`:''}<p class="question" lang="en">${h(q.question||`選出第 ${q.questionNumber} 空的答案。`)}</p>${q.images.map(p=>imageHTML(p,'原題圖片')).join('')}${q.glossary?`<p class="glossary">${h(q.glossary)}</p>`:''}<div class="choices">${LETTERS.map(k=>`<button class="choice ${answer===k?'selected':''} ${answer&&q.answer===k?'correct':''} ${answer&&answer===k&&answer!==q.answer?'incorrect':''}" data-answer="${k}" ${answer?'disabled':''}><span class="letter">${k}</span><span class="choice-content" lang="en">${h(q.choices[k])}${q.optionImages[k]?`<img src="${h(q.optionImages[k])}" alt="原題 ${k} 選項圖表">`:''}</span></button>`).join('')}</div>${answer?`<section class="feedback" role="status"><h2>${answer===q.answer?'✅ 答對了':'❌ 答錯'}</h2><p>正確答案：<b>${q.answer}</b>${q.choices[q.answer]?' · '+h(q.choices[q.answer]):''}</p><p><b>一句解析：</b>${h(q.quickExplanation)}</p><details><summary>看完整解析</summary><div class="explanation">${h(q.explanation)}</div></details></section><button id="next" class="primary">${position===ids.length?'完成 →':'下一題 →'}</button>`:''}</article>`;
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(s.answers[id])return;const next=recordAnswer(progress,id,b.dataset.answer);if(persist(next))render();});
 const next=document.querySelector('#next');if(next)next.onclick=()=>{const restored=restoreRound(progress.current,pool.ids);if(persist({...progress,current:restored})){render();window.scrollTo(0,0);}};
 bindImages();
}
async function init(){
 try{
  pool=await loadPool();progress=loadProgress(pool.ids);
  const saved=restoreRound(progress.current,pool.ids);
  // Existing unfinished rounds always resume, irrespective of obsolete mode URL parameters.
  const current=saved||createRound(pool.units,progress.completedQuestionIds);
  if(!persist({...progress,current}))return;
  render();
 }catch{app.innerHTML='<section class="card"><h1>題目或進度暫時無法載入</h1><p>請重新整理後繼續，原紀錄不會被清除。</p><a href="../">回首頁</a></section>';}
}
init();
