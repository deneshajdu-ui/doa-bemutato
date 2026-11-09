(()=>{'use strict';
const KEY='doa-analytics-excluded-v1';
const automated=navigator.webdriver===true||/HeadlessChrome|Playwright|Puppeteer|GPTBot|ChatGPT-User|OAI-SearchBot|Lighthouse/i.test(navigator.userAgent||'');
const temporary=new URL(location.href).searchParams.get('doa_internal')==='1';
if(temporary){try{localStorage.setItem(KEY,'1');}catch{}}
window.doaAnalyticsExcluded=()=>{if(automated||temporary||location.hostname!=='doa-bemutato.pages.dev')return true;try{return localStorage.getItem(KEY)==='1';}catch{return true;}};
window.doaAnalyticsReady=false;
if(window.doaAnalyticsExcluded())return;
const types=['pointerdown','touchstart','keydown','wheel','click'];
function activate(e){
 if(window.doaAnalyticsReady||window.doaAnalyticsExcluded()||!e.isTrusted||document.visibilityState!=='visible'||!document.hasFocus())return;
 if(e.type==='keydown'&&['Shift','Control','Alt','Meta','CapsLock'].includes(e.key))return;
 if(e.type==='wheel'&&!e.deltaX&&!e.deltaY)return;
 window.doaAnalyticsReady=true;
 for(const type of types)window.removeEventListener(type,activate,true);
 const beacon=document.createElement('script');beacon.type='module';beacon.src='https://static.cloudflareinsights.com/beacon.min.js';beacon.setAttribute('data-cf-beacon',JSON.stringify({token:'0840c739ea1e4a10b18225b1fb7a65b0'}));document.head.append(beacon);
 window.dispatchEvent(new Event('doa-analytics-ready'));
}
for(const type of types)window.addEventListener(type,activate,{capture:true,passive:true});
})();
