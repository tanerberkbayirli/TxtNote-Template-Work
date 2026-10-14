import fitz,sys
d=fitz.open(sys.argv[1])
for pi in range(3):
  if "approve" in d[pi].get_text():
    for b in d[pi].get_text("dict")["blocks"]:
      for l in b.get("lines",[]):
        x,y=l["bbox"][0]/72*25.4,l["bbox"][1]/72*25.4
        if x>100 or y>170: print(round(x,1),round(y,1),"".join(s["text"] for s in l["spans"])[:30])
