/** Independent, bankable native neighborhood stories. */
import fs from 'node:fs';
import path from 'node:path';
import { wrapCampaignPages } from './campaign-events.mjs';
export const SIDE_NODES = 'garage frostwick candy brassworks velvet aurora cocoa_interior parcel_interior toolworks_interior flats_interior frostwick_archive frostwick_depot candy_sorting candy_rooftops brassworks_foundry brassworks_control velvet_lodge velvet_rooftops aurora_signal aurora_core'.split(' ');
export const SIDE_NAMES = {"frostwick": "Frostwick", "candy": "Candy Row", "brassworks": "Brassworks", "velvet": "Velvet Heights", "aurora": "Aurora Yard", "garage": "Your Garage", "cocoa_interior": "Cocoa Corner", "parcel_interior": "Parcel Palace", "toolworks_interior": "Tinsel Toolworks", "flats_interior": "Lantern Flats", "frostwick_archive": "Frostwick Archive", "frostwick_depot": "Frostwick Depot", "candy_sorting": "Candy Sorting", "candy_rooftops": "Candy Rooftops", "brassworks_foundry": "Brassworks Foundry", "brassworks_control": "Brassworks Control", "velvet_lodge": "Velvet Lodge", "velvet_rooftops": "Velvet Rooftops", "aurora_signal": "Aurora Signal", "aurora_core": "Aurora Core"};
const properties=['cocoa','parcel','toolworks','flats'];
const perks=['perk_courier','perk_listing','perk_neighbors','perk_rivals',...properties.map(p=>'perk_'+p)];
export function validateSideStories(data){
 const fail=m=>{throw Error('Side stories: '+m);};
 const pages=(p,w)=>{if(!Array.isArray(p)||!p.length||p.some(s=>typeof s!=='string'||!s.trim()||/[^\x20-\x7e\n]/.test(s)))fail('invalid ASCII pages '+w);wrapCampaignPages(p);};
 const options=(p,w)=>{if(!Array.isArray(p)||p.length<2||p.length>4||p.some(s=>typeof s!=='string'||!s.trim()||s.length>7||/[^\x20-\x7e]/.test(s)))fail('invalid options '+w);};
 pages([data.title],'title');
 if(!Array.isArray(data.tracks)||data.tracks.length!==14)fail('requires 14 tracks');
 const ids=new Set(),usedPerks=new Set();let scrap=0;
 for(const kind of ['arc','encounter','project']){
  const tracks=data.tracks.filter(t=>t.kind===kind);
  if(tracks.length!==({arc:4,encounter:6,project:4}[kind]))fail('wrong '+kind+' count');
  if(new Set(tracks.map(t=>t.label)).size!==tracks.length)fail('duplicate menu label '+kind);
 }
 for(const t of data.tracks){
  if(typeof t.id!=='string'||! /^[a-z][a-z0-9_]*$/.test(t.id)||ids.has(t.id))fail('bad/duplicate ID '+t.id);ids.add(t.id);
  if(typeof t.label!=='string'||!t.label.trim()||t.label.length>7||/[^\x20-\x7e]/.test(t.label))fail('bad label '+t.id);
  pages([t.title],t.id+' title');pages(t.intro,t.id+' intro');pages(t.complete,t.id+' complete');
  if(!SIDE_NODES.includes(t.home))fail('unknown home '+t.home);
  if(t.requires!==undefined&&(t.kind!=='project'||!properties.includes(t.requires)))fail('invalid ownership '+t.id);
  if(t.kind==='project'&&!properties.includes(t.requires))fail('project requires ownership '+t.id);
  if(t.perk!==undefined&&(!perks.includes(t.perk)||usedPerks.has(t.perk)))fail('bad/duplicate perk '+t.id);if(t.perk)usedPerks.add(t.perk);
  if(t.kind==='project'&&t.perk!=='perk_'+t.requires)fail('project perk mismatch '+t.id);
  if(t.kind==='arc'&&!perks.slice(0,4).includes(t.perk))fail('arc perk mismatch '+t.id);
  if(t.kind==='encounter'&&t.perk!==undefined)fail('encounter cannot grant a perk '+t.id);
  if(!Array.isArray(t.missions)||t.missions.length!==(t.kind==='arc'?3:1))fail('bad mission count '+t.id);
  let choice;
  const reactions=[];
  for(const [mi,m]of t.missions.entries()){
   const where=t.id+':'+mi;pages([m.title],where+' title');pages(m.intro,where+' intro');pages(m.outro,where+' outro');
   const [min,max]=t.kind==='arc'?[5,7]:t.kind==='encounter'?[3,4]:[4,5];
   if(!Array.isArray(m.steps)||m.steps.length<min||m.steps.length>max)fail('bad step count '+where);
   for(const [si,s]of m.steps.entries()){
    const w=where+':'+si;
    if(!SIDE_NODES.includes(s.node))fail('unknown node '+s.node);
    if(!['talk','collect','puzzle','choice'].includes(s.type))fail('bad step type '+w);
    pages([s.hint],w+' hint');pages(s.pages,w);
    if(['puzzle','choice'].includes(s.type))options(s.options,w);
    if(s.type==='puzzle'){if(!Number.isInteger(s.answer)||s.answer<1||s.answer>s.options.length)fail('bad answer '+w);pages(s.wrong,w+' wrong');}
    if(s.type==='choice'){if(choice)fail('more than one choice '+t.id);choice={mi,si,count:s.options.length};if(!Array.isArray(s.outcomes)||s.outcomes.length!==s.options.length)fail('bad outcomes '+w);s.outcomes.forEach(p=>pages(p,w+' outcome'));}
    if(s.reactions!==undefined&&!Array.isArray(s.reactions))fail('bad reactions '+w);
    for(const r of s.reactions??[]){if(!Number.isInteger(r.value)||r.value<1||r.value>4)fail('bad reaction '+w);pages(r.pages,w+' reaction');reactions.push({mi,si,value:r.value});}
   }
   if(!m.reward||!Number.isInteger(m.reward.coins)||m.reward.coins<(t.kind==='project'?0:25)||m.reward.coins>60||!Number.isInteger(m.reward.salvage)||m.reward.salvage<0||m.reward.salvage>35)fail('invalid reward '+where);
   scrap+=m.reward.salvage;
  }
  if(t.completionReactions!==undefined&&!Array.isArray(t.completionReactions))fail('bad completion reactions '+t.id);
  for(const r of t.completionReactions??[]){if(!Number.isInteger(r.value)||r.value<1||r.value>4)fail('bad completion reaction '+t.id);pages(r.pages,t.id+' completion reaction');reactions.push({mi:t.missions.length,si:0,value:r.value});}
  if(reactions.length&&!choice)fail('reactions without choice '+t.id);
  for(const r of reactions)if(r.value>choice.count||r.mi<choice.mi||(r.mi===choice.mi&&r.si<=choice.si))fail('reaction precedes choice '+t.id);
  if(choice)for(let value=1;value<=choice.count;value++)if(!reactions.some(r=>r.value===value))fail('choice lacks later consequence '+t.id+'='+value);
 }
 if(scrap>35)fail('total scrap exceeds 35');
 for(const p of perks)if(!usedPerks.has(p))fail('missing perk '+p);
 return data;
}
export const loadSideStories=root=>validateSideStories(JSON.parse(fs.readFileSync(path.join(root,'content/side-stories.json'),'utf8')));
export const sideVariableNames=data=>[...data.tracks.flatMap(t=>['mission','step','choice'].map(k=>'side_'+t.id+'_'+k)),...perks];
export function createSideEngine(data,{ev,iff,set,add,text,menu,share=(key,build)=>build()}){
 const say=p=>text(...wrapCampaignPages(p));
 const select=(name,entries,fallback=[])=>entries.reduceRight((tail,[value,script])=>[iff(name,'eq',value,script,tail)],fallback);
 const variable=(t,k)=>'side_'+t.id+'_'+k;
 const reactions=(t,list)=> (list??[]).map(r=>iff(variable(t,'choice'),'eq',r.value,[say(r.pages)]));
 const finish=(t,m,mi)=>share('side_finish_'+t.id+'_'+mi,()=>[
  iff(variable(t,'mission'),'eq',mi+1,[iff(variable(t,'step'),'eq',m.steps.length,[
   iff('job','eq',0,[iff('coins','lte',9999-m.reward.coins,[iff('salvage','lte',99-m.reward.salvage,[
    add('coins',m.reward.coins),add('salvage',m.reward.salvage),set(variable(t,'step'),0),set(variable(t,'mission'),mi+2),say(m.outro),say([`Reward: ${m.reward.coins} Coins and ${m.reward.salvage} scrap.`]),
    ...(mi===t.missions.length-1?[...(t.perk?[set(t.perk,1)]:[]),say(t.complete),...reactions(t,t.completionReactions)]:[say(t.missions[mi+1].intro),say([t.missions[mi+1].steps[0].hint])])
   ],[say(['Reward pending. Make room in scrap storage, then return or use Side.'])])],[say(['Reward pending. Spend some Coins, then return or use Side.'])])],[say(['Reward pending. Finish or cancel your job, then return or use Side.'])])
  ])])
 ]);
 const advance=(t,m,mi,si)=>[set(variable(t,'step'),si+1),...(si===m.steps.length-1?finish(t,m,mi):[say([m.steps[si+1].hint])])];
 const step=(t,m,mi,s,si)=>share('side_step_'+t.id+'_'+mi+'_'+si,()=>{
  const prefix=[say(s.pages),...reactions(t,s.reactions)];
  if(s.type==='puzzle')return [...prefix,menu(s.options),iff('choice','eq',s.answer,advance(t,m,mi,si),[iff('choice','gt',0,[say(s.wrong)])])];
  if(s.type==='choice')return [...prefix,menu(s.options),...select('choice',s.options.map((_,i)=>[i+1,[set(variable(t,'choice'),i+1),say(s.outcomes[i]),...advance(t,m,mi,si)]]))];
  return [...prefix,...advance(t,m,mi,si)];
 });
 const track=(t,scene,journal)=>share('side_track_'+t.id+'_'+(journal?'journal':scene),()=>select(variable(t,'mission'),[
  [0,journal||scene!==t.home?[say([t.title,...t.intro,`Begin at ${SIDE_NAMES[t.home]}.`])]:[
   say([t.title,...t.intro]),...(t.requires?[iff(t.requires,'eq',0,[say(['Buy this property before beginning its project.'])],[menu(['Begin','Back']),iff('choice','eq',1,[set(variable(t,'mission'),1),set(variable(t,'step'),0),say(t.missions[0].intro),say([t.missions[0].steps[0].hint])])])]:[menu(['Begin','Back']),iff('choice','eq',1,[set(variable(t,'mission'),1),set(variable(t,'step'),0),say(t.missions[0].intro),say([t.missions[0].steps[0].hint])])])
  ]],
  ...t.missions.map((m,mi)=>[mi+1,[say([t.title,m.title]),...select(variable(t,'step'),[
   ...m.steps.map((s,si)=>[si,journal||scene!==s.node?[say([s.hint])]:step(t,m,mi,s,si)]),
   [m.steps.length,journal||scene===m.steps.at(-1).node?finish(t,m,mi):[say(['Reward ready. Use Side to claim it.'])]]
  ],[say(['Check the Side journal for your next lead.'])])]]),
  [t.missions.length+1,[say([t.title,...t.complete]),...reactions(t,t.completionReactions)]]
 ],[say(['Check the Side journal for your next lead.'])]));
 const browse=(scene,journal)=>{
  const available=data.tracks.filter(t=>journal||t.home===scene||t.missions.some(m=>m.steps.some(s=>s.node===scene)));
  return [menu(['Stories','Moments','Build','Back']),...select('choice',['arc','encounter','project'].map((kind,i)=>{
   const tracks=available.filter(t=>t.kind===kind);
   return [i+1,tracks.length?[menu([...tracks.map(t=>t.label),'Back']),...select('choice',tracks.map((t,j)=>[j+1,track(t,scene,journal)]))]:[say(['No leads here in this category. Check Side for other stories.'])]];
  }))];
 };
 return {node:scene=>{if(!SIDE_NODES.includes(scene))throw Error('Unknown side node '+scene);return browse(scene,false);},journal:()=>browse(null,true)};
}
