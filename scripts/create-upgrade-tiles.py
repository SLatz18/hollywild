#!/usr/bin/env python3
"""Make native tile patches, proving deduplicated base tiles change consistently."""
import hashlib,json,math,uuid
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
layout=json.loads((ROOT/'world-layout.json').read_text())
patches=[]
for scene in layout['scenes']:
    for variant in scene.get('backgroundVariants',[]):
        base=Image.open(ROOT/'assets/backgrounds'/scene['background']).convert('RGB')
        target=Image.open(ROOT/'assets/backgrounds'/variant['background']).convert('RGB')
        assert target.size==base.size
        assert variant['paletteIndices']==scene['paletteIndices']
        mapping={};origins={}
        for y in range(0,base.height,8):
            for x in range(0,base.width,8):
                key=base.crop((x,y,x+8,y+8)).tobytes()
                value=target.crop((x,y,x+8,y+8)).tobytes()
                assert key not in mapping or mapping[key]==value, (scene['id'],'ambiguous shared tile',x,y)
                mapping[key]=value;origins.setdefault(key,(x//8,y//8))
        changes=[(key,value)for key,value in mapping.items()if key!=value]
        assert changes
        width=min(16,len(changes));height=math.ceil(len(changes)/width)
        image=Image.new('RGB',(width*8,height*8),(7,24,33));edits=[]
        for index,(old,new)in enumerate(changes):
            image.paste(Image.frombytes('RGB',(8,8),new),((index%width)*8,(index//width)*8))
            x,y=origins[old];edits.append({'x':x,'y':y,'tileIndex':index})
        name=scene['id']+'_upgrade';filename=name+'.png'
        folder=ROOT/'assets/tilesets';folder.mkdir(exist_ok=True)
        image.save(folder/filename)
        resource={'_resourceType':'tileset','id':str(uuid.uuid5(uuid.NAMESPACE_URL,'hollywild:'+name)),
                  'name':name,'symbol':'tileset_'+name,'filename':filename,
                  'width':width,'height':height,'imageWidth':width*8,'imageHeight':height*8}
        (folder/(filename+'.gbsres')).write_text(json.dumps(resource,indent=2)+'\n')
        patches.append({'scene':scene['id'],'variable':variant['variable'],'tilesetId':resource['id'],'changes':edits,
                        'baseSha256':hashlib.sha256((ROOT/'assets/backgrounds'/scene['background']).read_bytes()).hexdigest(),
                        'upgradedSha256':hashlib.sha256((ROOT/'assets/backgrounds'/variant['background']).read_bytes()).hexdigest()})
(ROOT/'content/visual-upgrades.json').write_text(json.dumps({'patches':patches},indent=2)+'\n')
print(json.dumps({'patches':[{'scene':p['scene'],'tileReplacements':len(p['changes'])}for p in patches]},indent=2))
