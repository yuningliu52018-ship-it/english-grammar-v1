import {KEYS,read,escapeHTML as h} from './store.mjs';
const recent=document.querySelector('#recent'),last=read(KEYS.last),current=read(KEYS.current);
if (last || current) {
 recent.hidden=false;
 recent.innerHTML='<h2>最近一局</h2>' + (current && !current.finished ? '<p><a class="secondary" href="exam/play.html?resume=1">繼續上次作答</a></p>' : '') + (last ? `<p>答對 ${h(last.score)} / ${h(last.total)} 題</p>${last.wrongQuestionIds?.length ? '<a class="secondary" href="exam/play.html?mode=retry">再刷剛才錯的</a><p class="note">包含同組其他題，保留完整題組。</p>' : '<p>這一局全對！</p>'}` : '');
}
