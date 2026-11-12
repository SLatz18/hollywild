#!/usr/bin/env node
/** Verify authored data and independently execute the emitted native events. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadCampaign, wrapCampaignPages } from './campaign-events.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const campaign=loadCampaign(root);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'gameplay-source.json'),'utf8'));
const scripts=new Map(fs.readdirSync(path.join(root,'project/scripts')).filter(f=>f.endsWith('.gbsres')).map(f=>{const s=JSON.parse(fs.readFileSync(path.join(root,'project/scripts',f),'utf8'));return [s.id,s];}));
const byName=new Map([...scripts.values()].map(s=>[s.symbol.replace('script_story_',''),s]));
const id=name=>{assert(manifest.variables[name],`Missing ${name}`);return manifest.variables[name].id;};
let checks=0;
function machine(initial={}){
 const state=Object.fromEntries(Object.entries(initial).map(([key,value])=>[id(key),value]));
 let decisions=[],pages=[];
 const value=v=>v.type==='variable'?(state[v.value]??0):v.value;
 function run(events){for(const event of events){const a=event.args??{};
  switch(event.command){
   case 'EVENT_TEXT': pages.push(...a.text);break;
   case 'EVENT_SET_VALUE':state[a.variable]=value(a.value);break;
   case 'EVENT_VARIABLE_MATH':{const n=a.other==='var'?(state[a.vectorY]??0):a.value;assert(['add','sub'].includes(a.operation));state[a.vectorX]=(state[a.vectorX]??0)+(a.operation==='add'?n:-n);break;}
   case 'EVENT_IF':{const c=a.condition,x=value(c.valueA),y=value(c.valueB),op={eq:x===y,lt:x<y,lte:x<=y,gt:x>y,gte:x>=y,ne:x!==y}[c.type];assert.notEqual(op,undefined);run(event.children[op?'true':'false']??[]);break;}
   case 'EVENT_MENU':assert(decisions.length,'Unexpected menu');state[a.variable]=decisions.shift();break;
   case 'EVENT_CALL_CUSTOM_EVENT':assert(scripts.has(a.customEventId),'Missing custom script');run(scripts.get(a.customEventId).script);break;
   default:throw Error(`Unexpected campaign event ${event.command}`);
  }
 }}
 return {get:n=>state[id(n)]??0,set:(n,v)=>{state[id(n)]=v;},snapshot:()=>Object.fromEntries(Object.entries(state).filter(([key])=>key!==id('choice'))),pages:()=>pages,execute:(name,answers=[])=>{pages=[];decisions=[...answers];assert(byName.has(name),'Missing script '+name);run(byName.get(name).script);assert.equal(decisions.length,0);checks++;}};
}
for(const ending of [1,2,3]){
 const m=machine({coins:100});
 m.execute('desk',[0]);assert.equal(m.get('story_mission'),0);
 m.execute('desk',[1]);assert.equal(m.get('story_mission'),1);
 for(const mission of campaign.missions){
  for(const [i,step]of mission.steps.entries()){
   const site='node_'+step.node;
   assert.equal(m.get('story_mission'),mission.id);assert.equal(m.get('story_step'),i);
   if(['puzzle','choice'].includes(step.type)){
    const snapshot=m.snapshot();m.execute(site,[0]);assert.deepEqual(m.snapshot(),snapshot,`${mission.id}:${i} B changed state`);
   }
   if(step.type==='puzzle'){
    const snapshot=m.snapshot();m.execute(site,[step.answer===1?2:1]);assert.deepEqual(m.snapshot(),snapshot,`${mission.id}:${i} wrong answer changed state`);
   }
   const beforeCoins=m.get('coins'),beforeScrap=m.get('salvage');
   if(i===mission.steps.length-1){
    // Completion flags survive all three payout-blocking conditions.
    m.set('job',1);m.execute(site,step.type==='puzzle'?[step.answer]:step.type==='choice'?[step.choiceKey==='ending'?ending:1]:[]);
    assert.equal(m.get('story_step'),mission.steps.length);assert.equal(m.get('story_mission'),mission.id);assert.equal(m.get('coins'),beforeCoins);assert.equal(m.get('salvage'),beforeScrap);
    m.set('job',0);
    if(mission.reward.coins>0){m.set('coins',9999);m.execute('journal');assert.equal(m.get('story_mission'),mission.id);m.set('coins',beforeCoins);}
    if(mission.reward.salvage>0){m.set('salvage',99);m.execute('journal');assert.equal(m.get('story_mission'),mission.id);m.set('salvage',beforeScrap);}
    m.execute('journal');
    assert.equal(m.get('story_mission'),mission.id+1);assert.equal(m.get('story_completed'),mission.id);assert.equal(m.get('story_step'),0);
    assert.equal(m.get('coins'),beforeCoins+mission.reward.coins);assert.equal(m.get('salvage'),beforeScrap+mission.reward.salvage);assert.equal(m.get('cycles'),0);
    // Journal replay never pays the completed mission twice or advances a step.
    const snapshot=m.snapshot();m.execute('journal');assert.deepEqual(m.snapshot(),snapshot);
   }else{
    m.execute(site,step.type==='puzzle'?[step.answer]:step.type==='choice'?[step.choiceKey==='ending'?ending:1]:[]);
    assert.equal(m.get('story_step'),i+1,`${mission.id}:${i} cascaded or did not advance`);assert.equal(m.get('story_mission'),mission.id);
    assert.equal(m.get('coins'),beforeCoins);assert.equal(m.get('salvage'),beforeScrap);
   }
  }
 }
 assert.equal(m.get('story_mission'),25);assert.equal(m.get('story_completed'),24);assert.equal(m.get('story_ending'),ending);assert.equal(m.get('festival'),1);assert.equal(m.get('aurora'),1);
 const snapshot=m.snapshot();m.execute('journal');m.execute('desk');assert.deepEqual(m.snapshot(),snapshot);
}
// Clues must be a pure read: exactly completed pages from this mission,
// including a fully completed mission waiting for reward settlement.
for(const mission of campaign.missions){
 for(let completed=0;completed<=mission.steps.length;completed++){
  const m=machine({story_mission:mission.id,story_step:completed,story_completed:mission.id-1,coins:432,salvage:27,job:2,story_route:1,story_policy:2,story_trust:1,story_ending:3});
  const before=m.snapshot();m.execute('clues');assert.deepEqual(m.snapshot(),before,'Clues changed persistent state');
  const expected=[...wrapCampaignPages([`Clues: ${mission.title}`]),...(completed===0?wrapCampaignPages(['No clues yet for this mission. Follow the next lead in START > Story.']):[]),...mission.steps.slice(0,completed).flatMap(s=>wrapCampaignPages(s.pages))];
  assert.deepEqual(m.pages(),expected,`Clues exposed future or other mission text at ${mission.id}:${completed}`);
 }
}
for(const stage of [0,25]){const m=machine({story_mission:stage});const before=m.snapshot();m.execute('clues');assert.deepEqual(m.snapshot(),before);assert(m.pages().length>0);}
for(const lore of campaign.lore){const m=machine();m.execute('node_'+lore.node);assert.equal(m.get('story_mission'),0);assert.equal(m.get('lore_'+lore.id),1);assert.equal(m.get('coins'),0);assert.equal(m.get('salvage'),0);}
for(const s of scripts.values()){
 const visit=events=>events.forEach(e=>{if(e.command==='EVENT_TEXT')for(const p of e.args.text){assert(p.split('\n').length<=5);assert(p.split('\n').every(l=>l.length<=18));}if(e.command==='EVENT_MENU')assert(e.args.items<=7);for(const children of Object.values(e.children??{}))visit(children);});visit(s.script);
}
assert(wrapCampaignPages(['A long line with enough words to need several readable lines.']).every(p=>p.split('\n').every(l=>l.length<=18)));
console.log(JSON.stringify({passed:true,missionCount:campaign.missions.length,loreCount:campaign.lore.length,endings:3,nativeInteractionChecks:checks,checks:['B cancellation','wrong puzzle retries','one step per interaction','active-job pending rewards','wallet/storage pending rewards','one-time rewards','no production ticks','all three endings','freeplay journal','lore persistence','Clues read-only','Clues excludes future pages','18x5 dialogue','menu limits']},null,2));
