const HOST='https://doa-bemutato.pages.dev';
const sections=['hero','rolunk','celok','peldak','kapcsolodas'];
const keys=new Set(['page_start',...sections.map(k=>'section:'+k),...[25,50,75,100].map(k=>'scroll:'+k),...[15,30,60,120,300,600,1800].map(k=>'engaged:'+k),...sections.concat('page').map(k=>'seconds:'+k),...['top','rolunk','celok','peldak','kapcsolodas'].map(k=>'nav:'+k),...['hnBxDUkWX6p','kz4XqmbwUd1','RQW37BTZAFp','Y1LcnaCCNGN','ymLcgv4kQho'].map(k=>'tour_visible:'+k)]);
export const EVENT_KEYS=[...keys];
export function validateEvents(body){if(!body||!Array.isArray(body.events)||body.events.length<1||body.events.length>15)throw Error('Invalid batch');const merged=new Map();for(const e of body.events){if(!e||!keys.has(e.key)||!Number.isInteger(e.value)||e.value<1||e.value>(e.key.startsWith('seconds:')?60:1))throw Error('Invalid event');merged.set(e.key,(merged.get(e.key)||0)+e.value);}for(const [k,v] of merged)if(v>(k.startsWith('seconds:')?60:1))throw Error('Duplicate event');return [...merged];}
export async function onRequestPost({request,env}){
 if(new URL(request.url).origin!==HOST||request.headers.get('Origin')!==HOST)return new Response(null,{status:403});
 if(!env.EVENTS_DB||env.EVENTS_ENABLED!=='true')return new Response(null,{status:503});
 if(Number(request.headers.get('Content-Length')||0)>5000)return new Response(null,{status:413});
 try{const raw=await request.text();if(raw.length>5000)return new Response(null,{status:413});const body=JSON.parse(raw);const events=validateEvents(body);let visitor=null;if(body.visitor!==undefined){if(typeof body.visitor!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.visitor)||!events.some(([k])=>k==='page_start'))throw Error('Invalid visitor');visitor=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.visitor))),b=>b.toString(16).padStart(2,'0')).join('');events.push(['browser_page_start',1]);}const now=new Date().toISOString(),day=now.slice(0,10);
 const paths=events.map(([key])=>'$.'+JSON.stringify(key));
 const initial=events.flatMap(([,value],i)=>[paths[i],value]);
 const updates=events.flatMap(([,value],i)=>[paths[i],paths[i],value]);
 const sql=`INSERT INTO event_daily(day,payload,updated,batches) VALUES (?,json_set('{}',${events.map(()=> '?,?').join(',')}),?,1) ON CONFLICT(day) DO UPDATE SET payload=json_set(event_daily.payload,${events.map(()=> '?,COALESCE(json_extract(event_daily.payload,?),0)+?').join(',')}),updated=excluded.updated,batches=event_daily.batches+1 WHERE event_daily.batches<10000`;
 const result=await env.EVENTS_DB.prepare(sql).bind(day,...initial,now,...updates).run();
 if(result.meta?.changes!==0&&visitor)await env.EVENTS_DB.prepare('INSERT OR IGNORE INTO visitor_days(day,visitor) VALUES (?,?)').bind(day,visitor).run();
 return new Response(null,{status:result.meta?.changes===0?429:204,headers:{'Cache-Control':'no-store'}});
 }catch(e){return new Response(null,{status:e.message?.startsWith('Invalid')||e.message==='Duplicate event'||e instanceof SyntaxError?400:503,headers:{'Cache-Control':'no-store'}});}
}
export function onRequestGet(){return new Response(null,{status:405,headers:{Allow:'POST'}});}
