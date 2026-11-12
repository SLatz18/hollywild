#!/usr/bin/env node
/** Create the editable native GB Studio project from authored world data.
 * Uses the v4.3.2 resource format and built-in script events only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { loadCampaign, campaignVariableNames, createCampaignEngine } from './campaign-events.mjs';
import { loadSideStories, sideVariableNames, createSideEngine } from './side-events.mjs';
import { layoutDialogue, gameVariableWidths } from './dialogue-layout.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(ROOT, '.tools/gb-studio/appData/templates/blank');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, JSON.stringify(data,null,2)+'\n'); };
const uid = s => { const h=crypto.createHash('sha1').update('hollywild:'+s).digest('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; };
let eventCounter=0;
const ev=(command,args={},children)=>({id:uid('event:'+eventCounter++),command,args,...(children?{children}:{})});
const N=value=>({type:'number',value});
const V=value=>({type:'variable',value});
const names=['initialized','coins','salvage','cheer','workshop','cocoa','job','first_salvage','carried','bonus','crew_enabled','crew_reserved','cocoa_snapshot','cycles','choice','flats','toolworks','parcel','aurora','toolworks_snapshot','parcel_snapshot','district_count','visited_frostwick','visited_candy','visited_brassworks','visited_velvet','visited_aurora','cache_frostwick','cache_candy','cache_brassworks','cache_velvet','cache_aurora','deliveries','salvage_runs','festival','save_version','quest_frostwick','quest_candy','quest_brassworks','quest_velvet','quest_aurora','crew_mode','crew_mode_snapshot'];
const campaign=loadCampaign(ROOT);
names.push(...campaignVariableNames(campaign));
const sideContent=loadSideStories(ROOT);
names.push(...sideVariableNames(sideContent));
names.push('music_off');
const soundtrack=read(path.join(ROOT,'content/soundtrack.json'));
const musicByKey=Object.fromEntries(soundtrack.tracks.map(t=>[t.key,t.id]));
const visualUpgrades=read(path.join(ROOT,'content/visual-upgrades.json')).patches;
const dialogueWidths=gameVariableWidths(names.map((name,id)=>({name,id})));
const vars=Object.fromEntries(names.map((n,i)=>[n,String(i)]));
const set=(name,val)=>ev('EVENT_SET_VALUE',{variable:vars[name],value:typeof val==='string'?V(vars[val]):N(val)});
const math=(name,op,val)=>ev('EVENT_VARIABLE_MATH',{vectorX:vars[name],operation:op,other:typeof val==='string'?'var':'val',...(typeof val==='string'?{vectorY:vars[val]}:{value:val}),clamp:false});
const add=(name,val)=>math(name,'add',val);
const sub=(name,val)=>math(name,'sub',val);
const iff=(name,op,value,yes,no=[])=>ev('EVENT_IF',{condition:{type:op,valueA:V(vars[name]),valueB:typeof value==='string'?V(vars[value]):N(value)}},{true:yes,false:no});
const modal=event=>ev('EVENT_GROUP',{}, {true:[ev('EVENT_HIDE_SPRITES'),event,ev('EVENT_SHOW_SPRITES')]});
const text=(...pages)=>modal(ev('EVENT_TEXT',{text:layoutDialogue(pages,{variableWidths:dialogueWidths}),avatarId:'',minHeight:4,maxHeight:7,position:'bottom',closeWhen:'key',closeButton:'a'}));
const menu=options=>{for(const label of options){if(label.length>7)throw new Error(`Menu label exceeds 7 glyphs: ${label}`);}return modal(ev('EVENT_MENU',{variable:vars.choice,items:options.length,layout:'menu',cancelOnLastOption:false,cancelOnB:true,...Object.fromEntries(options.map((v,i)=>['option'+(i+1),v]))}));};
const ownedSign=()=>ev('EVENT_ACTOR_SET_SPRITE',{actorId:'$self$',spriteSheetId:spriteID('property_owned')});
const confirm=(label,yes)=>[menu([label,'Back']),iff('choice','eq',1,yes)];
const sound=(pitch=5)=>ev('EVENT_SOUND_PLAY_EFFECT',{type:'beep',pitch,duration:0.10,priority:'medium',wait:false});
const stat=()=>text(`COINS $${vars.coins}$\nSCRAP $${vars.salvage}$\nCHEER $${vars.cheer}$`,`Jobs done: $${vars.cycles}$\nPlaces found: $${vars.district_count}$/5\nA talk  START menu`);
const help=()=>[text('D-PAD: walk freely\nA: talk / confirm\nB: cancel menus','START: pocket book\nSide: local stories\nSELECT: city routes','All five districts\nare open. Follow\nthe road signs.','Accept one job at\na board. Success\nfinishes crew work.','Keep 4 scrap for\nbuilding. Work uses\n2 surplus scrap.')];
const objective=()=>[iff('job','eq',1,[iff('carried','gt',0,[text('SALVAGE READY\nReturn to any job\nboard to bank it.')],[text('SALVAGE JOB\nAny marked depot.\nFrostwick: go east,\nthen south. Crate\nbelow Cocoa cafe.')])],[iff('job','eq',2,[text('DELIVERY JOB\nAny marked drop-off.\nTry Cocoa first.')],[iff('workshop','eq',0,[iff('first_salvage','eq',1,[text('Scrap banked!\nReturn to your\ngarage workbench.')],[text('First job?\nExit south to\nFrostwick. The job\nboard is just right\nof the garage door.','Face the board.\nPress A. Choose\nSalvage. Or roam!')])],[iff('cocoa','eq',0,[text('Build your empire:\nWork + delivery\ncan fund Cocoa.')],[iff('festival','eq',0,[text('Follow the ledger.\nGarage story desk\nleads to Aurora.')],[text('Winterlight shines!\nKeep exploring and\nbuilding your city.')])])])])])];
const cancelJob=()=>[iff('job','gt',0,[text('Cancel this job?\nCarried scrap goes\nback. No crew tick.'),...confirm('Cancel',[set('job',0),set('carried',0),set('bonus',0),set('crew_reserved',0),text('Job cancelled.\nStored supplies\nare unchanged.')])],[text('No active job.\nWander wherever\nyou like.')])];
const selectChoice=entries=>entries.reduceRight((tail,[value,events])=>[iff('choice','eq',value,events,tail)],[]);
const guide=wid=>[menu(['Help','Music','Back']),...selectChoice([[1,help()],[2,[text('MUSIC\nOriginal city score.\nSave at a checkpoint\nto keep your choice.'),menu(['Play','Mute','Back']),...selectChoice([[1,[set('music_off',0),...musicFor(wid),text('Music playing.\nA: return to town.')]],[2,[set('music_off',1),ev('EVENT_MUSIC_STOP'),text('Music muted.\nA: return to town.')]]])]]])];
const pocket=wid=>[stat(),menu(['Job','Guide','Crew','Cancel','Close','Story','Clues','Side']),...selectChoice([[1,objective()],[2,guide(wid)],[3,[iff('workshop','eq',0,[text('Rivet needs a\nrepaired workshop.\n40 Coins + 4 scrap.')],[iff('crew_enabled','eq',1,[...crewStatus()],[text('RIVET: resting\nTalk at the garage\nto assign work.')])])]],[4,cancelJob()],[6,callStory('journal')],[7,callStory('clues')],[8,callSide()]])];
function musicFor(wid){
 const key=wid==='garage'?'garage':wid.startsWith('frostwick')||wid==='cocoa_interior'?'frostwick':wid.startsWith('candy')||wid==='parcel_interior'?'candy':wid.startsWith('brassworks')||wid==='toolworks_interior'?'brassworks':wid.startsWith('velvet')||wid==='flats_interior'?'velvet':'aurora';
 const play=k=>ev('EVENT_MUSIC_PLAY',{musicId:musicByKey[k]});
 return [iff('music_off','eq',1,[ev('EVENT_MUSIC_STOP')],key==='aurora'?[iff('festival','eq',1,[play('finale')],[play(key)])]:[play(key)])];
}
function propertyVisuals(wid){return visualUpgrades.filter(p=>p.scene===wid).map(p=>iff(p.variable,'eq',1,p.changes.map(t=>ev('EVENT_REPLACE_TILE_XY',{x:N(t.x),y:N(t.y),tilesetId:p.tilesetId,tileIndex:N(t.tileIndex),tileSize:'8px'}))));}
const cityMap=()=>[text('HOLLYWILD ROUTES\nEast-west streets\nform one big loop.','Frostwick > Candy\n> Brassworks >\nVelvet > Aurora','North shortcuts:\nFrostwick-Brass\nCandy-Velvet','Aurora north goes\nto Frostwick south.\nEvery road is open.')];
const bind=(button,script)=>ev('EVENT_SET_INPUT_SCRIPT',{input:[button],override:true},{true:script});
const noActive=script=>[iff('job','eq',0,script,[text('Finish or cancel\nyour current job\nfirst. START menu.')])];
const dispatch=type=>[set('job',type),set('carried',0),set('bonus',0),set('crew_reserved',0),set('crew_mode_snapshot',3),set('cocoa_snapshot','cocoa'),set('toolworks_snapshot','toolworks'),set('parcel_snapshot','parcel'),iff('workshop','eq',1,[iff('crew_enabled','eq',1,[set('crew_mode_snapshot','crew_mode'),iff('crew_mode','eq',0,[iff('salvage','gte',6,[set('crew_reserved',2)])])])]),text(type===1?'SALVAGE ACCEPTED\nAny marked depot.\nFrostwick: go east,\nthen south. Crate\nbelow Cocoa cafe.':'DELIVERY ACCEPTED\nAny marked drop-off.\nTry Cocoa first.'),iff('crew_reserved','eq',2,[text('Rivet reserved 2\nscrap. 4 are kept\nfor renovations.')])];
const preflight=script=>[iff('coins','lte',9800,[iff('salvage','lte',79,script,[text('Storage is full.\nSell scrap or build\nbefore a new job.')])],[text('Wallet nearly full.\nBuild or donate at\nthe board first.')])];
const production=()=>[iff('crew_mode_snapshot','eq',1,[add('salvage',2),text('RECYCLER COMPLETE\n+2 scrap\nNo supplies used.')]),iff('crew_mode_snapshot','eq',2,[add('coins',10),text('RUNNER COMPLETE\n+10 Coins\nNo supplies used.')]),iff('crew_reserved','eq',2,[sub('salvage',2),add('coins',30),text('RIVET COMPLETE\n-2 scrap\n+30 Coins')]),iff('cocoa_snapshot','eq',1,[add('coins',16),text('COCOA CORNER\n+16 Coins')]),iff('toolworks_snapshot','eq',1,[add('salvage',2),text('TOOLWORKS\n+2 scrap')]),iff('parcel_snapshot','eq',1,[add('coins',20),text('PARCEL PALACE\n+20 Coins')]),iff('perk_cocoa','eq',1,[add('coins',4),text('COCOA TASTING BAR\n+4 Coins')]),iff('perk_parcel','eq',1,[add('coins',6),text('PARCEL SORTER\n+6 Coins')]),iff('perk_toolworks','eq',1,[add('salvage',1),text('TOOLWORKS REUSE\n+1 scrap')]),iff('perk_flats','eq',1,[add('coins',3),text('FLATS COMMON ROOM\n+3 Coins')]),add('cycles',1),set('crew_reserved',0),set('job',0),set('carried',0),set('bonus',0)];
const turnIn=()=>[iff('job','eq',1,[iff('carried','gt',0,[add('salvage','carried'),iff('perk_rivals','eq',1,[add('salvage',1),text('CREW RECOVERY TIP\n+1 stored scrap')]),sound(4),text(`SALVAGE BANKED\n+$${vars.carried}$ scrap`),set('first_salvage',1),add('salvage_runs',1),...production(),...objective()],[text('No salvage yet.\nAny marked depot.\nFrostwick: go east,\nthen south. Crate\nbelow Cocoa cafe.')])],[iff('job','eq',2,[text('Any marked drop-off\ntakes your parcel.\nTry Cocoa first.')],[text('No job to turn in.\nTake an assignment\nor explore freely.')])])];
const board=()=>[text('PIP POST\nJobs help your\nwhole crew thrive.'),menu(['Salvage','Deliver','Bank','Cancel','Sell 4','Donate','Back']),iff('choice','eq',1,noActive(preflight(dispatch(1)))),iff('choice','eq',2,noActive(preflight(dispatch(2)))),iff('choice','eq',3,turnIn()),iff('choice','eq',4,cancelJob()),iff('choice','eq',5,noActive([iff('salvage','gte',4,[iff('coins','lte',9991,[sub('salvage',4),add('coins',8),text('Sold 4 scrap\nfor 8 Coins.')],[text('Wallet is full.\nDonate or spend\nsome Coins first.')])],[text('Need 4 scrap\nto sell a bundle.')])])),iff('choice','eq',6,noActive([iff('coins','gte',100,[text('Donate 100 Coins?\nOne neighborhood\nmeal adds 1 Cheer.'),...confirm('Donate',[sub('coins',100),iff('cheer','lt',100,[add('cheer',1)]),iff('perk_neighbors','eq',1,[iff('cheer','lt',100,[add('cheer',1)]),text('NEIGHBOR MEAL PLAN\nAn extra +1 Cheer.\nMaximum 100.')]),text('A neighborhood meal!\n-100 Coins\n+1 Cheer (max100)')])],[text('Need 100 Coins\nfor a donation.')])]))];
const salvage=()=>[iff('job','eq',1,[iff('carried','eq',0,[iff('first_salvage','eq',0,[set('carried',10)],[set('carried',6)]),text(`Packed $${vars.carried}$ scrap.\nFind the bonus crate\nor return to a board.`)],[text('You already packed\nthe main salvage\nfor this run.')])],[text('SALVAGE DEPOT\nTake a salvage job\nat the nearby board.')])];
const bonus=()=>[iff('job','eq',1,[iff('carried','gt',0,[iff('bonus','eq',0,[iff('first_salvage','eq',0,[add('carried',4)],[add('carried',2)]),set('bonus',1),text('A hidden haul!\nBonus scrap packed.\nReturn to a board.')],[text('Bonus packed.\nTry another route\non your next run.')])],[text('Pack the main crate\nfirst, then return\nfor the extra haul.')])],[text('Extra depot supplies.\nAccept a salvage\njob to collect.')])];
const delivery=()=>[iff('job','eq',2,[sound(6),text('PARCEL DELIVERED\n+20 Coins'),add('coins',20),iff('perk_courier','eq',1,[add('coins',5),text('COURIER CONTRACT\n+5 Coins')]),add('deliveries',1),...production(),...objective()],[text('PARCEL DROP-OFF\nDeliveries start\nat any job board.')])];
const affordable=(c,s,success)=>[iff('coins','gte',c,[iff('salvage','gte',s,[sub('coins',c),sub('salvage',s),...success],[text('Not enough scrap.\nYour Coins were\nnot spent.')])],[text('Not enough Coins.\nNothing was spent.')])];
const propertyBase=(name,variable,coins,salvage,effect,extra=[])=>[iff(variable,'eq',1,[...(variable==='workshop'?[]:[ownedSign()]),text(`${name.toUpperCase()}\nYour property.`,effect)],[text(`${name.toUpperCase()}\n${coins} Coins + ${salvage} scrap`,effect),...noActive(confirm(variable==='workshop'?'Repair':'Buy',affordable(coins,salvage,[set(variable,1),sound(7),...(variable==='workshop'?[]:[ownedSign()]),...(variable==='workshop'?[]:[iff('cheer','lte',95,[add('cheer',5)],[set('cheer',100)])]),text('RESTORED!\nA warmer corner\nof the city.'),...extra])))])];
const property=(name,variable,coins,salvage,effect,extra=[])=>variable==='workshop'?propertyBase(name,variable,coins,salvage,effect,extra):[iff('perk_listing','eq',1,propertyBase(name,variable,coins-20,salvage,effect,extra),propertyBase(name,variable,coins,salvage,effect,extra))];
const workshop=()=>[iff('workshop','eq',0,[text('RIVET\nGood bones. Cold\nfingers. Let us fix it.'),...property('Workshop','workshop',40,4,'2 spare scrap makes\n30 Coins after a\nsuccessful job.',[set('crew_enabled',1),text('Rivet is assigned.\nTake a delivery to\ntry your first batch.')])],[text('RIVET\nWork or rest here.\nRole changes the job.'),menu(['Work','Rest','Back','Role']),iff('choice','eq',1,noActive([set('crew_enabled',1),text('Rivet will work\nin the chosen role\nafter successful jobs.')])),iff('choice','eq',2,noActive([set('crew_enabled',0),text('Rivet is resting.\nNo workshop input\nwill be reserved.')])),iff('choice','eq',4,noActive(crewRoles()))])];
const crewStatus=()=>[iff('crew_mode','eq',0,[text('RIVET: maker\n2 spare scrap makes\n30 Coins per job.')],[iff('crew_mode','eq',1,[text('RIVET: recycler\n2 scrap per job.\nNo supplies used.')],[text('RIVET: runner\n10 Coins per job.\nNo supplies used.')])])];
const crewRoles=()=>[text('MAKER: -2 scrap\n+30 Coins per job.\nKeeps 4 scrap safe.','RECYCLE: +2 scrap\nRUNNER: +10 Coins\nNeither uses scrap.','Pick a free role.\nIt runs only after\na successful job.'),menu(['Maker','Recycle','Runner','Back']),iff('choice','eq',1,[set('crew_mode',0),text('Maker selected.\nUse Work to assign\nor Rest to pause.')]),iff('choice','eq',2,[set('crew_mode',1),text('Recycler selected.\nUse Work to assign\nor Rest to pause.')]),iff('choice','eq',3,[set('crew_mode',2),text('Runner selected.\nUse Work to assign\nor Rest to pause.')])];
const districtStories={frostwick:['JUNIPER: WARM WELCOME','The cafe lost its\nbox of spare mugs.\nFind the local crate.'],candy:['POSTMASTER: LABELS','Lost parcel labels!\nFind our local crate\nto fix the route.'],brassworks:['FOREMAN: SMALL PARTS','A missing gear box.\nFind our local crate\nto help the yard.'],velvet:['CARETAKER: WARM HOME','The tenant kit went\nmissing. Find the\nlocal supply crate.'],aurora:['CLERK: LIGHT THE WAY','Find the local crate\nof signal parts.\nBring them here.']};
const districtContact=district=>{const flag='quest_'+canonical(district);const story=districtStories[canonical(district)];if(!story)throw Error('Unknown commission district '+district);return [iff(flag,'eq',3,[text('LOCAL JOB COMPLETE\nYour help made this\nplace a little warmer.')],[iff(flag,'eq',2,noActive([iff('coins','lte',9974,[iff('salvage','lte',97,[set(flag,3),add('coins',25),add('salvage',2),sound(6),text('COMMISSION PAID\n+25 Coins +2 scrap\nNo crew work tick.')],[text('Need room for\n2 scrap. Sell or\nbuild, then return.')])],[text('Need wallet space\nfor 25 Coins. Spend\nor donate first.')])]),[iff(flag,'eq',1,[text('Find our marked\nlocal supply crate.\nBring it back here.')],[text(story[0],story[1],'One local errand.\nReward: 25 Coins\nand 2 scrap.'),...confirm('Accept',[set(flag,1),text('LOCAL JOB ACCEPTED\nFind this district\nsupply crate.')])])])])];};
const districtCache=district=>{const flag='quest_'+canonical(district);if(!vars[flag])throw Error('Unknown cache district '+district);return [iff(flag,'eq',1,[set(flag,2),sound(4),text('LOCAL SUPPLIES\nReturn these to your\nlocal contact.')],[iff(flag,'eq',0,[text('LOCAL SUPPLIES\nAsk the contact in\nthis district first.')],[text('Supplies collected.\nThis local crate\nis now empty.')])])];};
const interiorInfo=property=>{const info={cocoa:['COCOA CORNER','A public cafe.\nOwn it for 16 Coins\nper successful job.'],parcel:['PARCEL PALACE','A public post room.\nOwn it for 20 Coins\nper successful job.'],toolworks:['TINSEL TOOLWORKS','Inspect the machines.\nOwn it for 2 scrap\nper successful job.'],flats:['LANTERN FLATS','A public show flat.\nOwn a warm home\nfor your crew.']}[property];if(!info)throw Error('Unknown interior '+property);return [text(info[0],info[1]),iff(property,'eq',1,[text('Your property!\nThe neighborhood\nthanks you.')],[text('Everyone may visit.\nThe sign outside\nhandles purchases.')])];};
const saveTerminal=(label='GARAGE CHECKPOINT')=>[text(label+'\nSave only between\njobs. One save slot.'),menu(['Save','Load','Back']),iff('choice','eq',1,noActive([set('save_version',1),ev('EVENT_SAVE_DATA',{saveSlot:0},{true:[text('Progress saved.\nKeep exploring!')],load:[set('job',0),set('crew_reserved',0),set('carried',0),set('bonus',0),text('Welcome home.\nProgress loaded.')]})])),iff('choice','eq',2,[ev('EVENT_IF_SAVED_DATA',{saveSlot:0},{true:[...confirm('Load',[ev('EVENT_LOAD_DATA',{saveSlot:0})])],false:[text('No saved journey\nyet. Save here\nbetween jobs.')]})])];
const aurora=()=>[iff('story_completed','eq',24,[text('THE WINTERLIGHT\nFESTIVAL IS ALIVE!','Your choices gave\nthe city a future.\nKeep exploring!')],[text('AURORA STATION\nThe network needs\nmore than property.'),...callStory('journal')])];
const newGame=()=>[ev('EVENT_RESET_VARIABLES'),set('initialized',1),set('coins',100),set('save_version',1),...musicFor('garage'),text('HOLLYWILD\nELF-MADE EMPIRE','A garage. 100 Coins.\nA whole city\nwaiting for you.','PIP: Good news!\nYou own a garage.\nMost is still indoors.'),text('D-PAD: walk.\nA: talk / confirm.\nSTART: pocket book\nSELECT: city map.\nB: cancel menus.','First job?\nExit south. Look\nright of the door\nfor the job board.\nOr explore freely!')];
const boot=()=>[iff('initialized','eq',0,[ev('EVENT_IF_SAVED_DATA',{saveSlot:0},{true:[text('HOLLYWILD\nELF-MADE EMPIRE'),menu(['Resume','New']),iff('choice','eq',2,[text('New journey?\nOld save stays\nuntil you save.'),menu(['New','Load']),iff('choice','eq',1,newGame(),[ev('EVENT_LOAD_DATA',{saveSlot:0})])],[ev('EVENT_LOAD_DATA',{saveSlot:0})])],false:newGame()})])];

const storyScripts=new Set();
function sharedStory(key,build){
 const id=uid('campaign-script:'+key);
 if(!storyScripts.has(key)){
  storyScripts.add(key);
  const script=build();
  write(path.join(ROOT,'project/scripts',key+'.gbsres'),{_resourceType:'script',id,name:'Story '+key,symbol:'script_story_'+key,description:'Native persistent campaign interaction',variables:{},actors:{},script});
 }
 return [ev('EVENT_CALL_CUSTOM_EVENT',{customEventId:id})];
}
const story=createCampaignEngine(campaign,{ev,iff,set,add,text,menu,share:sharedStory});
const side=createSideEngine(sideContent,{ev,iff,set,add,text,menu,share:sharedStory});
function callSide(scene){return scene?side.node(scene):side.journal();}
function callStory(key){return sharedStory(key,()=>key==='journal'?story.journal():key==='clues'?story.clues():key==='desk'?story.desk():story.node(key.slice(5)));}

function rle(a){let out='',v=-1,n=0;for(const x of a){if(x!==v){if(n)out+=n===1?'!':n.toString(16)+'+';out+=(x%256).toString(16).padStart(2,'0');v=x;n=0;}n++;}return out+(n===1?'!':n?n.toString(16)+'+':'');}
function remapIds(obj,prefix){if(Array.isArray(obj))return obj.map((v,i)=>remapIds(v,prefix+':'+i));if(obj&&typeof obj==='object')return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,k==='id'?uid(prefix):remapIds(v,prefix+':'+k)]));return obj;}
const layoutRaw=read(path.join(ROOT,'world-layout.json'));
const worlds=Array.isArray(layoutRaw)?layoutRaw:(layoutRaw.worlds??layoutRaw.scenes);
if(!Array.isArray(worlds)||worlds.length<6)throw Error('world-layout.json must contain five districts and garage');
const aliases={frostwick:'frostwick',candy_row:'candy',candy:'candy',brassworks:'brassworks',velvet_heights:'velvet',velvet:'velvet',aurora_yard:'aurora',aurora:'aurora',garage:'garage'};
const canonical=s=>aliases[s]??s;
const sceneID=s=>uid('scene:'+canonical(s));
const bgID=s=>uid('background:'+s);
const spriteID=s=>uid('sprite:'+s);
const worldById=new Map(worlds.map(w=>[canonical(w.id),w]));
for(const t of sideContent.tracks)for(const m of t.missions)for(const step of m.steps){if(!step.hint.startsWith(worldById.get(step.node).name+':'))throw Error('Side hint must name its actual scene: '+step.hint);}
const fallbackPaletteColors=[['F1F8FF','ADC9DD','6A879C','1C2948'],['FFF0CE','D98F72','9B435A','342342'],['F4F7C5','AAD49A','45866E','203E49'],['FFF6D8','D7BA87','9B7A68','37334F'],['FFF7BB','E5BF65','B87C4C','543048'],['E3EFF0','A0B4BA','62798D','283846'],['E7FAFF','88CAE1','4489AE','244B78'],['F8F4E4','C4D7DC','647E9B','172640']];
const paletteColors=layoutRaw.palettes?.map(colors=>[...colors].reverse())??fallbackPaletteColors;
const paletteIds=paletteColors.map((_,i)=>uid('palette:'+i));
paletteColors.forEach((colors,i)=>write(path.join(ROOT,`project/palettes/hollywild_${i}.gbsres`),{_resourceType:'palette',id:paletteIds[i],name:['Snow','Brick','Pine','Stone','Amber','Steel','Water','Interface'][i],colors}));
write(path.join(ROOT,'hollywild.gbsproj'),{_resourceType:'project',name:'Hollywild: Elf-Made Empire',author:'Hollywild contributors',notes:'Native Game Boy Color game with a 24-mission opt-in campaign. All five districts and public interiors open from the start.',_version:'4.2.0',_release:'10'});
const settings=read(path.join(TEMPLATE,'project/settings.gbsres'));
const garage=worldById.get('garage');
const spawn=garage.spawn??{x:9,y:12};
Object.assign(settings,{startSceneId:sceneID('garage'),startX:spawn.x,startY:spawn.y,startDirection:'up',startMoveSpeed:1,startAnimSpeed:15,colorMode:'color',cartType:'mbc5',batterylessEnabled:false,defaultBackgroundPaletteIds:paletteIds,defaultSpritePaletteIds:paletteIds,defaultSpritePaletteId:paletteIds[2],defaultUIPaletteId:paletteIds[7],defaultFontId:'4bd653f0-e08d-424e-9e5b-c1f3aaa21e47',defaultPlayerSprites:{TOPDOWN:spriteID('player')},playerPaletteId:paletteIds[4],defaultSceneTypeId:'TOPDOWN',disabledSceneTypeIds:['PLATFORM','ADVENTURE','SHMUP','POINTNCLICK','LOGO'],generateDebugFilesEnabled:true,romFilename:'hollywild',musicDriver:'huge',colorCorrection:'none'});
write(path.join(ROOT,'project/settings.gbsres'),settings);
write(path.join(ROOT,'project/engine_field_values.gbsres'),{_resourceType:'engineFieldValues',engineFieldValues:[{id:'fade_style',value:0},{id:'topdown_grid',value:8}]});
write(path.join(ROOT,'project/variables.gbsres'),{_resourceType:'variables',variables:names.map((name,i)=>({id:String(i),name:name.replaceAll('_',' '),symbol:'var_'+name})),constants:[]});
// Original 16x16 ownership flag, encoded as a native fixed-shade source PNG.
// A flag silhouette and large check mark distinguish it from a sale sign.
function makeOwnedSign(){
 const pixels=Array.from({length:16*16},()=>[0x65,0xff,0x00,255]);
 const inks={dark:[7,24,33,255],mid:[0x86,0xc0,0x6c,255],light:[0xe0,0xf8,0xcf,255]};
 const dot=(x,y,ink)=>{if(x>=0&&x<16&&y>=0&&y<16)pixels[y*16+x]=inks[ink];};
 const box=(x,y,w,h,ink)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)dot(xx,yy,ink);};
 box(2,1,2,15,'dark');box(4,1,11,10,'dark');box(4,2,10,8,'mid');
 for(const[x,y]of[[5,5],[6,6],[7,7],[8,6],[9,5],[10,4],[11,3]]){dot(x,y,'light');dot(x,y+1,'light');}
 const raw=Buffer.alloc(16*(1+16*4));for(let y=0;y<16;y++){raw[y*65]=0;for(let x=0;x<16;x++)pixels[y*16+x].forEach((v,k)=>raw[y*65+1+x*4+k]=v);}
 const crc=b=>{let c=0xffffffff;for(const byte of b){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
 const chunk=(tag,b)=>{const t=Buffer.from(tag),out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length,0);t.copy(out,4);b.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,b])),b.length+8);return out;};
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(16,0);ihdr.writeUInt32BE(16,4);ihdr[8]=8;ihdr[9]=6;
 fs.writeFileSync(path.join(ROOT,'assets/sprites/property_owned.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
makeOwnedSign();
const spriteFiles=fs.readdirSync(path.join(ROOT,'assets/sprites')).filter(f=>f.endsWith('.png'));
for(const filename of spriteFiles){const name=path.basename(filename,'.png');const png=fs.readFileSync(path.join(ROOT,'assets/sprites',filename));const imageWidth=png.readUInt32BE(16);const tpl=imageWidth===96?'actor_animated':imageWidth===48?'actor':'static';const sprite=remapIds(read(path.join(TEMPLATE,`assets/sprites/${tpl}.png.gbsres`)),'sprite:'+name);Object.assign(sprite,{id:spriteID(name),name,symbol:'sprite_'+name,filename,checksum:crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT,'assets/sprites',filename))).digest('hex')});if(imageWidth===96){
 const ambient=layoutRaw.sprites.find(s=>s.id===name)?.ambientAnimation;
 for(const [i,xs]of [[0,[32]],[2,[64]],[3,[0]],[4,[48,32]],[6,[80,64]],[7,[16,0]]]){
  const a=sprite.states[0].animations[i];a.frames.forEach((f,j)=>f.tiles.forEach((t,k)=>t.sliceX=xs[j]+k*8));
 }
 if(ambient){sprite.states[0].animationType='multi';for(const [idle,moving]of [[0,4],[2,6],[3,7]])sprite.states[0].animations[idle].frames=remapIds(sprite.states[0].animations[moving].frames,'ambient:'+name+':'+idle);Object.assign(sprite,{boundsX:0,boundsY:-8,boundsWidth:16,boundsHeight:16,animSpeed:31});}
}
write(path.join(ROOT,'assets/sprites',filename+'.gbsres'),sprite);}
function defaultSprite(type){return ['job_board','save','sign','cocoa','flats','toolworks','parcel','aurora','delivery','interior_info','campaign_desk','campaign_save'].includes(type)?'sign':['salvage','bonus','cache','district_cache'].includes(type)?'crate':type==='rivet'?'rivet':'pip';}
function siteScript(site,wid){
 const type=site.type==='property'?({cocoa:'cocoa',parcel_palace:'parcel',toolworks:'toolworks',lantern_flats:'flats'}[site.id]??site.type):site.type==='npc'?(site.id.startsWith('pip')?'pip':site.id==='rivet_yard'?'rivet_yard':site.id):site.type;
 if(type==='side_node')return [...callSide(site.node),...propertyVisuals(wid)];
 if(type==='campaign_node')return [...callStory('node_'+site.node),...musicFor(wid)];
 if(type==='campaign_desk')return callStory('desk');
 if(type==='campaign_save')return saveTerminal('CITY CHECKPOINT');
 if(type==='interior_info')return interiorInfo(site.property);
 if(type==='district_contact')return districtContact(site.district);
 if(type==='district_cache')return districtCache(site.district);
 if(type==='job_board')return board();
 if(type==='salvage')return salvage();
 if(type==='bonus')return bonus();
 if(type==='delivery')return delivery();
 if(type==='cocoa')return [iff('job','eq',2,delivery(),property('Cocoa Corner','cocoa',100,4,'16 Coins after each\nsuccessful job.'))];
 if(type==='flats')return property('Lantern Flats','flats',240,8,'A home for your crew.\nOptional property.\nA warmer city.');
 if(type==='toolworks')return property('Tinsel Toolworks','toolworks',220,8,'Recycles 2 scrap\nafter each\nsuccessful job.');
 if(type==='parcel')return property('Parcel Palace','parcel',260,8,'20 Coins after each\nsuccessful job.');
 if(type==='aurora')return aurora();
 if(type==='rivet'||type==='workshop'||type==='crew')return workshop();
 if(type==='save'||type==='save_terminal')return saveTerminal();
 if(type==='rivet_yard')return [text('RIVET\nSpare parts make\nstrong neighborhoods.','Fix the workshop\nin your garage.\nI will handle batches.')];
 if(type==='moxie')return [text('MOXIE\nFastest route? Easy.\nBest route? Hmm.','Candy north reaches\nVelvet Heights.\nTry the shortcut!')];
 if(type==='nib')return [text('NIB\nI said open-plan.\nThe roof disagreed.','Lantern Flats needs\n240 Coins, 8 scrap.\nAn honest bargain.')];
 if(type==='dot')return [text('DOT\nThe old station still\nconnects everyone.','Follow Aurora north.\nIt leads to the south\nend of Frostwick.')];
 if(type==='inspect')return [text('VELVET LODGE\nExcellent sunlight.\nRoof sold separately.','A future property.\nFor now, inspect the\nview free of charge.')];
 if(type==='pip')return [text('PIP\nA property empire?\nStart with a warm cup.'),...objective()];
 if(type==='cache'){const flag='cache_'+canonical(wid);if(vars[flag])return [iff(flag,'eq',0,noActive([iff('salvage','lte',97,[set(flag,1),add('salvage',2),text('A hidden stash!\n+2 stored scrap\nExploration pays.')],[text('A hidden stash.\nMake room for\n2 scrap first.')])]),[text('You found this\nlittle city secret.\nKeep wandering.')])];}
 return [text(site.text??site.label??site.name??'A corner of\nHollywild.',...(site.dialogue??[]))];
}
const manifest=[];
for(const [index,w]of worlds.entries()){
 const wid=canonical(w.id);const wt=w.width/8,ht=w.height/8;const stem=path.basename(w.background,'.png');
 const colors=w.paletteIndices??w.tileColors??Array(wt*ht).fill(0);const coll=w.collisions??Array(wt*ht).fill(0);
 if(colors.length!==wt*ht||coll.length!==wt*ht)throw Error(`Bad tile arrays for ${wid}`);
 write(path.join(ROOT,'assets/backgrounds',stem+'.png.gbsres'),{_resourceType:'background',id:bgID(stem),name:w.name??wid,symbol:'bg_'+wid,tileColors:rle(colors),filename:stem+'.png',width:wt,height:ht,imageWidth:w.width,imageHeight:w.height,autoColor:false});
 let script=[...boot(),...musicFor(wid),...propertyVisuals(wid),bind('start',pocket(wid)),bind('select',cityMap())];
 const visit='visited_'+wid;
 if(vars[visit])script.push(iff(visit,'eq',0,[set(visit,1),add('district_count',1),text((w.name??wid).toUpperCase(),'A new district.\nRoads are open.\nFind your own way.'),iff('district_count','eq',5,[iff('cheer','lte',95,[add('cheer',5)],[set('cheer',100)]),text('CITY EXPLORER\nAll five districts!\n+5 Cheer')]) ]));
 const dir=path.join(ROOT,'project/scenes',wid);
 const scene={_resourceType:'scene',id:sceneID(wid),_index:index,type:'TOPDOWN',name:w.name??wid,symbol:'scene_'+wid,x:index*320,y:0,width:wt,height:ht,backgroundId:bgID(stem),tilesetId:'',colorModeOverride:'none',paletteIds,spritePaletteIds:paletteIds,autoFadeSpeed:2,script,playerHit1Script:[],playerHit2Script:[],playerHit3Script:[],collisions:rle(coll.map(v=>v?15:0))};
 write(path.join(dir,'scene.gbsres'),scene);
 const sites=(w.sites??[]).filter(site=>site.type!=='door');
 for(const [i,site]of sites.entries()){
  const ownedVariable=site.type==='property'?({cocoa:'cocoa',parcel_palace:'parcel',toolworks:'toolworks',lantern_flats:'flats'}[site.id]):null;
  const sp=site.sprite??defaultSprite(site.type);const actual=spriteFiles.includes(sp+'.png')?sp:(spriteFiles.includes('pip.png')?'pip':'player');
  const actor={_resourceType:'actor',id:uid('actor:'+wid+':'+site.id),_index:i,symbol:'actor_'+wid+'_'+site.id,prefabId:'',name:site.label??site.name??site.id,coordinateType:'tiles',x:site.x,y:site.y,frame:0,animate:!!layoutRaw.sprites.find(s=>s.id===actual)?.ambientAnimation,spriteSheetId:spriteID(actual),paletteId:paletteIds[site.type==='rivet'?5:site.type==='pip'?2:4],direction:site.direction??'down',moveSpeed:1,animSpeed:layoutRaw.sprites.find(s=>s.id===actual)?.suggestedAnimSpeed??15,isPinned:false,persistent:false,collisionGroup:'',collisionExtraFlags:[],prefabScriptOverrides:{},script:siteScript(site,wid),startScript:ownedVariable?[iff(ownedVariable,'eq',1,[ownedSign()])]:[],updateScript:[],hit1Script:[],hit2Script:[],hit3Script:[]};
  write(path.join(dir,'actors',site.id+'.gbsres'),actor);
  manifest.push({scene:wid,id:site.id,type:site.type,...(site.node?{node:site.node}:{}),x:site.x,y:site.y,sprite:actual});
 }
 for(const [i,exit]of(w.exits??[]).entries()){
  const trig={_resourceType:'trigger',id:uid('exit:'+wid+':'+i),_index:i,symbol:'trigger_'+wid+'_'+i,prefabId:'',name:'To '+exit.destScene,x:exit.x,y:exit.y,width:exit.width??2,height:exit.height??2,prefabScriptOverrides:{},script:[ev('EVENT_SWITCH_SCENE',{sceneId:sceneID(exit.destScene),x:N(exit.destX),y:N(exit.destY),direction:exit.direction??'',fadeSpeed:2})],leaveScript:[]};
  write(path.join(dir,'triggers','exit_'+i+'.gbsres'),trig);
 }
}
write(path.join(ROOT,'gameplay-source.json'),{format:'Hollywild native source manifest',version:2,campaign:{title:campaign.title,targetMinutes:campaign.targetMinutes,missions:campaign.missions.length,lore:campaign.lore.length,source:'content/campaign.json',state:'Native mission, step, choice and lore globals; manual one-slot checkpoint saves',rewards:'Guarded once; pending completion retried from final node, desk or Story journal; no crew tick'},gbStudio:'4.3.2',project:'hollywild.gbsproj',variables:Object.fromEntries(names.map((n,i)=>[n,{id:String(i),symbol:'VAR_'+n.toUpperCase()}])),sideStories:{tracks:sideContent.tracks.length,missions:sideContent.tracks.reduce((n,t)=>n+t.missions.length,0),source:'content/side-stories.json'},sites:manifest,economy:{startCoins:100,firstSalvage:10,repeatSalvage:6,firstBonus:4,repeatBonus:2,delivery:20,repair:{coins:40,salvage:4},workshop:{input:2,output:30,reserve:4},cocoa:{coins:100,salvage:4,payout:16},commission:{coins:25,salvage:2},crewModes:{maker:0,recycler:1,runner:2,disabledSnapshot:3}},prototypeNotes:['Owned properties display a persistent check-flag sign.','One active job at a time.','No world traversal gate depends on story progress.','Manual garage and city checkpoint saves are disabled during active jobs. Loading is allowed after explicit confirmation and restores the saved checkpoint.','Capacity guard at dispatch: at most9800 Coins and79 stored Scrap.','Toolworks is a passive recycler in this prototype.','Property ownership and income are optional. Aurora restoration is earned by campaign completion, with no purchase gate; extra worker assignment UI is not yet implemented.','Four interiors are public and freely inspectable.','Five independent local commissions each pay 25 Coins and 2 scrap once, without production ticks.','Rivet modes: maker 2 scrap to 30 Coins with reserve 4; recycler adds 2 scrap; runner adds 10 Coins. Modes snapshot at dispatch.']});
console.log(`Generated ${worlds.length} native scenes, ${manifest.length} interactables, ${names.length} state variables, ${eventCounter} script events.`);
