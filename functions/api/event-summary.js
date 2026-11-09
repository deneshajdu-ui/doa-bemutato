async function equal(a,b){const enc=new TextEncoder();const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(a)),crypto.subtle.digest('SHA-256',enc.encode(b))]);return new Uint8Array(x).every((v,i)=>v===new Uint8Array(y)[i]);}
export async function onRequestGet({request,env}){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
 if(!env.EVENTS_READ_KEY||!await equal(request.headers.get('Authorization')||'','Bearer '+env.EVENTS_READ_KEY))return json({error:'Unauthorized'},401);
 const days=Number(new URL(request.url).searchParams.get('days')||7);if(![0,1,7,30,90,365].includes(days))return json({error:'Invalid period'},400);
 const from=days?new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10):'2026-11-09';
 try{const statements=[env.EVENTS_DB.prepare('SELECT e.key AS event, SUM(CAST(e.value AS INTEGER)) AS total FROM event_daily d, json_each(d.payload) e WHERE d.day>=? GROUP BY e.key').bind(from),env.EVENTS_DB.prepare("SELECT day,COALESCE(json_extract(payload,'$.page_start'),0) AS views,COALESCE(json_extract(payload,'$.\"seconds:page\"'),0) AS seconds FROM event_daily WHERE day>=? ORDER BY day DESC LIMIT 366").bind(from),env.EVENTS_DB.prepare('SELECT MIN(day) AS firstDay,MAX(updated) AS lastEvent,SUM(batches) AS batches FROM event_daily WHERE day>=?').bind(from),env.EVENTS_DB.prepare('SELECT batches FROM event_daily WHERE day=?').bind(new Date().toISOString().slice(0,10))];
 statements.push(env.EVENTS_DB.prepare('SELECT COUNT(DISTINCT visitor) AS visitors FROM visitor_days WHERE day>=?').bind(from));statements.push(env.EVENTS_DB.prepare("SELECT value FROM analytics_meta WHERE key='unique_started_at'"));
 const [totals,daily,meta,today,unique,started]=await env.EVENTS_DB.batch(statements);
 return json({status:'success',from,through:new Date().toISOString().slice(0,10),fetchedAt:new Date().toISOString(),totals:totals.results,daily:daily.results,dailyTruncated:daily.results.length===366,meta:meta.results[0],collectionEnabled:env.EVENTS_ENABLED==='true',todayBatches:today.results[0]?.batches||0,dailyBatchLimit:10000,retention:'no_automatic_deletion',uniqueVisitors:Number(unique.results[0]?.visitors||0),uniqueStartedAt:started.results[0]?.value||null});
 }catch{return json({error:'Event storage unavailable or free quota reached'},503);}
}
