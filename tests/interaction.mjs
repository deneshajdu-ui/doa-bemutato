import vm from 'node:vm';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const gate=readFileSync(new URL('../analytics-gate.js',import.meta.url),'utf8');
function page({ua='Chrome/151 Linux',webdriver=false,flag=false,url='https://doa-bemutato.pages.dev/'}={}){
 const listeners=new Map(),scripts=[],values=new Map(flag?[['doa-analytics-excluded-v1','1']]:[]);let notified=0;
 const c={URL,Event,navigator:{userAgent:ua,webdriver},location:new URL(url),localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},document:{visibilityState:'visible',hasFocus:()=>true,head:{append:s=>scripts.push(s)},createElement:()=>({setAttribute(){}})},addEventListener(t,f){listeners.set(t,f)},removeEventListener(t){listeners.delete(t)},dispatchEvent(e){if(e.type==='doa-analytics-ready')notified++}};c.window=c;vm.runInNewContext(gate,c);
 return{c,scripts,values,get notified(){return notified},input(type,extra={}){listeners.get(type)?.({type,isTrusted:true,...extra})}};
}
for(const ua of ['Chrome/151 Linux','Chrome/151 Android Mobile'])for(let i=0;i<6;i++){const p=page({ua});assert.equal(p.scripts.length,0);p.input('pointerdown',{isTrusted:false});p.input('click',{isTrusted:false});p.input('scroll');p.input('mousemove');assert.equal(p.scripts.length,0);}
for(const type of ['pointerdown','touchstart','click','keydown','wheel']){const p=page();p.input(type,{key:'Tab',deltaY:10});assert.equal(p.scripts.length,1,type);assert.equal(p.notified,1);p.input(type,{key:'Enter',deltaY:10});assert.equal(p.scripts.length,1);}
for(const options of [{flag:true},{webdriver:true},{ua:'HeadlessChrome/151'},{ua:'Chrome-Lighthouse'},{url:'https://doa-bemutato.pages.dev/?doa_internal=1'},{url:'https://preview.pages.dev/'}]){const p=page(options);p.input('click');assert.equal(p.scripts.length,0);assert.equal(p.c.doaAnalyticsReady,false);}
for(const state of ['hidden','unfocused']){const p=page();if(state==='hidden')p.c.document.visibilityState='hidden';else p.c.document.hasFocus=()=>false;p.input('click');assert.equal(p.scripts.length,0);}
const p=page();p.input('keydown',{key:'Shift'});p.input('wheel',{deltaY:0});assert.equal(p.scripts.length,0);p.values.set('doa-analytics-excluded-v1','1');p.input('click');assert.equal(p.scripts.length,0);
// A remembered consent must not start event tracking before input, but must resume after it.
const events=readFileSync(new URL('../events.js',import.meta.url),'utf8');
const t=page();t.values.set('doa-event-consent-v2','yes');let intervals=0;const handlers=new Map();
t.c.addEventListener=(type,fn)=>handlers.set(type,fn);t.c.document.addEventListener=()=>{};t.c.document.querySelector=()=>null;t.c.document.querySelectorAll=()=>[];
t.c.document.body={append(){}};t.c.document.createElement=()=>({setAttribute(){},addEventListener(){},querySelector:()=>({})});t.c.document.documentElement={scrollHeight:1000};
Object.assign(t.c,{Date,Map,Set,crypto:{randomUUID:()=> '12345678-1234-4234-8234-123456789abc'},innerHeight:500,scrollY:0,setInterval:()=>++intervals,clearInterval(){},requestAnimationFrame:fn=>fn()});
vm.runInNewContext(events,t.c);assert.equal(intervals,0);t.c.doaAnalyticsReady=true;handlers.get('doa-analytics-ready')();assert.equal(intervals,2);
console.log('PASS: 12 fresh desktop/mobile loads emit zero beacons; trusted input emits exactly one; synthetic/hidden/excluded contexts emit none; remembered consent waits for input.');
