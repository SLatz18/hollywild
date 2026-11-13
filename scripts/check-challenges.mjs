#!/usr/bin/env node
/** Independent geometry oracle plus a tiny native-event interpreter. No ROM writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadChallenges,challengeVariableNames,createChallengeEngine} from './challenge-events.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=loadChallenges(root);
let state={},images={},messages=[];
const event=(command,args={},children)=>({command,args,...(children?{children}:{})});
const api={
 ev:event,
 set:(name,value)=>event('SET',{name,value}),
 add:(name,value)=>event('ADD',{name,value}),
 iff:(name,op,value,yes,no=[])=>event('IF',{name,op,value},{true:yes,false:no}),
 text:(...pages)=>event('TEXT',{pages}),
 menu:options=>event('MENU',{options}),
 actorId:(scene,id)=>scene+':'+id,
 spriteId:name=>name
};
const engine=createChallengeEngine(data,api);
const value=x=>typeof x==='string'?state[x]??0:x;
function run(events){
 for(const e of events){
  const a=e.args;
  if(e.command==='SET')state[a.name]=value(a.value);
  else if(e.command==='ADD')state[a.name]=(state[a.name]??0)+value(a.value);
  else if(e.command==='IF'){
   const n=state[a.name]??0,v=value(a.value);
   const pass={eq:n===v,gt:n>v,gte:n>=v,lt:n<v,lte:n<=v}[a.op];
   assert.equal(typeof pass,'boolean','known native comparison');run(e.children[pass?'true':'false']);
  }
  else if(e.command==='EVENT_ACTOR_SET_SPRITE')images[a.actorId]=a.spriteSheetId;
  else if(e.command==='TEXT')messages.push(...a.pages);
  else if(e.command==='MENU')throw Error('Checker must select explicitly at its caller');
  else assert.equal(e.command,'EVENT_SOUND_PLAY_EFFECT','allowed native command');
 }
}
const allSites=[...engine.sites(data.pipes.scene),...engine.sites(data.delivery.scene)];
function site(id){const s=allSites.find(s=>s.id===id);run(engine.site(s,id.startsWith('pipe_')?data.pipes.scene:data.delivery.scene));}
function trigger(id){run(engine.triggers(data.delivery.scene).find(t=>t.id===id).script);}
const fresh=()=>{state=Object.fromEntries(challengeVariableNames(data).map(n=>[n,0]));Object.assign(state,{coins:100,job:0,cycles:0});images={};messages=[];};

// Independent reference: build physical segments and union matching open ports.
// Unlike runtime's directed traversal, this searches undirected port components.
const offsets=[[[0,-1],[1,0]],[[1,0],[0,1]],[[0,1],[-1,0]],[[-1,0],[0,-1]]];
function oracle(rotations){
 const valves=data.pipes.valves,s=data.pipes.source,t=data.pipes.sink;
 const vertices=[...valves,s,t],graph=new Map(vertices.map(v=>[v.id,new Set()]));
 const ports=v=>v.id===s.id?[[1,0]]:v.id===t.id?[[-1,0]]:offsets[rotations[valves.indexOf(v)]];
 for(const a of vertices)for(const [dx,dy]of ports(a)){
  const ray=vertices.filter(b=>b!==a&&(dx?(b.y===a.y&&(b.x-a.x)*dx>0):(b.x===a.x&&(b.y-a.y)*dy>0))).sort((b,c)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)-Math.abs(a.x-c.x)-Math.abs(a.y-c.y));
  const b=ray[0];if(b&&ports(b).some(([x,y])=>x===-dx&&y===-dy)){graph.get(a.id).add(b.id);graph.get(b.id).add(a.id);}
 }
 const pending=[s.id],seen=new Set(pending);
 while(pending.length){for(const next of graph.get(pending.shift()))if(!seen.has(next)){seen.add(next);pending.push(next);}}
 return seen.has(t.id);
}

let solutions=0;
for(let code=0;code<256;code++){
 const rotations=[0,1,2,3].map(i=>(code>>(i*2))&3);
 fresh();state.pipe_paid=1;state.pipe_initialized=1;
 data.pipes.valves.forEach((v,i)=>state['challenge_'+v.id]=rotations[i]);
 run(engine.sceneInit(data.pipes.scene));
 const expected=oracle(rotations);assert.equal(state.pipe_flow,Number(expected),'native geometry code '+code);
 assert.equal(images[data.pipes.scene+':pipe_sink'],expected?'pressure_sink_on':'pressure_sink_off');
 if(expected)solutions++;
 for(const v of data.pipes.valves){
  const old=state['challenge_'+v.id],count=messages.length;
  site(v.id);assert.equal(state['challenge_'+v.id],(old+1)%4);assert.equal(messages.length,count,'rotation has no modal text');
  const current=data.pipes.valves.map(v=>state['challenge_'+v.id]);assert.equal(state.pipe_flow,Number(oracle(current)));
 }
}
assert.equal(solutions,1,'four connected elbows have one physical source-sink route');

fresh();run(engine.sceneInit(data.pipes.scene));
for(const [id,count]of [['pipe_nw',2],['pipe_ne',1],['pipe_se',3]])for(let i=0;i<count;i++)site(id);
assert.equal(state.pipe_flow,1);assert.equal(state.coins,100,'visual solution does not spend/award');
state.job=2;site('pipe_sink');assert.equal(state.pipe_paid,0);assert.equal(state.coins,100);
state.job=0;state.coins=9990;site('pipe_sink');assert.equal(state.pipe_paid,0,'full wallet defers');
state.coins=100;site('pipe_sink');site('pipe_sink');assert.equal(state.coins,125);assert.equal(state.pipe_paid,1);
site('pipe_reset');assert.equal(state.pipe_flow,0);assert.equal(state.pipe_paid,1,'reset never resets paid flag');
for(const [id,count]of [['pipe_nw',2],['pipe_ne',1],['pipe_se',3]])for(let i=0;i<count;i++)site(id);
site('pipe_sink');assert.equal(state.coins,125,'free replay cannot duplicate reward');

fresh();
site('trial_start');trigger('trial_safe_2');assert.equal(state.trial_checkpoint,0,'flags ordered');
for(const id of ['trial_safe_1','trial_safe_1','trial_safe_2','trial_safe_3'])trigger(id);
site('trial_finish');assert.equal(state.trial_paid,12);assert.equal(state.coins,112);
site('trial_finish');assert.equal(state.coins,112,'finish reentry idempotent');
site('trial_start');trigger('trial_shortcut');trigger('trial_rough_1');trigger('trial_rough_2');trigger('trial_short_exit');site('trial_finish');
assert.equal(state.trial_damage,1);assert.equal(state.trial_paid,12);assert.equal(state.coins,112,'worse result does not pay');
site('trial_start');trigger('trial_shortcut');site('trial_finish');assert.equal(state.trial_active,1,'exit required');
trigger('trial_short_back');trigger('trial_short_exit');site('trial_finish');assert.equal(state.trial_route,3,'shortcut retreat cannot be rescued');
// Reset confirmation is a menu. Model only its chosen native branch, as a user
// pressing Reset would, without skipping any gameplay success condition.
const startScript=engine.site(allSites.find(s=>s.id==='trial_start'),data.delivery.scene);
const activeBranch=startScript.at(-1).children.true;
state.choice=1;run(activeBranch.filter(e=>e.command!=='MENU'));
assert.equal(state.trial_route,0);assert.equal(state.trial_paid,12);
trigger('trial_shortcut');trigger('trial_short_exit');state.job=2;site('trial_finish');
assert.equal(state.trial_result,16);assert.equal(state.trial_paid,12);assert.equal(state.coins,112,'ordinary job defers trial payout');
site('trial_start');assert.equal(state.trial_result,16,'pending improvement blocks restart');
state.job=0;state.coins=9996;site('trial_finish');assert.equal(state.trial_paid,12,'exact improvement does not fit');
state.coins=9995;site('trial_finish');assert.equal(state.coins,9999);assert.equal(state.trial_paid,16,'exact improvement fits');
site('trial_finish');assert.equal(state.coins,9999);assert.equal(state.cycles,0,'trial never ticks production');

for(const paid of [0,6,12,16])for(const score of [6,12,16])for(const job of [0,2]){
 fresh();Object.assign(state,{trial_paid:paid,trial_result:score,job});
 site('trial_finish');assert.equal(state.coins,100+(job===0?Math.max(0,score-paid):0));
 assert.equal(state.trial_paid,job===0?Math.max(score,paid):paid);
}
fresh();site('trial_start');trigger('trial_safe_1');trigger('trial_rough_1');trigger('trial_safe_2');trigger('trial_safe_3');site('trial_finish');
assert.equal(state.trial_result,6,'a rough hit damages the parcel on the long route too');
assert.equal(state.coins,106);assert.equal(state.trial_paid,6);

// Verify authored overlays remain walkable and never overlap existing actors.
const worlds=JSON.parse(fs.readFileSync(path.join(root,'world-layout.json'),'utf8')).scenes;
for(const sceneId of [data.pipes.scene,data.delivery.scene]){
 const world=worlds.find(w=>w.id===sceneId),width=world.width/8;
 for(const s of engine.sites(sceneId)){
  assert.equal(world.collisions[s.y*width+s.x],0,'challenge actor floor '+s.id);
  for(const old of world.sites.filter(old=>old.type!=='physical_challenge'))assert.ok(Math.abs(old.x-s.x)>=2||Math.abs(old.y-s.y)>=2,'new actor overlaps '+old.id);
 }
}
const roof=worlds.find(w=>w.id===data.delivery.scene),width=roof.width/8;
for(let y=18;y<=23;y++){
 assert.ok(roof.collisions[y*width+11]&&roof.collisions[y*width+18],'shortcut side walls enclose lane');
}
console.log(`Physical challenges pass: 256 pipe orientations, 1024 silent rotations, ${solutions} geometric solution; reset/reward guards, route ordering, corridor escape guard, capped improvements and pending payout tables.`);
