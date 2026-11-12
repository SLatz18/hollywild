#!/usr/bin/env python3
"""Screen-and-buttons-only player sessions for blind agent usability research.

No source-derived navigation, answers, gameplay symbols or memory inspection.
One private SRAM stream and capture directory per participant. JSON lines in,
PNG paths out. This simulates a player session; it is not human research.
"""
import argparse,hashlib,io,json,time
from pathlib import Path
from pyboy import PyBoy
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('participant');args=p.parse_args()
assert args.participant.replace('_','').replace('-','').isalnum()
out=ROOT/'test-results/player-research'/args.participant;out.mkdir(parents=True,exist_ok=True)
rom=ROOT/'build/rom/hollywild.gbc';romhash=hashlib.sha256(rom.read_bytes()).hexdigest()
ram=io.BytesIO(bytes(32768));start=time.monotonic();history=[];frame=0

machine=PyBoy(str(rom),window='null',sound_emulated=True,ram_file=ram);machine.set_emulation_speed(0)
def tick(frames):
    global frame
    machine.tick(frames);frame+=frames

def capture():
    n=len(history);name=out/f'screen-{n:03d}.png'
    machine.screen.image.resize((640,576),Image.Resampling.NEAREST).save(name)
    return str(name)

def persist():
    (out/'session.json').write_text(json.dumps({'romSha256':romhash,'participant':args.participant,
       'method':'screen-only agent playtest, not human research','elapsedWallSeconds':time.monotonic()-start,
       'simulatedFrames':frame,'commands':history},indent=2)+'\n')

tick(380);print(json.dumps({'ready':True,'screen':capture(),'controls':'tap a/b/start/select or hold up/down/left/right; frames; wait; restart; stop'}),flush=True)
try:
    for line in __import__('sys').stdin:
        try:
            command=json.loads(line)
            assert hashlib.sha256(rom.read_bytes()).hexdigest()==romhash,'ROM changed during research session'
            if 'tap' in command:
                assert command['tap']in ('a','b','start','select','up','down','left','right')
                count=command.get('count',1);assert 1<=count<=8
                for _ in range(count):machine.button(command['tap']);tick(command.get('frames',200))
            if 'hold' in command:
                assert command['hold']in ('up','down','left','right')
                frames=command.get('frames',16);assert 1<=frames<=120
                machine.button_press(command['hold']);tick(frames);machine.button_release(command['hold']);tick(1)
            if 'wait' in command:
                assert 1<=command['wait']<=1800;tick(command['wait'])
            if command.get('restart'):
                ram.seek(0);machine.stop(ram_file=ram);ram.seek(0)
                machine=PyBoy(str(rom),window='null',sound_emulated=True,ram_file=ram);machine.set_emulation_speed(0);tick(380)
            history.append({'input':command,'frame':frame});screen=capture();history[-1]['screen']=Path(screen).name;persist()
            print(json.dumps({'ok':True,'screen':screen}),flush=True)
            if command.get('stop'):break
        except Exception as e:print(json.dumps({'error':str(e)}),flush=True)
finally:
    machine.stop(save=False);persist()
