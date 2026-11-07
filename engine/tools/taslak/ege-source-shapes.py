"""Restore the legitimate institution/date text boxes in IEU's official front pages.

These DrawingML boxes are content, not editing instructions. Coordinates come from
the source wp:anchor; no textbox content is guessed from a university name.
"""
import importlib
import re
from pathlib import Path
from types import SimpleNamespace

measure=importlib.import_module('extract-docx-spec')
converter=importlib.import_module('docx-spec-to-template')


def restore_front_textboxes(draft,spec,source):
    if not Path(source['path']).name.startswith('IEU_'):
        return
    package=measure.Package(Path(spec['file']['path']))
    try:
        document=package.xml('word/document.xml')
        defaults,styles=measure.read_styles(package)
        default_style=measure.default_paragraph_style(styles)
        helper=converter.Draft(spec,SimpleNamespace())
        t=draft['template'];page=t['page'];m=page['margins']
        ns=measure.NS
        for index,anchor in enumerate(document.findall('.//wp:anchor',ns),1):
            box=anchor.find('.//w:txbxContent',ns)
            if box is None:
                continue
            extent=anchor.find('wp:extent',ns)
            horizontal=anchor.find('wp:positionH',ns);vertical=anchor.find('wp:positionV',ns)
            if extent is None or horizontal is None or vertical is None:
                continue
            width=int(extent.get('cx'))/36000;height=int(extent.get('cy'))/36000
            def coordinate(axis,total,before,after,length):
                relative=axis.get('relativeFrom')
                if relative not in ('page','margin'):
                    return None
                start=before if relative=='margin' else 0
                available=total-before-after if relative=='margin' else total
                offset=axis.find('wp:posOffset',ns)
                if offset is not None:
                    return start+int(offset.text)/36000
                alignment=axis.find('wp:align',ns)
                if alignment is None:
                    return None
                return start+({'left':0,'top':0,'center':(available-length)/2,'right':available-length,'bottom':available-length}.get(alignment.text,0))
            x=coordinate(horizontal,page['widthMm'],m['leftMm'],m['rightMm'],width)
            y=coordinate(vertical,page['heightMm'],m['topMm'],m['bottomMm'],height)
            if x is None or y is None:
                draft['unknown'].append({'field':'sections.textBox','reason':f'{source["path"]}: paragraf/sütun bağıl kutunun mutlak konumu doğrulanmalı.'});continue
            owner=anchor
            while owner.getparent() is not None and owner.getparent().tag!=measure.w('body'):
                owner=owner.getparent()
            owner_text=re.sub(r'\s+',' ',measure.text_of(owner)).strip()
            physical=next((p['index'] for p in spec['frontPages'] if any(r.get('text')==owner_text for r in p.get('records',[]))),None)
            section_type={0:'outerCover',1:'innerCover'}.get(physical)
            target=next((s for s in t['sections'] if s['type']==section_type),None)
            if target is None:
                draft['unknown'].append({'field':'sections.textBox','reason':f'{source["path"]}: metin kutusunun ait olduğu kapak eşlenemedi.'});continue
            children=[]
            for para in box.findall('w:p',ns):
                content=measure.text_of(para).strip()
                if not content:
                    continue
                paragraph,run,_,_=measure.effective_paragraph(para,styles,defaults,default_style)
                record={'text':content,'align':paragraph.get('align','left'),'sizePt':run.get('sizePt'),'font':measure.summarize_font(run),
                        'bold':bool(run.get('bold')),'italic':bool(run.get('italic')),'lineSpacing':paragraph.get('lineSpacing'),
                        'spaceBeforePt':paragraph.get('spaceBeforePt'),'spaceAfterPt':paragraph.get('spaceAfterPt')}
                block=helper.text_block(record,t['typography']['body'].get('fontSizePt',12),target['id'])
                if block:
                    children.append(block)
            if children:
                body_props=anchor.find('.//{http://schemas.microsoft.com/office/word/2010/wordprocessingShape}bodyPr')
                insets={side:int(body_props.get(side+'Ins','0'))/36000 if body_props is not None else 0 for side in ('l','t','r','b')}
                line_y=y+insets['t']
                for child in children:
                    # Positioned leaf boxes are the engine's shared HTML/Word contract.
                    size=child.get('style',{}).get('fontSizePt',t['typography']['body'].get('fontSizePt',12))
                    line=child.get('style',{}).get('lineHeight',1.5)
                    before=child.get('style',{}).get('spaceBeforePt',0)
                    after=child.get('style',{}).get('spaceAfterPt',0)
                    target['blocks'].append({**child,'layoutMode':'absolute','xMm':round(x+insets['l'],3),'yMm':round(line_y,3),
                        'widthMm':round(width-insets['l']-insets['r'],3),'flowHeightMm':0,'wordBaseline':True})
                    line_y+=(size*1.15*line+before+after)*25.4/72
                draft.setdefault('evidence',{})[f"sections.{target['id']}.textBox{index}"]={'status':'MEASURED','source':source['path'],
                    'location':f'word/document.xml //wp:anchor[{index}]','value':{'xMm':x,'yMm':y,'widthMm':width,'heightMm':height}}
        t['source']['notes']=[n for n in t['source'].get('notes',[]) if not n.startswith('Şablon yönergesi')]
    finally:
        package.zip.close()
