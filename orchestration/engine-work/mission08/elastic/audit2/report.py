import json,collections
A='C:/Users/CASPER/Desktop/TxtNote-Template-Work/engine/mission08/elastic/audit2'
R=json.load(open(A+'/results.json',encoding='utf8'))
base={r['target']:r for r in R if r['variant']=='base' and r['status']=='ok'}
rows=[];stat=collections.defaultdict(lambda:[0,0,0]);bad=[]
for r in R:
    if r['status']!='ok':
        rows.append(f"| {r['target']} | {r['variant']} | - | - | - | {r['status']}: {r.get('note','')[:80]} |"); 
        if r['status']=='n/a': stat[r['variant']][2]+=1
        continue
    b=base.get(r['target']); extra=r['n']-b['n'] if b else '?'
    broken=(extra not in (0,'?')) or r['n_ov']>(b['n_ov'] if b else 0) or r['n_oom']>(b['n_oom'] if b else 0) or r['clipped']>(b['clipped'] if b else 0)
    if r['variant']=='base': broken=False
    stat[r['variant']][1 if broken else 0]+=1
    notes=[]
    if r['n_ov']: notes.append('ov:'+'; '.join(f"{s}:{a}|{c}" for s,a,c in r['overlaps'][:2]))
    if r['n_oom']: notes.append('oom:'+'; '.join(f"{s}:{t}@{y0}-{y1}mm" for s,t,y0,y1 in r['oom'][:2]))
    if r['clipped']: notes.append(f"clipped={r['clipped']}")
    rows.append(f"| {r['target']} | {r['variant']} | {extra} | {r['n_ov']} | {r['n_oom']} | {'BROKEN ' if broken else ''}{' '.join(notes)} |")
    if broken: bad.append((abs(extra) if extra!='?' else 0, r['n_ov']-(b['n_ov'] if b else 0), r['n_oom']-(b['n_oom'] if b else 0), r['target'],r['variant'],notes))
bad.sort(key=lambda x:(-x[0],-x[1],-x[2]))
with open(A+'/RESULTS.md','w',encoding='utf8') as f:
    f.write('# Mission 08 audit: variable cover/special pages\n\nExtra pages = special-section PDF pages minus baseline. Overlap = text line boxes intersecting (PyMuPDF). out-of-margin = text within 12 mm of page edge (also counted in baseline; broken = more than baseline).\n\n')
    f.write('## Counts per variant (OK / broken / n.a.)\n\n'+'\n'.join(f'- {v}: {s[0]} OK, {s[1]} broken, {s[2]} n/a' for v,s in stat.items())+'\n\n')
    f.write('## Worst offenders\n\n'+'\n'.join(f"{i+1}. {t} / {v}: extra={e}, +overlaps={o}, +oom={m} {n}" for i,(e,o,m,t,v,n) in enumerate(bad[:25]))+'\n\n')
    f.write('## All results\n\n| target | variant | extra pages | overlaps | out-of-margin | notes |\n|---|---|---|---|---|---|\n'+'\n'.join(rows)+'\n')
print(dict(stat)); print(*bad[:12],sep='\n')
