#!/usr/bin/env node
/** Execute engine output with independent native-event semantics; no ROM mutation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSideEngine, loadSideStories, sideVariableNames, validateSideStories, SIDE_NODES } from './side-events.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// A full schema fixture keeps the state-machine test runnable during authoring.
const fixture=()=>({title:'Neighborhood stories',tracks:[
 ...['courier','listing','neighbors','rivals'].map(id=>({id,kind:'arc',perk:'perk_'+id})),
 ...Array.from({length:6},(_,i)=>({id:'moment_'+i,kind:'encounter'})),
 ...['cocoa','parcel','toolworks','flats'].map(id=>({id,kind:'project',requires:id,perk:'perk_'+id}))
].map((t,i)=>({...t,label:'Track'+i,title:'A small story',home:'garage',intro:['A new lead.'],complete:['The story is complete.'],completionReactions:[{value:1,pages:['The first route is remembered.']},{value:2,pages:['The second route is remembered.']}],missions:Array.from({length:t.kind==='arc'?3:1},(_,mi)=>({title:'A useful mission',intro:['Find your lead.'],outro:['The work is done.'],reward:{coins:25,salvage:i<8&&mi===0?1:0},steps:Array.from({length:t.kind==='arc'?5:t.kind==='encounter'?3:4},(_,si)=>({node:si===0?'garage':'frostwick',type:mi===0&&si===0?'choice':si===1?'puzzle':'talk',hint:'Find the next lead.',pages:['A clear clue.'],...(mi===0&&si===0?{options:['First','Second'],outcomes:[['First route.'],['Second route.']]}:si===1?{options:['Yes','No'],answer:1,wrong:['Try the other answer.']}:{} )}))}))}))});
const data=fs.existsSync(path.join(root,'content/side-stories.json'))?loadSideStories(root):validateSideStories(fixture());
const scripts=new Map();
const ev=(command,args={},children)=>({command,args,...(children?{children}:{})});
const N=value=>({type:'number',value}),V=value=>({type:'variable',value});
const iff=(name,type,value,yes,no=[])=>ev('EVENT_IF',{condition:{type,valueA:V(name),valueB:N(value)}},{true:yes,false:no});
const set=(name,value)=>ev('EVENT_SET_VALUE',{variable:name,value:N(value)});
const add=(name,value)=>ev('EVENT_VARIABLE_MATH',{vectorX:name,operation:'add',other:'val',value});
const text=(...pages)=>ev('EVENT_TEXT',{text:pages});
const menu=options=>ev('EVENT_MENU',{variable:'choice',items:options.length,cancelOnB:true,options});
const share=(key,build)=>{if(!scripts.has(key)){scripts.set(key,[]);scripts.set(key,build());}return [ev('EVENT_CALL_CUSTOM_EVENT',{customEventId:key})];};
const engine=createSideEngine(data,{ev,iff,set,add,text,menu,share});
const journal=engine.journal(),nodes=new Map(SIDE_NODES.map(n=>[n,engine.node(n)]));
let checks=0;
function machine(initial={}){
 const state={...initial};let pages=[],answers=[];
 const val=v=>v.type==='variable'?(state[v.value]??0):v.value;
 function run(events){for(const e of events){const a=e.args;
  switch(e.command){
   case 'EVENT_TEXT':pages.push(...a.text);break;
   case 'EVENT_SET_VALUE':state[a.variable]=val(a.value);break;
   case 'EVENT_VARIABLE_MATH':assert.equal(a.operation,'add');state[a.vectorX]=(state[a.vectorX]??0)+a.value;break;
   case 'EVENT_MENU':assert(answers.length,'Unexpected menu');state[a.variable]=answers.shift();break;
   case 'EVENT_CALL_CUSTOM_EVENT':assert(scripts.has(a.customEventId));run(scripts.get(a.customEventId));break;
   case 'EVENT_IF':{const c=a.condition,x=val(c.valueA),y=val(c.valueB);const result={eq:x===y,ne:x!==y,gt:x>y,gte:x>=y,lt:x<y,lte:x<=y}[c.type];assert.notEqual(result,undefined);run(e.children[result?'true':'false']);break;}
   default:throw Error('Unexpected event '+e.command);
  }
 }}
 return {get:n=>state[n]??0,set:(n,v)=>state[n]=v,snapshot:()=>Object.fromEntries(Object.entries(state).filter(([k,v])=>k!=='choice'&&v!==0).sort(([a],[b])=>a.localeCompare(b))),pages:()=>pages,execute:(events,choices=[])=>{answers=[...choices];pages=[];run(events);assert.equal(answers.length,0,'Unused menu answers');checks++;}};
}
const key=(t,k)=>'side_'+t.id+'_'+k;
const kindIndex=t=>['arc','encounter','project'].indexOf(t.kind)+1;
const selection=(t,scene)=>[kindIndex(t),data.tracks.filter(x=>x.kind===t.kind&&(scene===null||x.home===scene||x.missions.some(m=>m.steps.some(s=>s.node===scene)))).indexOf(t)+1];
const visit=(machine,t,scene,extra=[])=>machine.execute(scene===null?journal:nodes.get(scene),[...selection(t,scene),...extra]);
assert.equal(new Set(sideVariableNames(data)).size,sideVariableNames(data).length);
for(const option of [1,2])for(const t of data.tracks){
 const initial={coins:100,story_mission:7,story_step:2,cycles:9,...(t.requires?{[t.requires]:1}:{})};
 const m=machine(initial),before=m.snapshot();
 m.execute(nodes.get(t.home),[0]);assert.deepEqual(m.snapshot(),before);
 m.execute(nodes.get(t.home),[kindIndex(t),0]);assert.deepEqual(m.snapshot(),before);
 visit(m,t,null);assert.deepEqual(m.snapshot(),before,'Journal started track');
 visit(m,t,t.home,[0]);assert.deepEqual(m.snapshot(),before,'Begin cancellation changed state');
 if(t.requires){m.set(t.requires,0);const locked=m.snapshot();visit(m,t,t.home);assert.deepEqual(m.snapshot(),locked,'Unowned project started');m.set(t.requires,1);}
 visit(m,t,t.home,[1]);assert.equal(m.get(key(t,'mission')),1);assert.equal(m.get(key(t,'step')),0);
 for(const [mi,mission]of t.missions.entries())for(const [si,s]of mission.steps.entries()){
  assert.equal(m.get(key(t,'mission')),mi+1);assert.equal(m.get(key(t,'step')),si);
  let snap=m.snapshot();visit(m,t,null);assert.deepEqual(m.snapshot(),snap,'Journal advanced a step');
  const wrongScene=SIDE_NODES.find(n=>n!==s.node&&(t.home===n||t.missions.some(mm=>mm.steps.some(ss=>ss.node===n))));
  if(wrongScene){snap=m.snapshot();visit(m,t,wrongScene);assert.deepEqual(m.snapshot(),snap,'Wrong node advanced a step');}
  if(['choice','puzzle'].includes(s.type)){snap=m.snapshot();visit(m,t,s.node,[0]);assert.deepEqual(m.snapshot(),snap,'B mutated persistent state');}
  if(s.type==='puzzle'){snap=m.snapshot();visit(m,t,s.node,[s.answer===1?2:1]);assert.deepEqual(m.snapshot(),snap,'Wrong answer advanced');}
  const answer=s.type==='choice'?[Math.min(option,s.options.length)]:s.type==='puzzle'?[s.answer]:[];
  const coins=m.get('coins'),scrap=m.get('salvage');
  if(si===mission.steps.length-1){
   m.set('job',1);visit(m,t,s.node,answer);assert.equal(m.get(key(t,'step')),mission.steps.length);assert.equal(m.get(key(t,'mission')),mi+1);assert.equal(m.get('coins'),coins);assert.equal(m.get('salvage'),scrap);
   m.set('job',0);
   if(mission.reward.coins){m.set('coins',10000-mission.reward.coins);snap=m.snapshot();visit(m,t,null);assert.deepEqual(m.snapshot(),snap,'Wallet overflow paid reward');m.set('coins',coins);}
   if(mission.reward.salvage){m.set('salvage',100-mission.reward.salvage);snap=m.snapshot();visit(m,t,s.node);assert.deepEqual(m.snapshot(),snap,'Storage overflow paid reward');m.set('salvage',scrap);}
   // Recreate the machine from persisted fields before retrying the reward.
   const restored=machine(Object.fromEntries(Object.entries(m.snapshot())));visit(restored,t,null);assert.equal(restored.get(key(t,'mission')),mi+2);
   visit(m,t,option===1?null:s.node);assert.equal(m.get(key(t,'mission')),mi+2);assert.equal(m.get(key(t,'step')),0);assert.equal(m.get('coins'),coins+mission.reward.coins);assert.equal(m.get('salvage'),scrap+mission.reward.salvage);
   snap=m.snapshot();visit(m,t,null);assert.deepEqual(m.snapshot(),snap,'Reward replay changed state');
  }else{visit(m,t,s.node,answer);assert.equal(m.get(key(t,'step')),si+1,'Cascading steps');assert.equal(m.get('coins'),coins);assert.equal(m.get('salvage'),scrap);}
  assert.equal(m.get('story_mission'),7);assert.equal(m.get('story_step'),2);assert.equal(m.get('cycles'),9);
 }
 assert.equal(m.get(key(t,'mission')),t.missions.length+1);if(t.perk)assert.equal(m.get(t.perk),1);
 const snap=m.snapshot();visit(m,t,t.home);visit(m,t,null);assert.deepEqual(m.snapshot(),snap,'Completed replay changed persistent state');
}
// All tracks can stay active together; repeated scene visits advance only the selected track.
const simultaneous=machine(Object.fromEntries(['cocoa','parcel','toolworks','flats'].map(p=>[p,1])));
for(const t of data.tracks)visit(simultaneous,t,t.home,[1]);
for(const t of data.tracks){const s=t.missions[0].steps[0],before=simultaneous.snapshot();visit(simultaneous,t,s.node,s.type==='choice'?[1]:s.type==='puzzle'?[s.answer]:[]);for(const other of data.tracks.filter(o=>o!==t))for(const field of ['mission','step','choice'])assert.equal(simultaneous.get(key(other,field)),before[key(other,field)]??0,'Cross-track mutation');}
let eventCount=0;
function inspect(events){for(const e of events){eventCount++;if(e.command==='EVENT_TEXT')for(const p of e.args.text){assert(p.split('\n').length<=5);assert(p.split('\n').every(l=>l.length<=18));assert(!/[^\x20-\x7e\n]/.test(p));}if(e.command==='EVENT_MENU'){assert(e.args.items<=7);assert(e.args.cancelOnB);}for(const children of Object.values(e.children??{}))inspect(children);}}
for(const events of [journal,...nodes.values(),...scripts.values()])inspect(events);
// Validators reject malformed state contracts, choices and reward pressure.
for(const mutate of [d=>d.tracks[1].id=d.tracks[0].id,d=>d.tracks[0].missions[0].steps[0].node='missing',d=>d.tracks[0].missions[0].reward.coins=9999,d=>d.tracks[0].missions[0].steps[0].pages=['Non ASCII \u2014'],d=>d.tracks[0].completionReactions=[]]){
 const invalid=fixture();mutate(invalid);assert.throws(()=>validateSideStories(invalid));
}
console.log(JSON.stringify({passed:true,source:fs.existsSync(path.join(root,'content/side-stories.json'))?'authored':'fixture',tracks:data.tracks.length,missions:data.tracks.reduce((n,t)=>n+t.missions.length,0),checks,customScripts:scripts.size,eventCount,coverage:['category and track cancellation','Begin cancellation','read-only journal','ownership gate','wrong-node hints','wrong answers and retry','single step per interaction','job wallet storage guards','reward retry at node and journal','once-only rewards and perks','save-state restore semantics','independent simultaneous tracks','main story isolation','no production ticks','ASCII 18x5 text','banked custom scripts','schema rejection']},null,2));
