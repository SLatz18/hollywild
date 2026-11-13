/** Physical, button-driven optional activities. Uses native built-in events. */
import fs from 'node:fs';
import path from 'node:path';

// Rotation order is clockwise. These are connection masks, not answer labels.
export const PIPE_PORTS = [['north','east'],['east','south'],['south','west'],['west','north']];
const opposite = {north:'south',east:'west',south:'north',west:'east'};
const sprites = ['valve_elbow_ne','valve_elbow_se','valve_elbow_sw','valve_elbow_nw'];
export const challengeVariableNames = data => [
  'pipe_initialized', ...data.pipes.valves.map(v=>'challenge_'+v.id),
  'pipe_flow','pipe_reached','pipe_paid',
  'trial_active','trial_route','trial_checkpoint','trial_damage','trial_result','trial_paid'
];

export function validateChallenges(data) {
  const fail = message => {throw Error('Physical challenges: '+message);};
  if(data.version!==1 || data.pipes?.valves?.length!==4)fail('requires four valves');
  const ids=new Set();
  const check=(item,where)=>{
    if(!item||! /^[a-z][a-z0-9_]*$/.test(item.id)||ids.has(item.id))fail('invalid/duplicate ID '+where);
    ids.add(item.id);
    if(!Number.isInteger(item.x)||!Number.isInteger(item.y)||item.x<2||item.x>28||item.y<2||item.y>28)fail('invalid position '+item.id);
  };
  for(const v of [...data.pipes.valves,data.pipes.source,data.pipes.sink,data.pipes.reset,data.delivery.start,data.delivery.finish])check(v,'actor');
  if(data.delivery.safeCheckpoints.length!==3||data.delivery.hazards.length!==2)fail('requires three flags and two hazard strips');
  for(const t of [...data.delivery.safeCheckpoints,data.delivery.shortcut,data.delivery.shortcutExit,data.delivery.shortcutBacktrack,...data.delivery.hazards]){
    check(t,'trigger');
    if(!Number.isInteger(t.width)||!Number.isInteger(t.height)||t.width<1||t.height<1)fail('bad trigger rectangle '+t.id);
  }
  if(data.pipes.reward!==25||JSON.stringify(data.delivery.rewards)!==JSON.stringify({safe:12,carefulShortcut:16,damaged:6}))fail('reward budget changed');
  if(!opposite[data.pipes.source.direction]||!opposite[data.pipes.sink.direction])fail('invalid socket direction');
  const neighbors=pipeNeighbors(data.pipes);
  if(!neighbors[data.pipes.source.id][data.pipes.source.direction])fail('source has no aligned valve');
  if(!neighbors[data.pipes.sink.id][data.pipes.sink.direction])fail('sink has no aligned valve');
  return data;
}
export const loadChallenges=root=>validateChallenges(JSON.parse(fs.readFileSync(path.join(root,'content/challenges.json'),'utf8')));

/** Derive connections from actual spatial alignment, using the nearest socket. */
export function pipeNeighbors(pipes) {
  const items=[...pipes.valves,pipes.source,pipes.sink];
  return Object.fromEntries(items.map(a=>[a.id,Object.fromEntries(Object.entries({
    north:b=>b.x===a.x&&b.y<a.y, east:b=>b.y===a.y&&b.x>a.x,
    south:b=>b.x===a.x&&b.y>a.y, west:b=>b.y===a.y&&b.x<a.x
  }).map(([direction,test])=>[direction,items.filter(test).sort((b,c)=>(Math.abs(b.x-a.x)+Math.abs(b.y-a.y))-(Math.abs(c.x-a.x)+Math.abs(c.y-a.y)))[0]?.id??null]))]));
}

/** Pure diagnostic for tooling. Runtime traverses the same network with native IFs. */
export function evaluatePipeFlow(pipes,rotations) {
  const neighbors=pipeNeighbors(pipes), seen=new Set();
  let from=pipes.source.id, direction=pipes.source.direction, reached=0;
  for(let i=0;i<=pipes.valves.length;i++){
    const next=neighbors[from][direction];
    if(next===pipes.sink.id)return {flow:opposite[direction]===pipes.sink.direction,reached};
    if(!next||next===pipes.source.id||seen.has(next))return {flow:false,reached};
    const ports=PIPE_PORTS[rotations[next]??0],entry=opposite[direction];
    if(!ports?.includes(entry))return {flow:false,reached};
    seen.add(next);reached++;from=next;direction=ports.find(p=>p!==entry);
  }
  return {flow:false,reached};
}

export function createChallengeEngine(data,{ev,iff,set,add,text,menu,actorId,spriteId}) {
  validateChallenges(data);
  if(typeof actorId!=='function'||typeof spriteId!=='function')throw Error('Challenge engine requires actorId and spriteId resolvers');
  const p=data.pipes,d=data.delivery,neighbors=pipeNeighbors(p);
  const variable=v=>'challenge_'+v.id;
  const beep=pitch=>ev('EVENT_SOUND_PLAY_EFFECT',{type:'beep',pitch,duration:0.05,priority:'medium',wait:false});
  const changeSprite=(scene,id,name)=>ev('EVENT_ACTOR_SET_SPRITE',{actorId:actorId(scene,id),spriteSheetId:spriteId(name)});
  const select=(name,entries,fallback=[])=>entries.reduceRight((tail,[value,script])=>[iff(name,'eq',value,script,tail)],fallback);
  const valveSprite=v=>select(variable(v),sprites.map((sprite,i)=>[i,[changeSprite(p.scene,v.id,sprite)]]));
  const sinkSprite=()=>[iff('pipe_flow','eq',1,[changeSprite(p.scene,p.sink.id,'pressure_sink_on')],[changeSprite(p.scene,p.sink.id,'pressure_sink_off')])];

  // Generate a bounded connection traversal. A pipe accepts pressure only through
  // an open inlet. Its other port determines the next spatial neighbor. Revisited
  // vertices and leaks stop, so a closed loop can never be mistaken for a sink.
  function follow(from,direction,visited=[]) {
    const next=neighbors[from][direction];
    if(next===p.sink.id)return opposite[direction]===p.sink.direction?[set('pipe_flow',1)]:[];
    if(!next||next===p.source.id||visited.includes(next)||visited.length>=p.valves.length)return [];
    const v=p.valves.find(v=>v.id===next),entry=opposite[direction];
    return select(variable(v),PIPE_PORTS.flatMap((ports,i)=>ports.includes(entry)?[[i,[add('pipe_reached',1),...follow(next,ports.find(port=>port!==entry),[...visited,next])]]]:[]));
  }
  const evaluate=()=>[set('pipe_flow',0),set('pipe_reached',0),...follow(p.source.id,p.source.direction),...sinkSprite()];
  const rotate=v=>[
    add(variable(v),1),iff(variable(v),'gte',4,[set(variable(v),0)]),
    ...valveSprite(v),...evaluate(),beep(4)
  ];
  const resetPipes=()=>[...p.valves.map(v=>set(variable(v),0)),...p.valves.flatMap(valveSprite),...evaluate(),beep(3)];
  const claimPipe=()=>[iff('pipe_paid','eq',0,[iff('job','eq',0,[iff('coins','lte',9999-p.reward,[set('pipe_paid',1),add('coins',p.reward),beep(7),text('PRESSURE RESTORED!\n+25 Coins\nReset for free play.')],[text('Flow is live.\n25 Coins pending.\nMake wallet room.')])],[text('Flow is live.\nFinish your job\nto claim 25 Coins.')])],[text('Pressure is live.\nReward already paid.\nReset for free play.')])];
  const inspectPipe=()=>[...evaluate(),iff('pipe_flow','eq',1,claimPipe(),[
    ...select('pipe_reached',[
      [0,[text('No inlet flow.\nCheck the elbow\nnext to the tank.')]],
      [1,[text('One elbow carries\npressure. Check its\nnext neighbor.')]],
      [2,[text('Two elbows carry\npressure. Check the\nnext open outlet.')]],
      [3,[text('Three elbows carry\npressure. Check the\nlast connection.')]],
      [4,[text('All elbows linked.\nPoint the last outlet\ninto the right gauge.')]]
    ])
  ])];
  const pipeHelp=()=>[text('PIPE WORKSHOP\nWalk to an elbow.\nA rotates it.','Join the left tank\nto the right gauge.\nOutlets must meet.','The gauge lights\nwhen flow reaches it.\nA there: +25 once.','Reset turns elbows\nback. Your paid\nreward stays paid.')];

  const clearTrial=()=>[set('trial_route',0),set('trial_checkpoint',0),set('trial_damage',0),set('trial_result',0)];
  const trialHelp=()=>[text('PARCEL FOOT TRIAL\nLong left flags:12\nCareful short:16\nRough hit:6 Coins','Three left flags\nmark the safe route.\nThe center is short.','Pass both center\nflags going down.\nTurning back ends\nyour shortcut run.','Dodge the two\nstriped rough patches\nin the center lane.','Only improvements\npay the difference.\n16 Coins total cap.')];
  const pending=()=>[iff('trial_result','gt','trial_paid',[text('Trial reward pending.\nClaim at the finish\nbefore another run.')],[...clearTrial(),set('trial_active',1),beep(5),text('PARCEL READY\nWalk the left flags\nor the center lane.\nA at finish to bank.')])];
  const startTrial=()=>[...trialHelp(),iff('trial_active','eq',1,[text('Reset this run?\nYour best paid score\nstays yours.'),menu(['Reset','Back']),iff('choice','eq',1,pending())],pending())];

  // A result is retained until its exact improvement can fit in the wallet.
  // No payout can tick production or change an ordinary delivery assignment.
  const payDifference=(score,paid)=>{
    const delta=score-paid;
    if(delta<=0)return [text('Route complete!\nNo improvement.\nYour best stays paid.')];
    return [iff('job','eq',0,[iff('coins','lte',9999-delta,[add('coins',delta),set('trial_paid',score),beep(7),text(`ROUTE IMPROVED\n+${delta} Coins\nBest result: ${score}/16`)],[text('Reward pending.\nMake wallet room\nthen return here.')])],[text('Reward pending.\nFinish your job\nthen return here.')])];
  };
  const claimTrial=()=>select('trial_result',[6,12,16].map(score=>[score,select('trial_paid',[0,6,12,16].map(paid=>[paid,payDifference(score,paid)]))]));
  const shortFinish=()=>[iff('trial_checkpoint','eq',2,[
    iff('trial_damage','eq',0,[set('trial_result',16),text('CLEAN SHORTCUT\nParcel intact.')],[set('trial_result',6),text('ROUGH SHORTCUT\nParcel bumped.\nTry the clear gaps.')]),
    set('trial_active',0),...claimTrial()
  ],[text('Follow the center\nlane to its end\nbefore banking.')])];
  const safeFinish=()=>[
    iff('trial_damage','eq',0,[set('trial_result',12),text('SAFE DELIVERY\nAll flags checked.\nParcel intact.')],[set('trial_result',6),text('PARCEL BUMPED\nAll flags checked.\nAvoid rough patches\nto keep it intact.')]),
    set('trial_active',0),...claimTrial()
  ];
  const finishTrial=()=>[iff('trial_active','eq',1,[
    iff('trial_route','eq',1,[iff('trial_checkpoint','eq',3,safeFinish(),[text('Left route: follow\nall three flags\nin order, then bank.')])],[iff('trial_route','eq',2,shortFinish(),[iff('trial_route','eq',3,[text('Shortcut abandoned.\nReset at the start\nfor another run.')],[text('No route recorded.\nFollow left flags\nor the center lane.')])])])
  ],[iff('trial_result','gt',0,claimTrial(),[text('PARCEL FINISH\nStart at the sign\nabove this lane.')])])];
  const safeCheckpoint=i=>[iff('trial_active','eq',1,[
    ...(i===0?[iff('trial_route','eq',0,[set('trial_route',1)])]:[]),
    iff('trial_route','eq',1,[iff('trial_checkpoint','eq',i,[set('trial_checkpoint',i+1),beep(5)])])
  ])];
  const shortcut=()=>[iff('trial_active','eq',1,[iff('trial_route','eq',0,[set('trial_route',2),set('trial_checkpoint',1),beep(6)])])];
  const hazard=()=>[iff('trial_active','eq',1,[iff('trial_damage','eq',0,[set('trial_damage',1),beep(2)])])];
  const siteType='physical_challenge';
  const sites=scene=>[
    ...(scene===p.scene?[
      ...p.valves.map(v=>({...v,type:siteType,challenge:'pipe_valve',sprite:sprites[0],label:'Rotate pipe'})),
      {...p.source,type:siteType,challenge:'pipe_help',sprite:'pressure_source',label:'Pressure tank'},
      {...p.sink,type:siteType,challenge:'pipe_sink',sprite:'pressure_sink_off',label:'Pressure gauge'},
      {...p.reset,type:siteType,challenge:'pipe_reset',sprite:'sign',label:'Pipe reset'}
    ]:[]),
    ...(scene===d.scene?[
      {...d.start,type:siteType,challenge:'trial_start',sprite:'sign',label:'Parcel foot trial'},
      {...d.finish,type:siteType,challenge:'trial_finish',sprite:'crate',label:'Parcel finish'}
    ]:[])
  ];
  const triggerScript=id=>{
    const index=d.safeCheckpoints.findIndex(t=>t.id===id);
    if(index>=0)return safeCheckpoint(index);
    if(id===d.shortcut.id)return shortcut();
    if(id===d.shortcutExit.id)return [iff('trial_active','eq',1,[iff('trial_route','eq',2,[set('trial_checkpoint',2),beep(6)])])];
    // The machine walls close both sides of the central lane from rows18-23.
    // Retreat across the entry guard abandons the shortcut; entering its lower
    // checkpoint later from outside cannot rescue a bypassed run.
    if(id===d.shortcutBacktrack.id)return [iff('trial_active','eq',1,[iff('trial_route','eq',2,[iff('trial_checkpoint','eq',1,[set('trial_route',3),beep(2)])])])];
    if(d.hazards.some(t=>t.id===id))return hazard();
    throw Error('Unknown physical challenge trigger '+id);
  };
  return {
    sites,
    triggers:scene=>scene===d.scene?[...d.safeCheckpoints,d.shortcut,d.shortcutExit,d.shortcutBacktrack,...d.hazards].map(t=>({...t,script:triggerScript(t.id)})):[],
    site:(site,scene)=>{
      if(site.type!==siteType)return null;
      if(scene===p.scene){
        if(site.challenge==='pipe_valve'){const v=p.valves.find(v=>v.id===site.id);if(!v)throw Error('Unknown valve '+site.id);return rotate(v);}
        if(site.challenge==='pipe_help')return pipeHelp();
        if(site.challenge==='pipe_sink')return inspectPipe();
        if(site.challenge==='pipe_reset')return [...resetPipes(),text('Elbows reset.\nPaid rewards stay\npaid. A tank: help.')];
      }
      if(scene===d.scene&&site.challenge==='trial_start')return startTrial();
      if(scene===d.scene&&site.challenge==='trial_finish')return finishTrial();
      throw Error('Unknown physical challenge site '+site.id);
    },
    sceneInit:scene=>scene===p.scene?[
      iff('pipe_initialized','eq',0,[...p.valves.map(v=>set(variable(v),0)),set('pipe_initialized',1)]),...evaluate()
    ]:[],
    actorInit:(site,scene)=>{
      if(scene!==p.scene||site.type!==siteType)return [];
      const v=p.valves.find(v=>v.id===site.id);
      return v?valveSprite(v):site.id===p.sink.id?sinkSprite():[];
    },
    onDispatch:()=>[],beforeDelivery:()=>[],afterJob:()=>[]
  };
}
