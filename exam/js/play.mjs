import {LETTERS,validateBank,makeUnits,chooseUnits,flattenUnits,shuffle,scoreRound,groupBoundary} from './core.mjs';
import {KEYS,read,write,remove,escapeHTML as h} from './store.mjs';
import {renderPassage} from './passage.mjs';
const app=document.querySelector('#app'),notice=document.querySelector('#notice');
const params=new URLSearchParams(location.search);
let session,questions,groups,units;
function persist(){if(!write(KEYS.current,session))notice.textContent='此瀏覽器無法保存本局進度；仍可繼續作答。';}
const imageHTML=(path,alt)=>`<button type="button" class="image-link" data-image="${h(path)}" aria-label="放大${h(alt)}"><img class="source-image" src="${h(path)}" alt="${h(alt)}"></button>`;
function bindImages(){document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#largeImage').src=button.dataset.image;document.querySelector('#imageDialog').showModal();}));}
document.querySelector('#closeImage').onclick=()=>document.querySelector('#imageDialog').close();
function explanation(q){return `<p><b>一句解析：</b>${h(q.quickExplanation)}</p><details><summary>看完整解析</summary><div class="explanation">${h(q.explanation)}</div></details>`;}
function finish(){
 session.finished=true;persist();
 const result=scoreRound(session.questionIds,session.answers,questions);
 write(KEYS.last,{...result,questionIds:[...session.questionIds],mode:session.mode});
 renderResult(result);
}
function renderResult(result){
 app.innerHTML=`<section class="card"><p class="tag">${session.mode==='mock'?'模擬結果':'本局完成'}</p><h1>這一局，完成了！</h1><div class="score">${result.score} / ${result.total}</div><p>答對率 ${result.total ? Math.round(result.score/result.total*100):0}%</p><p>錯題：${result.wrongQuestionIds.length?result.wrongQuestionIds.map(id=>`${questions[id].year} 年 ${questions[id].questionNumber}`).join('、'):'無'}</p><div class="actions">${result.wrongQuestionIds.length?'<a class="secondary" href="play.html?mode=retry">再刷剛才錯的</a>':''}<a class="secondary" href="../">回快刷首頁</a></div><p class="note">只保留最近一局結果。</p></section><section aria-label="作答回顧">${Object.keys(result.answers).map(id=>{const q=questions[id];return `<article class="card review"><h3>${q.year} 年第 ${q.questionNumber} 題 ${result.answers[id]===q.answer?'✅':'❌'}</h3><p class="question">${h(q.question||`第 ${q.questionNumber} 空`)}</p><p>我的答案：${h(result.answers[id])} · 正確答案：${q.answer}</p>${explanation(q)}<details><summary>查看原題／題組</summary>${q.groupId?renderPassage(groups[q.groupId],imageHTML):''}${q.images.map(p=>imageHTML(p,'題目圖片')).join('')}${LETTERS.map(k=>`<p>${k}. ${h(q.choices[k])}</p>${q.optionImages[k]?imageHTML(q.optionImages[k],`${k} 選項`):''}`).join('')}</details></article>`;}).join('')}</section>`;
 bindImages();window.scrollTo(0,0);
}
function render(){
 if(session.finished){renderResult(scoreRound(session.questionIds,session.answers,questions));return;}
 const id=session.questionIds[session.index],q=questions[id];
 if(!q){app.innerHTML='<section class="card"><h1>這一局沒有可刷題目</h1><a href="../">回首頁</a></section>';return;}
 const answer=session.answers[id],mock=session.mode==='mock',group=q.groupId?groups[q.groupId]:null;
 const labels={quick:'⚡ 快刷',mock:'🔥 模擬',year:'📚 按年度刷',random:'🎲 全年度隨機',retry:'🔁 本局錯題'};
 const displayedTotal=session.questionIds.length;
 app.innerHTML=`<div class="topline"><b>${labels[session.mode]}</b><span>第 ${session.index+1} 題 / ${displayedTotal}</span></div><div class="progress"><span style="width:${(session.index+1)/session.questionIds.length*100}%"></span></div><article class="card"><span class="tag">${q.year} 年 · 第 ${q.questionNumber} 題</span>${group?`<section class="card passage"><h2>題組 ${group.firstQuestion}–${group.lastQuestion} · 本組 ${group.questionIds.indexOf(id)+1}/${group.questionIds.length}</h2>${renderPassage(group,imageHTML)}</section>`:''}<p class="question" lang="en">${h(q.question||`選出第 ${q.questionNumber} 空的答案。`)}</p>${q.images.map(p=>imageHTML(p,'原題圖片')).join('')}${q.glossary?`<p class="glossary">${h(q.glossary)}</p>`:''}<div class="choices">${LETTERS.map(k=>`<button class="choice ${answer===k?'selected':''} ${answer&&!mock&&q.answer===k?'correct':''} ${answer&&!mock&&answer===k&&answer!==q.answer?'incorrect':''}" data-answer="${k}" ${answer?'disabled':''}><span class="letter">${k}</span><span class="choice-content" lang="en">${h(q.choices[k])}${q.optionImages[k]?`<img src="${h(q.optionImages[k])}" alt="原題 ${k} 選項圖表">`:''}</span></button>`).join('')}</div>${answer&&!mock?`<section class="feedback" role="status"><h2>${answer===q.answer?'✅ 答對了':'❌ 答錯'}</h2><p>正確答案：<b>${q.answer}</b>${q.choices[q.answer]?' · '+h(q.choices[q.answer]):''}</p>${explanation(q)}</section>`:''}${answer&&mock?'<p role="status" class="note">已記錄作答，完成本局後看結果。</p>':''}${answer?`<button id="next" class="primary">${session.index===session.questionIds.length-1&&session.mode!=='random'?'看本局結果':'下一題 →'}</button>`:''}${session.mode==='random'&&answer&&groupBoundary(session.questionIds,session.index,questions)?'<button id="endRound" class="secondary end-round">結束本局，看結果</button>':''}</article>`;
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(session.answers[id])return;session.answers[id]=b.dataset.answer;persist();render();});
 const next=document.querySelector('#next');if(next)next.onclick=()=>{
  if(session.index===session.questionIds.length-1){
   if(session.mode!=='random'){finish();return;}
   // Endless mode starts another complete shuffled cycle. Per-occurrence IDs stay in one round only once;
   // finish the recent round at this boundary, then a fresh random round can be started from home.
   finish();return;
  }
  session.index++;persist();render();window.scrollTo(0,0);
 };
 const end=document.querySelector('#endRound');if(end)end.onclick=finish;
 bindImages();
}
async function init(){
 try{
 const banks=await Promise.all([108,111,112,113,114].map(async y=>{const r=await fetch(`data/${y}.json`);if(!r.ok)throw new Error('bank');return validateBank(await r.json());}));
 questions=Object.fromEntries(banks.flatMap(b=>b.questions.map(q=>[q.id,q])));groups=Object.fromEntries(banks.flatMap(b=>b.groups.map(g=>[g.id,g])));units=makeUnits(banks);
 const saved=read(KEYS.current);let mode=params.get('mode')||'quick';if(!['quick','mock','year','random','retry'].includes(mode))mode='quick';
 const year=[108,111,112,113,114].includes(Number(params.get('year')))?Number(params.get('year')):108;
 if(saved&&Array.isArray(saved.questionIds)&&saved.questionIds.every(id=>questions[id])&&saved.answers&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<saved.questionIds.length&&(params.has('resume')||(!saved.finished&&saved.mode===mode&&(mode!=='year'||saved.year===year)))){session=saved;}
 else{const picked=chooseUnits(units,{mode,year,wrongQuestionIds:read(KEYS.last)?.wrongQuestionIds||[]});session={version:1,mode,year,questionIds:flattenUnits(picked),index:0,answers:{},finished:false};persist();}
 render();
 }catch{app.innerHTML='<section class="card"><h1>題目暫時無法載入</h1><p>請確認網路後重新整理。</p><a href="../">回快刷首頁</a></section>';}
}
init();
