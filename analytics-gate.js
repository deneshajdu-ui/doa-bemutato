(()=>{'use strict';
const KEY='doa-analytics-excluded-v1';
const temporary=new URL(location.href).searchParams.get('doa_internal')==='1';
if(temporary){try{localStorage.setItem(KEY,'1');}catch{}}
window.doaAnalyticsExcluded=()=>{if(temporary||location.hostname!=='doa-bemutato.pages.dev')return true;try{return localStorage.getItem(KEY)==='1';}catch{return true;}};
if(window.doaAnalyticsExcluded())return;
const beacon=document.createElement('script');beacon.type='module';beacon.src='https://static.cloudflareinsights.com/beacon.min.js';beacon.setAttribute('data-cf-beacon',JSON.stringify({token:'0840c739ea1e4a10b18225b1fb7a65b0'}));document.head.append(beacon);
})();
