# -*- coding: utf-8 -*-
import json, os
CAT = r"C:\Users\Julic\OneDrive\Escritorio\Toscornici\configurador-3d\assets\catalogo\telaio-standard.json"
OUT = r"C:\Users\Julic\AppData\Local\Temp\claude\C--Users-Julic-skyline-simulator--claude-worktrees-intelligent-cray-f310d6\324023c7-d99c-4475-ae88-bd5e19a26e57\scratchpad"
d = json.load(open(CAT, encoding="utf-8"))

# TODO en el marco del CATALOGO, que es donde vive telaio_alto_imbotto y donde
# hay que trazar. El motor lo reubica solo con `desplaza` segun la puerta.
ys = [p[0] for c in d["telaio_alto_imbotto"] for p in c]
PROPIO = max(ys)                 # 2126.5 -> aqui acaba el vano de la puerta
BAJO   = min(ys)                 # 2091.5 -> por donde baja el forro
ANTA_Y = PROPIO - 4.0            # canto alto de la hoja (holgura alta = 4)
MZ0, MZ1 = d["muro"]["z0"], d["muro"]["z1"]

CAPAS = [("RIF_CAPOTELAIO",8),("RIF_MURO",5),("RIF_ANTA",3),("RIF_QUOTE",1),
         ("TRAVERSO_DA_TRACCIARE",2),("_NOTA",7)]
ent=[]
def poli(capa,pts,cerrado=True):
    o=["0","POLYLINE","8",capa,"66","1","70","1" if cerrado else "0","10","0.0","20","0.0","30","0.0"]
    for x,y in pts: o+=["0","VERTEX","8",capa,"10","%.4f"%x,"20","%.4f"%y,"30","0.0"]
    ent.extend(o+["0","SEQEND","8",capa])
def linea(capa,x0,y0,x1,y1):
    ent.extend(["0","LINE","8",capa,"10","%.4f"%x0,"20","%.4f"%y0,"30","0.0",
                "11","%.4f"%x1,"21","%.4f"%y1,"31","0.0"])
def texto(capa,x,y,h,s):
    ent.extend(["0","TEXT","8",capa,"10","%.4f"%x,"20","%.4f"%y,"30","0.0",
                "40","%.2f"%h,"1",s])

for c in d["telaio_alto_imbotto"]:
    poli("RIF_CAPOTELAIO", [(p[1], p[0]) for p in c])

linea("RIF_MURO", MZ0, BAJO-200, MZ0, PROPIO+300)
linea("RIF_MURO", MZ1, BAJO-200, MZ1, PROPIO+300)
texto("_NOTA", MZ0-4, BAJO-215, 11, "muro z0=%.0f" % MZ0)
texto("_NOTA", MZ1-4, BAJO-215, 11, "muro z1=%.0f" % MZ1)

poli("RIF_ANTA", [(-22.5, ANTA_Y-180), (22.5, ANTA_Y-180), (22.5, ANTA_Y), (-22.5, ANTA_Y)])
texto("_NOTA", 30, ANTA_Y-100, 11, "ANTA 45 mm - canto alto y=%.1f" % ANTA_Y)

linea("RIF_QUOTE", MZ0-90, PROPIO, MZ1+90, PROPIO)
texto("_NOTA", MZ1+95, PROPIO-5, 11, "y=%.1f  ALTO DEL VANO DE LA PUERTA" % PROPIO)
linea("RIF_QUOTE", MZ0-90, BAJO, MZ1+90, BAJO)
texto("_NOTA", MZ1+95, BAJO-5, 11, "y=%.1f  hasta aqui baja el forro actual" % BAJO)

poli("TRAVERSO_DA_TRACCIARE", [(MZ0,PROPIO),(MZ1,PROPIO),(MZ1,PROPIO+95),(MZ0,PROPIO+95)])
texto("_NOTA", MZ0, PROPIO+108, 13, "TRAZAR AQUI EL TRAVERSO -- la caja es orientativa, no un limite")
texto("_NOTA", MZ0, PROPIO+128, 11, "Debe cubrir hacia abajo la cabeza de la puerta y hacia arriba")
texto("_NOTA", MZ0, PROPIO+145, 11, "hacer de peana del sopraluce. Puede solaparse con el perfil marron.")

texto("_NOTA", MZ0, PROPIO+250, 15, "TOSCOCORNICI - traverso del sopraluce")
texto("_NOTA", MZ0, PROPIO+228, 11, "Milimetros. X = PROFUNDIDAD (z del motor)   Y = ALTURA")
texto("_NOTA", MZ0, PROPIO+210, 11, "Mismo marco que telaio_alto_imbotto: no mover ni reescalar nada.")
texto("_NOTA", MZ0, PROPIO+192, 11, "Una sola polilinea CERRADA en la capa TRAVERSO_DA_TRACCIARE.")
texto("_NOTA", MZ0, PROPIO+174, 11, "Las capas RIF_* y _NOTA se ignoran al importar.")

o=["0","SECTION","2","HEADER","9","$ACADVER","1","AC1009","9","$INSUNITS","70","4","0","ENDSEC",
   "0","SECTION","2","TABLES","0","TABLE","2","LAYER","70",str(len(CAPAS))]
for n,col in CAPAS: o+=["0","LAYER","2",n,"70","0","62",str(col),"6","CONTINUOUS"]
o+=["0","ENDTAB","0","ENDSEC","0","SECTION","2","ENTITIES"]+ent+["0","ENDSEC","0","EOF"]
f=os.path.join(OUT,"traverso-sopraluce.dxf")
open(f,"w",encoding="ascii",errors="replace").write("\n".join(o)+"\n")
print("propio=%.1f  bajo=%.1f  anta=%.1f  muro=%.0f..%.0f" % (PROPIO,BAJO,ANTA_Y,MZ0,MZ1))
print(f, os.path.getsize(f), "bytes")
