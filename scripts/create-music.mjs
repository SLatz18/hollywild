#!/usr/bin/env node
/** Compile an explicitly authored four-channel score with the official UGE writer. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {score,seasonal} from '../content/score.mjs';
const root=path.resolve(import.meta.dirname,'..'),gb=path.join(root,'.tools/gb-studio');
const {build}=createRequire(path.join(gb,'package.json'))('esbuild');
const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'hollywild-score-'));
const blank=()=>({note:null,instrument:null,effectCode:null,effectParam:null});
const sub=()=>Array.from({length:64},()=>({note:null,jump:null,effectCode:null,effectParam:null}));
const duty=(index,name,volume,decay,dutyCycle)=>({index,name,length:null,dutyCycle,initialVolume:volume,volumeSweepChange:decay,frequencySweepTime:0,frequencySweepShift:0,subpatternEnabled:false,subpattern:sub()});
const noise=(index,name,volume,decay,length,bitCount=15)=>({index,name,length,initialVolume:volume,volumeSweepChange:decay,bitCount,subpatternEnabled:false,subpattern:sub()});
const pc={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
// Engine period44 at index0 means audible C2 on pulse and C1 on wave.
const pitch=(name,wave=false)=>{const m=/^([A-G][b#]?)(\d)$/.exec(name);assert(m,name);return (+m[2]-2)*12+pc[m[1]]+(wave?12:0);};
const events=(bar,wave=false)=>bar?bar.split(/\s+/).map(t=>{const [r,n,d]=t.split(':');return {row:+r,note:pitch(n,wave),duration:+d};}):[];
const quality={maj9:[0,4,7,11,14],m9:[0,3,7,10,14],m7:[0,3,7,10],m7b5:[0,3,6,10],m6:[0,3,7,9],maj7:[0,4,7,11],6:[0,4,7,9],7:[0,4,7,10],9:[0,4,7,10,14],13:[0,4,7,10,14,21],sus:[0,5,7,10]};
const chord=s=>{const m=/^([A-G][b#]?)(.+)$/.exec(s);assert(m&&quality[m[2]],s);return {root:pc[m[1]],tones:quality[m[2]]};};
const grooves={
 pocket:{kick:[[0,7,10],[0,6,11]],snare:[[4,12],[4,12]],hats:[[2,6,10,14],[2,6,10,14]],comp:[[2,9],[3,10]],delay:2},
 brush:{kick:[[0,10],[0,9]],snare:[[4,12],[4,12]],hats:[[2,10],[2,6,14]],comp:[[4,12],[5,13]],delay:1},
 skip:{kick:[[0,7,10],[0,6,14]],snare:[[4,12],[4,12]],hats:[[2,5,10,13],[2,6,9,13]],comp:[[2,7,13],[3,9]],delay:1},
 machine:{kick:[[0,3,8,11],[0,6,8,14]],snare:[[4,12],[4,12]],hats:[[2,6,10,14],[2,6,10,15]],comp:[[1,7],[2,10]],delay:0},
 halftime:{kick:[[0],[0,11]],snare:[[8],[8]],hats:[[3,11],[3,7,11]],comp:[[6],[5,13]],delay:2},
 suspended:{kick:[[0,10],[2,10]],snare:[[12],[4,12]],hats:[[6,14],[6]],comp:[[3,11],[4]],delay:1},
 celebration:{kick:[[0,6,10],[0,7,10,14]],snare:[[4,12],[4,12]],hats:[[2,6,10,14],[2,6,10,14]],comp:[[2,7,13],[3,10]],delay:1}
};
function select(section,i){
 if(section==='bridge')return ['B',i];
 if(section==='answer')return [i<4?'A':'B',i];
 if(['space','hush','break'].includes(section))return [i<4?'A':'B',i];
 if(section==='outro')return [i<6?'B':'A',i];
 return ['A',i];
}
const uuid=key=>{const h=createHash('sha256').update(`chromatic-city/original-score/v1/${key}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
try{
 const output=path.join(scratch,'uge.cjs');await build({entryPoints:[path.join(gb,'src/shared/lib/uge/ugeHelper.ts')],bundle:true,platform:'node',format:'cjs',outfile:output,tsconfig:path.join(gb,'tsconfig.json'),logLevel:'silent'});
 const {saveUGESong,loadUGESong}=createRequire(import.meta.url)(output),tracks=[];
 await fs.mkdir(path.join(root,'assets/music'),{recursive:true});
 for(const [key,s]of Object.entries(score)){
  for(const theme of [s.A,s.B])for(const field of ['chords','lead','bass'])assert.equal(theme[field].length,8,`${key} ${field}`);
  const total=s.form.length*8,rows=total*16,g=grooves[s.groove],holiday=seasonal[key];
  const song={version:6,name:s.name,artist:'Hollywild Original Score',comment:'Original authored phrases; 48-bar developed form. Four native channels.',filename:key,
   dutyInstruments:[duty(0,'Pocket Keys',7,-5,2),duty(1,'Long Answer',7,-2,2),duty(2,'Quiet Guide Tones',4,-6,2),duty(3,'Copper Reed',7,-5,0),duty(4,'Small Music Box',5,-4,1),duty(5,'Soft Reprise',5,-3,2)],
   waveInstruments:[{index:0,name:'Round Harmonic Bass',length:null,volume:2,waveIndex:0,subpatternEnabled:false,subpattern:sub()},{index:1,name:'Quiet Bass',length:null,volume:3,waveIndex:0,subpatternEnabled:false,subpattern:sub()}],
   noiseInstruments:[noise(0,'Short Kick',8,-7,24,7),noise(1,'Brush Snare',5,-7,14),noise(2,'Closed Hat',2,-7,4),noise(3,'Ghost Rim',3,-7,7),noise(4,'Sleigh Fleck',3,-7,5),noise(5,'Open Hat',3,-7,12)],
   waves:[Uint8Array.from({length:32},(_,i)=>Math.max(0,Math.min(15,Math.round(7.5+5.5*Math.sin(2*Math.PI*i/32)+1.8*Math.sin(4*Math.PI*i/32)))))],
   ticksPerRow:s.ticks,timerEnabled:false,timerDivider:0,patterns:[],sequence:[]};
  const timeline=Array.from({length:4},()=>Array.from({length:rows},blank));
  const occupied=Array.from({length:3},()=>new Set()),counts=[0,0,0,0],sectionCounts=s.form.map(()=>[0,0,0,0]),joins=[];
  function put(ch,start,note,instrument,duration=null,delay=0){
   assert(Number.isInteger(note)&&note>=0&&note<=71,`${key}: note ${note}`);assert(start>=0&&start<rows);
   assert.equal(timeline[ch][start].note,null,`${key}: collision ${ch}/${start}`);
   if(duration!==null){assert(duration>0&&duration<=12&&start+duration<=rows);
    for(let n=start;n<start+duration;n++){assert(!occupied[ch].has(n),`${key}: overlapping voice ${ch}/${n}`);occupied[ch].add(n);}
   }
   timeline[ch][start]={...blank(),note,instrument,...(delay?{effectCode:7,effectParam:delay}:{})};counts[ch]++;sectionCounts[Math.floor(start/128)][ch]++;
   if(duration!==null&&start+duration<rows)timeline[ch][start+duration]={...blank(),effectCode:14,effectParam:0};
  }
  let lastComp=19;
  const plans=Array.from({length:total},(_,bar)=>{const section=s.form[Math.floor(bar/8)],i=bar%8,[theme,n]=select(section,i);return {bar,section,i,theme,n,data:s[theme],quiet:['space','hush','break'].includes(section)};});
  for(const p of plans){
   const {bar,section,i,data,n,quiet}=p,base=bar*16,h=chord(data.chords[n]);
   let melody=events(data.lead[n]);
   if(quiet&&i<(section==='hush'?6:4))melody=[];
   if(section==='opening'&&i>=2&&i<4)melody=[];
   // The final bar leaves an intentional breath; other voices carry the cadence.
   if(section==='outro'&&i===7)melody=melody.filter(e=>e.row<10);
   for(const e of melody){const box=holiday?.boxBars.includes(bar);let instrument=box?4:quiet?5:key==='brassworks'?3:e.duration>=5?1:0;
    put(0,base+e.row,e.note,instrument,e.duration,(g.delay&&e.row%2)?1:0);}
   let compRows=quiet?(i%2?[7]:[4]):g.comp[i%2];
   if(section==='hush'&&i<4)compRows=[];
   if(section==='opening'&&i<2)compRows=[];
   compRows.forEach((r,j)=>{
    const tone=h.tones[j%2?3:1]??h.tones[1],pcValue=(h.root+tone)%12;
    const choices=[12+pcValue,24+pcValue].filter(v=>v<=27);
    const note=choices.sort((a,b)=>Math.abs(a-lastComp)-Math.abs(b-lastComp))[0];lastComp=note;
    put(1,base+r,note,2,quiet?3:2,g.delay?1:0);
   });
   let bass=events(data.bass[n],true);
   if(quiet)bass=bass.filter((e,index)=>index===0||(i%2===1&&e.row>=14));
   // Authored final pickups target the following section's actual first bass,
   // avoiding a C pickup when the next section instead begins on F, for example.
   const next=plans[(bar+1)%total],nextBass=events(next.data.bass[next.n],true)[0].note;
   const end=bass.at(-1);
   if(i===7&&end&&end.row>=12&&end.duration<=3&&Math.abs(end.note-nextBass)>4){
    const before=end.note;end.note=nextBass-1;assert(end.note>=11&&end.note<=25);joins.push({bar,from:before,to:end.note,next:nextBass});
   }
   for(const e of bass)put(2,base+e.row,e.note,quiet?1:0,e.duration);
   const hits=new Map();
   for(const r of (quiet?[2]:g.hats[i%2]))hits.set(r,[54,2,((r%4===2)&&g.delay)?2:0]);
   if(!quiet&&i===7)hits.set(15,[50,3,0]);
   if(holiday?.sleighBars.includes(bar))for(const r of [2,3,10,11])hits.set(r,[r%2?51:49,4,0]);
   for(const r of (quiet?[0]:g.kick[i%2]))hits.set(r,[46,0,0]);
   for(const r of (quiet?(i%2?[12]:[]):g.snare[i%2]))hits.set(r,[46,1,g.delay]);
   if(section==='opening'&&i<2)for(const [r,hit]of hits)if(hit[1]!==0)hits.delete(r);
   for(const [r,[note,instrument,delay]]of hits)put(3,base+r,note,instrument,null,delay);
  }
  // Envelopes are allowed to decay before explicit phrase cuts. Begin every
  // silent loop voice off; this also prevents a last-bar carry across the seam.
  for(let ch=0;ch<3;ch++)if(timeline[ch][0].note===null)timeline[ch][0]={...blank(),effectCode:14,effectParam:0};
  for(let block=0;block<rows/64;block++){
   const start=song.patterns.length;song.patterns.push(...timeline.map(ch=>ch.slice(block*64,block*64+64)));song.sequence.push({splitPattern:false,channels:[start,start+1,start+2,start+3]});
  }
  while(song.dutyInstruments.length<15)song.dutyInstruments.push(duty(song.dutyInstruments.length,'Unused',0,0,2));
  while(song.waveInstruments.length<15)song.waveInstruments.push({...song.waveInstruments[1],index:song.waveInstruments.length,name:'Unused'});
  while(song.noiseInstruments.length<15)song.noiseInstruments.push(noise(song.noiseInstruments.length,'Unused',0,0,1));
  const bytes=saveUGESong(song),loaded=loadUGESong(bytes);assert(bytes.equals(saveUGESong(loaded)));assert.equal(loaded.sequence.length,12);assert.equal(loaded.patterns.length,48);
  const parsed=[0,0,0,0],uses=[0,0],signature=[];
  for(const order of loaded.sequence)for(let ch=0;ch<4;ch++)for(const c of loaded.patterns[order.channels[ch]]){
   if(c.note!==null){parsed[ch]++;assert(c.instrument>=0&&c.instrument<15);
    if(ch===0){assert(c.note>=19&&c.note<=40);if(c.instrument===4)uses[0]++;}
    if(ch===2)assert(c.note>=11&&c.note<=24);
    if(ch===3){assert(c.note>=40&&c.note<=55);if(c.instrument===4)uses[1]++;}
   }
   if(c.effectCode===7)assert(c.effectParam>0&&c.effectParam<s.ticks);
  }
  assert.deepEqual(parsed,counts);assert.equal(uses[0]>0,Boolean(holiday));assert.equal(uses[1]>0,Boolean(holiday?.sleighBars.length));
  for(let section=0;section<6;section++)signature.push(createHash('sha256').update(JSON.stringify(timeline.map(ch=>ch.slice(section*128,(section+1)*128)))).digest('hex'));
  assert(new Set(signature).size>=5,`${key}: too many duplicated complete sections`);
  for(let i=0;i<6;i++)if(['space','hush','break'].includes(s.form[i]))assert(sectionCounts[i].every((v,ch)=>v<sectionCounts[0][ch]));
  const resource={_resourceType:'music',id:uuid(key),name:s.name,symbol:`song_${key}`,filename:`${key}.uge`,settings:{},type:'uge'};
  await fs.writeFile(path.join(root,'assets/music',resource.filename),bytes);await fs.writeFile(path.join(root,'assets/music',resource.filename+'.gbsres'),JSON.stringify(resource,null,2)+'\n');
  tracks.push({...resource,key,bpm:Number((900/s.ticks).toFixed(2)),ticksPerRow:s.ticks,bars:total,loopSeconds:Number((rows*s.ticks/59.7275).toFixed(2)),identity:s.identity,form:s.form,chords:{A:s.A.chords,B:s.B.chords},groove:s.groove,noteCounts:counts,sections:s.form.map((name,i)=>({name,noteCounts:sectionCounts[i]})),sectionPickupAdjustments:joins,seasonal:{musicBoxBars:holiday?.boxBars??[],sleighBars:holiday?.sleighBars??[],musicBoxNotes:uses[0],sleighHits:uses[1]},sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  console.log(`${key}: explicit phrases, ${total} bars, ${counts.join('/')} notes; six-section form and sparse passage verified`);
 }
 assert.equal(new Set(tracks.map(t=>t.sha256)).size,7);
 const manifest={version:2,composer:'Hollywild Original Score',provenance:'Original explicit A/B melodies and bass lines, authored in content/score.mjs. No sampled recordings, copied melodies or lyrics.',pitchConvention:'Scientific audible pulse pitch: index0 C2; wave index0 C1, compensated in the compiler.',channels:['Pulse1 melody and phrase answers','Pulse2 sparse voice-led guide tones','Wave bass with a stronger second harmonic','Noise valid-clock kick, brushes, hats and selective sleigh accents'],tracks,musicResources:tracks.map(({_resourceType,id,name,symbol,filename,settings,type})=>({_resourceType,id,name,symbol,filename,settings,type}))};
 await fs.writeFile(path.join(root,'content/soundtrack.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{await fs.rm(scratch,{recursive:true,force:true});}
