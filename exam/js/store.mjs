export const KEYS = {current:'116.englishExam.current.v1', last:'116.englishExam.last.v1'};
export function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
export function write(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
export function remove(key) { try { localStorage.removeItem(key); } catch {} }
export const escapeHTML = text => String(text ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
