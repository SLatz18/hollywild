/** Native GB Studio campaign state machine. No plugins or runtime JS required. */
import fs from 'node:fs';
import path from 'node:path';
export const CAMPAIGN_NODES = `archive_catalog archive_badge archive_blueprint archive_clerk depot_manifest depot_toolbox depot_gate depot_foreman sorting_red sorting_blue sorting_addresses sorting_moxie roof_courier roof_vane roof_antenna roof_parcel foundry_gears foundry_regulator foundry_rivet foundry_shelf control_pump control_gauge control_relay control_dot lodge_listing lodge_disclosure lodge_junction lodge_nib velvet_permits velvet_slush velvet_skylight velvet_survey signal_box signal_map signal_lantern signal_clerk core_turbine core_bypass core_grid core_festival`.split(' ');
const keys=['route','policy','trust','ending'];
export function wrapCampaignPages(pages) {
 const result=[];
 for(const original of pages){
  const firstPage=result.length;
  let lines=[],line='';
  const flushLine=()=>{if(line){lines.push(line);line='';}if(lines.length===5){result.push(lines.join('\n'));lines=[];}};
  for(const paragraph of original.split('\n')){
   for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){
    if(word.length>18)throw Error(`Campaign word exceeds 18 glyphs: ${word}`);
    if(line && line.length+1+word.length>18)flushLine();
    line+=(line?' ':'')+word;
   }
   flushLine();
  }
  if(lines.length){
   // Keep the final fragment with enough context to read as a page.
   if(lines.length===1 && result.length>firstPage && result.at(-1).split('\n').length===5){
    const previous=result.pop().split('\n');
    result.push(previous.slice(0,3).join('\n'));
    result.push([...previous.slice(3),...lines].join('\n'));
   }else result.push(lines.join('\n'));
  }
 }
 return result;
}
export function validateCampaign(c){
 const fail=m=>{throw Error('Campaign: '+m);};
 const pages=(p,where)=>{if(!Array.isArray(p)||!p.length||p.some(s=>typeof s!=='string'||!s.trim()||/[^\x20-\x7e\n]/.test(s)))fail('invalid ASCII pages '+where);wrapCampaignPages(p);};
 if(!Array.isArray(c.missions)||c.missions.length!==24)fail('requires 24 missions');
 const ids=new Set(),loreIds=new Set(),choiceSteps=[];
 for(const [i,m]of c.missions.entries()){
  if(m.id!==i+1||ids.has(m.id))fail('mission IDs must be sequential 1..24');ids.add(m.id);
  if(!Number.isInteger(m.act)||m.act<1||m.act>6)fail('bad act '+m.id);
  pages([m.title,m.summary],`mission ${m.id} title/summary`);pages(m.intro,'intro '+m.id);pages(m.outro,'outro '+m.id);
  if(!Array.isArray(m.steps)||m.steps.length<4||m.steps.length>7)fail('requires 4..7 steps '+m.id);
  for(const [j,s]of m.steps.entries()){
   const where=`${m.id}:${j}`;
   if(!CAMPAIGN_NODES.includes(s.node))fail('unknown node '+s.node);
   if(!['talk','collect','puzzle','choice'].includes(s.type))fail('bad step type '+where);
   pages([s.hint],where+' hint');pages(s.pages,where);
   if(['puzzle','choice'].includes(s.type)){
    if(!Array.isArray(s.options)||s.options.length<2||s.options.length>4||s.options.some(v=>typeof v!=='string'||!v.length||v.length>7||/[^\x20-\x7e]/.test(v)))fail('bad menu '+where);
   }
   if(s.type==='puzzle'){if(!Number.isInteger(s.answer)||s.answer<1||s.answer>s.options.length)fail('bad puzzle answer '+where);pages(s.wrong,where+' wrong');}
   if(s.type==='choice'){
    if(!keys.includes(s.choiceKey)||!Array.isArray(s.outcomes)||s.outcomes.length!==s.options.length)fail('bad choice '+where);
    s.outcomes.forEach(p=>pages(p,where+' outcome'));
    if(s.choiceValues&&(!Array.isArray(s.choiceValues)||s.choiceValues.length!==s.options.length||s.choiceValues.some(v=>!Number.isInteger(v)||v<1||v>255)||new Set(s.choiceValues).size!==s.choiceValues.length))fail('bad choice values '+where);
    choiceSteps.push({key:s.choiceKey,mission:i,step:j,definition:s});
   }
   for(const r of s.reactions??[]){if(!keys.includes(r.key)||!Number.isInteger(r.value)||r.value<1)fail('bad reaction '+where);pages(r.pages,where+' reaction');}
  }
  if(!m.reward||['coins','salvage'].some(k=>!Number.isInteger(m.reward[k])||m.reward[k]<0||m.reward[k]>(k==='coins'?9999:99)))fail('bad reward '+m.id);
 }
 if(!Array.isArray(c.lore)||!c.lore.length)fail('missing lore');
 for(const l of c.lore){if(!/^[a-z][a-z0-9_]*$/.test(String(l.id))||loreIds.has(l.id))fail('bad/duplicate lore ID '+l.id);loreIds.add(l.id);if(!CAMPAIGN_NODES.includes(l.node))fail('bad lore node '+l.node);pages([l.title,...l.pages],'lore '+l.id);}
 for(const key of keys){if(!choiceSteps.some(x=>x.key===key))fail('missing choice '+key);}
 for(const choice of choiceSteps){
  const values=choice.definition.choiceValues??choice.definition.options.map((_,i)=>i+1);
  for(const value of values)if(!c.missions.some((m,i)=>m.steps.some((s,j)=>(i>choice.mission||(i===choice.mission&&j>choice.step))&&(s.reactions??[]).some(r=>r.key===choice.key&&r.value===value))))fail(`choice lacks later consequence ${choice.key}=${value}`);
 }
 const final=choiceSteps.at(-1)?.definition;
 if(final?.choiceKey!=='ending'||final.options.length!==3||JSON.stringify(final.choiceValues??[1,2,3])!=='[1,2,3]')fail('last choice must choose three endings 1/2/3');
 for(const key of ['warmth','industry','commons'])pages(c.endings?.[key],'ending '+key);
 return c;
}
export const loadCampaign=root=>validateCampaign(JSON.parse(fs.readFileSync(path.join(root,'content/campaign.json'),'utf8')));
export const campaignVariableNames=c=>['story_mission','story_step','story_completed',...keys.map(k=>'story_'+k),...c.lore.map(l=>'lore_'+l.id)];
export function createCampaignEngine(c,{ev,iff,set,add,text,menu,share=(key,build)=>build()}){
 const say=pages=>text(...wrapCampaignPages(pages));
 // Branches are nested rather than sequential. A transition cannot match a
 // newly activated mission or a later step during the same interaction.
 const select=(name,entries,fallback=[])=>entries.reduceRight((tail,[value,script])=>[iff(name,'eq',value,script,tail)],fallback);
 const finish=m=>share('finish_'+m.id,()=>[iff('job','eq',0,[iff('coins','lte',9999-m.reward.coins,[iff('salvage','lte',99-m.reward.salvage,[iff('story_completed','lt',m.id,[add('coins',m.reward.coins),add('salvage',m.reward.salvage),set('story_completed',m.id),say(m.outro),say([`Mission complete. ${m.reward.coins} Coins and ${m.reward.salvage} scrap.`]),set('story_step',0),set('story_mission',m.id+1),...(m.id===24?[set('festival',1),set('aurora',1),set('cheer',100),...select('story_ending',[[1,[say(c.endings.warmth)]],[2,[say(c.endings.industry)]],[3,[say(c.endings.commons)]]]),say(['The city stays open. Explore, build, and visit your neighbors.'])]:[say(['Take a breather. START > Story has the next lead.'])])])],[say(['Your reward is safe. Make room in scrap storage, then use Story or return here.'])])],[say(['Your reward is safe. Spend some Coins, then use Story or return here.'])])],[say(['Mission ready. Finish or cancel your job, then use Story or return here for the reward.'])])]);
 const advance=(m,i)=>[set('story_step',i+1),...(i===m.steps.length-1?finish(m):[say([m.steps[i+1].hint])])];
 const stepScript=(m,s,i)=>{
  const prefix=[say(s.pages),...(s.reactions??[]).map(r=>iff('story_'+r.key,'eq',r.value,[say(r.pages)]))];
  if(s.type==='puzzle')return [...prefix,menu(s.options),iff('choice','eq',s.answer,advance(m,i),[iff('choice','gt',0,[say(s.wrong)])])];
  if(s.type==='choice')return [...prefix,menu(s.options),...select('choice',s.options.map((_,j)=>[j+1,[set('story_'+s.choiceKey,s.choiceValues?.[j]??j+1),say(s.outcomes[j]),...advance(m,i)]]))];
  return [...prefix,...advance(m,i)];
 };
 const lore=node=>{
  const entries=c.lore.filter(l=>l.node===node);
  if(!entries.length)return [say(['A quiet corner of the city. The Story journal marks your next lead.'])];
  // Every node can offer its authored lore without consuming quest resources.
  return entries.flatMap(l=>[iff('lore_'+l.id,'eq',0,[set('lore_'+l.id,1),say([l.title,...l.pages])],[say([l.title,...l.pages])])]);
 };
 const node=node=>{
  if(!CAMPAIGN_NODES.includes(node))throw Error('Unknown campaign actor node '+node);
  return select('story_mission',c.missions.filter(m=>m.steps.some(s=>s.node===node)).map(m=>[m.id,select('story_step',[
   ...m.steps.flatMap((s,i)=>s.node===node?[[i,stepScript(m,s,i)]]:[]),
   ...(m.steps.at(-1).node===node?[[m.steps.length,finish(m)]]:[])
  ],lore(node))]),lore(node));
 };
 const journal=()=>select('story_mission',[
  [0,[say(['THE WINTERLIGHT LEDGER','Visit the new story desk in your garage to begin. Every district is open.'])]],
  ...c.missions.map(m=>[m.id,share('journal_mission_'+m.id,()=>[say([`Mission ${m.id}: ${m.title}`,m.summary]),iff('story_step','eq',0,[say(m.intro)]),...select('story_step',m.steps.map((s,i)=>[i,[say([s.hint])]]),finish(m))])]),
  [25,[say(['THE LEDGER IS COMPLETE','Your choices are part of the city. Free exploration and all ordinary jobs remain open.'])]]
 ],[say(['Visit the garage story desk.'])]);
 const clues=()=>select('story_mission',[
  [0,[say(['Begin at the garage story desk to collect clues.'])]],
  ...c.missions.map(m=>[m.id,share('clues_mission_'+m.id,()=>[
   say([`Clues: ${m.title}`]),
   iff('story_step','eq',0,[say(['No clues yet for this mission. Follow the next lead in START > Story.'])]),
   ...m.steps.map((s,i)=>iff('story_step','gt',i,[say(s.pages)]))
  ])]),
  [25,[say(['Your ledger is complete. Visit your neighbors or check START > Story.'])]]
 ],[say(['Visit the garage story desk to collect clues.'])]);
 const desk=()=>[iff('story_mission','eq',0,[say([c.title,'A long city story. You can pause to explore or work at any time.','Need an old clue? Open START > Clues to read the leads you have completed.']),menu(['Begin','Back']),iff('choice','eq',1,[set('story_mission',1),set('story_step',0),say(c.missions[0].intro),say([c.missions[0].steps[0].hint])])],share('journal',journal))];
 return {node,journal,clues,desk};
}
