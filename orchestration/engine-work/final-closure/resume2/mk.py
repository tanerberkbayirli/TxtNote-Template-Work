import zipfile,sys,re,shutil
src,dst,mode=sys.argv[1],sys.argv[2],sys.argv[3]
zin=zipfile.ZipFile(src);zout=zipfile.ZipFile(dst,'w',zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data=zin.read(it.filename)
    if it.filename=='word/footnotes.xml':
        s=data.decode('utf8')
        if mode.startswith('sep'):
            h=mode[3:]
            new=lambda tag:'<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="%s" w:lineRule="exact"/></w:pPr><w:r><w:%s/></w:r></w:p>'%(int(float(h)*20),tag)
            s=re.sub(r'(<w:footnote w:type="separator" w:id="-1">).*?(</w:footnote>)',lambda m:m.group(1)+new('separator')+m.group(2),s,count=1,flags=re.S)
            s=re.sub(r'(<w:footnote w:type="continuationSeparator" w:id="0">).*?(</w:footnote>)',lambda m:m.group(1)+new('continuationSeparator')+m.group(2),s,count=1,flags=re.S)
        data=s.encode('utf8')
    if it.filename=='word/settings.xml':
        data=data.decode('utf8').replace('<w:compat>','<w:footnotePr><w:footnote w:id="-1"/><w:footnote w:id="0"/></w:footnotePr><w:compat>').encode('utf8')
    zout.writestr(it,data)
zout.close()
