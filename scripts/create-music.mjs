#!/usr/bin/env node
/** Original four-channel arrangements, serialized by the pinned GB Studio writer. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const gb = path.join(root, '.tools/gb-studio');
const requireGB = createRequire(path.join(gb, 'package.json'));
const { build } = requireGB('esbuild');
// Bundle the local official helpers with their own tsconfig aliases. No network packages.
const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'chromatic-uge-'));
try {
  const output = path.join(scratch, 'official-uge.cjs');
  await build({entryPoints:[path.join(gb,'src/shared/lib/uge/ugeHelper.ts')],bundle:true,platform:'node',format:'cjs',outfile:output,tsconfig:path.join(gb,'tsconfig.json'),logLevel:'silent'});
  const { saveUGESong, loadUGESong } = createRequire(import.meta.url)(output);
  const blank = () => ({note:null,instrument:null,effectCode:null,effectParam:null});
  const sub = () => Array.from({length:64},()=>({note:null,jump:null,effectCode:null,effectParam:null}));
  const duty = (index,name,volume,decay,dutyCycle) => ({index,name,length:null,dutyCycle,initialVolume:volume,volumeSweepChange:decay,frequencySweepTime:0,frequencySweepShift:0,subpatternEnabled:false,subpattern:sub()});
  const noise = (index,name,volume,decay,length,bitCount=15) => ({index,name,length,initialVolume:volume,volumeSweepChange:decay,bitCount,subpatternEnabled:false,subpattern:sub()});
  const uuid = key => {const h=createHash('sha256').update(`chromatic-city/original-score/v1/${key}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
  const qualities = {maj9:[0,4,7,11,14],min9:[0,3,7,10,14],dom9:[0,4,7,10,14],min11:[0,3,7,10,17],maj6:[0,4,7,9,14]};
  // Each set contains four original harmonic destinations, expressed relative to C3.
  const specs = [
    {key:'garage',name:'Porchlight Pocket',ticks:10,chords:[[0,'maj9'],[9,'min9'],[2,'min9'],[7,'dom9']],motif:[2,4,3,1,2,0],kick:[0,7,10],mood:'Warm home-base keys, loose backbeat and a returning ninth.'},
    {key:'frostwick',name:'Snowglass Steps',ticks:11,chords:[[2,'min9'],[7,'min11'],[0,'maj9'],[5,'maj9']],motif:[4,3,2,4,1,2],kick:[0,6,11],mood:'Airy upper-register answers over a spacious minor pocket.'},
    {key:'candy',name:'Peach Soda Pavement',ticks:9,chords:[[5,'maj6'],[2,'min9'],[7,'dom9'],[0,'maj9']],motif:[1,2,4,2,3,1],kick:[0,7,14],mood:'Playful sixths, bright offbeats and short ascending key phrases.'},
    {key:'brassworks',name:'Copper After Hours',ticks:9,chords:[[4,'min9'],[9,'dom9'],[2,'min9'],[7,'dom9']],motif:[0,2,1,3,2,4],kick:[0,3,10],mood:'Taut minor turnaround, darker pulse comping and metallic rim answers.'},
    {key:'velvet',name:'Lilac Window Seat',ticks:11,chords:[[8,'maj9'],[5,'min9'],[1,'maj9'],[3,'dom9']],motif:[3,2,4,1,0,2],kick:[0,10],mood:'Soft major sevenths and a late-night half-time feel.'},
    {key:'aurora',name:'Rooftop Blue Hour',ticks:10,chords:[[9,'min11'],[5,'maj9'],[0,'maj9'],[7,'dom9']],motif:[4,2,3,4,1,2],kick:[0,6,10],mood:'Suspended elevenths open into warm major chords beneath high keys.'},
    {key:'finale',name:'All the Windows Glow',ticks:9,chords:[[0,'maj9'],[4,'min9'],[5,'maj6'],[7,'dom9']],motif:[2,3,4,2,1,4],kick:[0,7,10,15],mood:'Full ensemble reprise with an original rising answer and soft landing.'},
  ];
  await fs.mkdir(path.join(root,'assets/music'),{recursive:true});
  const tracks=[];
  for (const spec of specs) {
    const song={version:6,name:spec.name,artist:'Chromatic City Original Score',comment:'Original composition. Pulse keys / comping, wave bass, noise kit. 32-bar seamless loop.',filename:spec.key,dutyInstruments:[duty(0,'Felt Pocket Keys',9,-3,2),duty(1,'Soft Chord Dust',5,-5,2),duty(2,'Glass Bell Answer',7,-4,1),duty(3,'Copper Muted Keys',7,-4,0)],waveInstruments:[{index:0,name:'Rounded Sine Bass',length:null,volume:2,waveIndex:0,subpatternEnabled:false,subpattern:sub()}],noiseInstruments:[noise(0,'Low Pillow Kick',10,-7,22,7),noise(1,'Brushed Backbeat',8,-6,12),noise(2,'Closed Dust Hat',3,-7,4),noise(3,'Soft Rim Ghost',4,-7,5)],waves:[Uint8Array.from({length:32},(_,i)=>Math.round(7.5+6.5*Math.sin(2*Math.PI*i/32)+0.7*Math.sin(4*Math.PI*i/32)))],ticksPerRow:spec.ticks,timerEnabled:false,timerDivider:0,patterns:[],sequence:[]};
    const counts=[0,0,0,0];
    // Eight four-bar blocks: A, A answer, B, B lift, A sparse, A answer,
    // C high answer, turnaround. Final dominant resolves into the first tonic.
    for(let block=0;block<8;block++) {
      const channels=Array.from({length:4},()=>Array.from({length:64},blank));
      const put=(channel,row,note,instrument,gate=null)=>{assert(note>=0&&note<=71);assert.equal(channels[channel][row].note,null);channels[channel][row]={...blank(),note,instrument};counts[channel]++;if(gate!==null&&row+gate<64&&channels[channel][row+gate].note===null)channels[channel][row+gate]={...blank(),effectCode:14,effectParam:0};};
      for(let bar=0;bar<4;bar++) {
        let chordIndex=bar;
        // Middle section reorders harmony while retaining each track's color.
        if(block===2||block===3)chordIndex=[2,1,0,3][bar];
        const [base,quality]=spec.chords[chordIndex], tones=qualities[quality], row=bar*16;
        const higher=block===6?12:0;
        const melodicRows=block===4?[3,8,14]:[0,3,6,8,11,14];
        melodicRows.forEach((r,i)=>{
          if(block===0&&bar===0&&i===0)return; // leave room for the downbeat
          const degree=(spec.motif[(i+bar+(block%2))%spec.motif.length]+(block===3?1:0))%tones.length;
          put(0,row+r,12+base+tones[degree]+higher,spec.key==='brassworks'?3:(block===6?2:0),r===14?1:2);
        });
        // Shell voicings imply full extended chords through thirds, sevenths and ninths.
        const compRows=block===4?[0,6,11]:[0,2,5,7,10,13];
        compRows.forEach((r,i)=>put(1,row+r,12+base+tones[[1,3,4,2,3,1][i%6]],1,1));
        // Bass has rests, anticipation, fifths and a short approach to the next root.
        put(2,row,base,0,3);put(2,row+6,base+7,0,2);put(2,row+10,base,0,3);
        if(block%2===1){const next=spec.chords[(bar+1)%4][0];put(2,row+15,next,0);}
        const hits=new Map([[2,[43,2]],[6,[43,2]],[9,[43,2]],[14,[43,2]],[4,[22,1]],[12,[22,1]]]);
        for(const r of spec.kick)hits.set(r,[3,0]);
        // Keep the snare backbeat clear even in the denser finale pocket.
        hits.set(4,[22,1]);hits.set(12,[22,1]);
        if(block%2===1&&bar===3){hits.set(13,[27,3]);hits.set(15,[30,3]);}
        if(spec.key==='velvet')hits.delete(4);
        for(const [r,[n,instrument]]of hits)put(3,row+r,n,instrument);
      }
      const offset=song.patterns.length;song.patterns.push(...channels);song.sequence.push({splitPattern:false,channels:[offset,offset+1,offset+2,offset+3]});
    }
    // Official v6 writer expects complete 15-slot instrument banks.
    while(song.dutyInstruments.length<15)song.dutyInstruments.push(duty(song.dutyInstruments.length,'Unused Pulse',0,0,2));
    while(song.waveInstruments.length<15)song.waveInstruments.push({...song.waveInstruments[0],index:song.waveInstruments.length,name:'Unused Wave'});
    while(song.noiseInstruments.length<15)song.noiseInstruments.push(noise(song.noiseInstruments.length,'Unused Noise',0,0,1));
    const bytes=saveUGESong(song);const loaded=loadUGESong(bytes);const again=saveUGESong(loaded);
    assert(bytes.equals(again),'Official UGE read/write roundtrip differs');
    assert.equal(loaded.patterns.length,32);assert.equal(loaded.sequence.length,8);
    const parsedCounts=[0,0,0,0];
    for(const order of loaded.sequence)for(let ch=0;ch<4;ch++){
      const pattern=loaded.patterns[order.channels[ch]];assert.equal(pattern.length,64);
      let sounding=false, longest=0, held=0;
      for(const cell of pattern){
        if(cell.note!==null){assert(cell.note>=0&&cell.note<=71);assert(Number.isInteger(cell.instrument));assert(cell.instrument>=0&&cell.instrument<15);parsedCounts[ch]++;sounding=true;held=0;}
        if(cell.effectCode===14){assert.equal(cell.effectParam,0);sounding=false;held=0;}
        if(sounding)longest=Math.max(longest,++held);
      }
      // Melodic and bass channels must breathe; percussion has hardware gates.
      if(ch<3)assert(longest<=6,`Unintended long hold in ${spec.key} channel ${ch}`);
    }
    assert.deepEqual(parsedCounts,counts);
    assert(counts.every(n=>n>=96));
    const resource={_resourceType:'music',id:uuid(spec.key),name:spec.name,symbol:`song_${spec.key}`,filename:`${spec.key}.uge`,settings:{},type:'uge'};
    await fs.writeFile(path.join(root,'assets/music',resource.filename),bytes);
    await fs.writeFile(path.join(root,'assets/music',`${resource.filename}.gbsres`),JSON.stringify(resource,null,2)+'\n');
    tracks.push({...resource,key:spec.key,bpm:Number((900/spec.ticks).toFixed(2)),ticksPerRow:spec.ticks,bars:32,loopSeconds:Number((512*spec.ticks/59.7275).toFixed(2)),chords:spec.chords.map(([r,q])=>`${['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'][r]} ${q}`),mood:spec.mood,noteCounts:counts,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
    console.log(`${spec.key}: official v6 roundtrip OK, ${bytes.length} bytes, notes ${counts.join('/')}`);
  }
  assert.equal(new Set(tracks.map(t=>t.sha256)).size,7,'Tracks must be distinct');
  const manifest={version:1,composer:'Chromatic City Original Score',provenance:'Original arrangements, generated from authored harmonic and rhythmic structures; no recordings, samples, existing melodies or lyrics.',channels:['Pulse 1: felt keys and melodic answers','Pulse 2: extended-chord shell comping','Wave: rounded sine bass','Noise: pillow kick, brush snare, dust hat, rim ghost'],soundbank:['Felt Pocket Keys','Soft Chord Dust','Glass Bell Answer','Copper Muted Keys','Rounded Sine Bass','Low Pillow Kick','Brushed Backbeat','Closed Dust Hat','Soft Rim Ghost'],tracks,musicResources:tracks.map(({_resourceType,id,name,symbol,filename,settings,type})=>({_resourceType,id,name,symbol,filename,settings,type}))};
  await fs.writeFile(path.join(root,'content/soundtrack.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{await fs.rm(scratch,{recursive:true,force:true});}
