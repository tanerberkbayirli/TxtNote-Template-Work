import zipfile,re,sys,shutil
from lxml import etree
SRC='Butun-Sablonlar/Ege/Yaşar Üniversitesi/Lisansustu_Egitim_Enstitusu_Tez/Yasar_Lisansustu_Tez_Sablonu_TR_2024-11-19.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{%s}'%ns['w']
def build(out,mutate=None,idx0=546,idxs=(547,548)):
    zin=zipfile.ZipFile(SRC)
    root=etree.fromstring(zin.read('word/document.xml'))
    body=root.find('w:body',ns)
    kids=list(body)
    sect=kids[-1]
    keep=[kids[i] for i in (idx0,)+tuple(idxs)]
    for k in kids: body.remove(k)
    for k in keep: body.append(k)
    # section: keep final sectPr of the last section (first section props) but drop headers/footers refs
    sp=etree.fromstring(etree.tostring(sect))
    for r in list(sp):
        if etree.QName(r).localname in('headerReference','footerReference'): sp.remove(r)
    body.append(sp)
    if mutate: mutate(root)
    zout=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
    for it in zin.infolist():
        data=zin.read(it.filename)
        if it.filename=='word/document.xml': data=etree.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
        zout.writestr(it,data)
    zout.close()
if __name__=='__main__':
    build('orchestration/engine-work/final-closure/long/s09-work/nest/a-asis.docx')
    def small(root):
        tbl=root.find('.//w:tbl',ns)
        ps=tbl.findall('w:tr/w:tc/w:p',ns)
        last=ps[-1]
        for sz in last.iter(W+'sz'): sz.set(W+'val','2')
        for sz in last.iter(W+'szCs'): sz.set(W+'val','2')
    build('orchestration/engine-work/final-closure/long/s09-work/nest/b-tiny.docx',small)
def noh(root):
    tbl=root.find('.//w:tbl',ns)
    for h in tbl.iter(W+'trHeight'): h.getparent().remove(h)
build('orchestration/engine-work/final-closure/long/s09-work/nest/c-noheight.docx',noh)
def noh_tiny(root):
    noh(root);small(root)
build('orchestration/engine-work/final-closure/long/s09-work/nest/d-noheight-tiny.docx',noh_tiny)
def texty(root):
    noh(root)
    tbl=root.find('.//w:tbl',ns)
    last=tbl.findall('w:tr/w:tc/w:p',ns)[-1]
    r=etree.SubElement(last,W+'r'); t=etree.SubElement(r,W+'t'); t.text='X'
build('orchestration/engine-work/final-closure/long/s09-work/nest/e-text.docx',texty)
def twoempty(root):
    noh(root)
    tbl=root.find('.//w:tbl',ns)
    cell=tbl.find('w:tr/w:tc',ns)
    last=cell.findall('w:p',ns)[-1]
    import copy
    cell.append(copy.deepcopy(last))
build('orchestration/engine-work/final-closure/long/s09-work/nest/f-twoempty.docx',twoempty)
