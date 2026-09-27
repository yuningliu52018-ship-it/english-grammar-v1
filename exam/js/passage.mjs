import {PASSAGES as ORIGINAL_PASSAGES} from '../data/passages.mjs';
import {ADDITIONAL_PASSAGES} from '../data/passages-111-113.mjs';
const PASSAGES = {...ORIGINAL_PASSAGES, ...ADDITIONAL_PASSAGES};
import {escapeHTML as h} from './store.mjs';

// Only presentation: no question selection, answers, score, or storage access.
function inlineSource(text, passage) {
  const underlines = passage.underlines || [];
  const italics = passage.italics || [];
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms = [...underlines, ...italics].sort((a,b) => b.length-a.length).map(escapeRegExp);
  const tokens = new RegExp('\\{\\{(\\d+)\\}\\}' + (terms.length ? '|'+terms.join('|') : ''), 'g');
  let output='', cursor=0;
  for (const match of text.matchAll(tokens)) {
    output += h(text.slice(cursor, match.index));
    if (match[1]) output += `<span class="passage-blank" aria-label="第 ${match[1]} 空">${match[1]}</span>`;
    else if (underlines.includes(match[0])) output += `<u>${h(match[0])}</u>`;
    else output += `<em>${h(match[0])}</em>`;
    cursor=match.index+match[0].length;
  }
  return output+h(text.slice(cursor));
}
export function sourceParagraph(text, passage) {
  if (passage.kind === 'poem' || passage.kind === 'dialogue' || text.includes('\n')) {
    return inlineSource(text,passage).replaceAll('\n','<br>');
  }
  // Segment only for spacing. No spelling, punctuation, or wording is changed.
  const sentences = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)].map(s=>s.segment)
    : [text];
  return sentences.map(sentence=>`<span class="passage-sentence">${inlineSource(sentence,passage)}</span>`).join('');
}
export function renderPassage(group, imageHTML) {
  const passage=PASSAGES[group.id];
  const original=group.passageImages.map(p=>imageHTML(p,'原題題組文章')).join('');
  if (!passage) return `<div class="passage-view passage-visual">${original}</div><p class="note">保留原圖中的位置、表情與圖表線索。點圖片可放大。</p>`;
  return `<details class="reading-toggle" open><summary><span class="when-open">收合文章</span><span class="when-closed">展開文章</span></summary><div class="passage-reading" lang="en">${passage.title?`<h3>${h(passage.title)}</h3>`:''}${passage.dateline?`<p class="passage-dateline">${h(passage.dateline)}</p>`:''}${(passage.illustrations||[]).map(p=>imageHTML(p,passage.illustrationAlt||'原題工人漫畫')).join('')}${passage.paragraphs.map((text,index)=>`<p class="source-paragraph ${passage.kind==='two-news'&&index>0?'news-piece':''}">${sourceParagraph(text,passage)}</p>`).join('')}${passage.afterword?`<p>${h(passage.afterword)}</p>`:''}</div>${passage.glossary?.length?`<p class="source-glossary">${passage.glossary.map(h).join('　')}</p>`:''}</details><details class="source-original"><summary>查看原版圖片</summary>${original}</details>`;
}
