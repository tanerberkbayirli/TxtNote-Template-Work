import pathlib,sys,json
sys.argv=['make-families.py']
exec(pathlib.Path('orchestration/engine-work/final-closure/special/audit.py').read_text(encoding='utf-8-sig').split('results=[]')[0])
output=pathlib.Path('orchestration/engine-work/final-closure/special/families');output.mkdir(exist_ok=True)
for tid in ['adu-ziraat-lisans-tr-v1','afsu-lee-master-tr-v1','aku-fbe-master-tr-v1','aku-sagbil-master-tr-v1','aku-sbe-master-tr-v1','iyte-lee-master-en-v1','mcbu-tip-uzmanlik-tr-v1']:
    source,doc=fx[tid];doc=variant(doc,'title400')
    doc['content']='<p>Araştırma metni.</p>'
    doc['researchData']['thesis']['sectionContent']={key:'<p>Özel sayfa denetimi.</p>' for key in doc['researchData']['thesis'].get('sectionContent',{})}
    (output/(tid+'.json')).write_text(json.dumps(doc,ensure_ascii=False),encoding='utf8')
print('Seven family long-title fixtures; source metadata unchanged except title400, editable body shortened.')
