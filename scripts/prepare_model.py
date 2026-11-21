"""Split headset.glb (1 mesh) into 17 position-welded parts, bake the transform chain,
normalise size, re-pivot each part to its own centre, downsize textures, export GLB + manifest."""
import struct, json, io, sys, numpy as np
from PIL import Image
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
SRC, DST, MAN = sys.argv[1], sys.argv[2], sys.argv[3]
d = open(SRC, 'rb').read(); off = 12
while off < len(d):
    cl, ct = struct.unpack('<I4s', d[off:off+8])
    if ct == b'JSON': j = json.loads(d[off+8:off+8+cl])
    if ct == b'BIN\x00': b = d[off+8:off+8+cl]
    off += 8 + cl
def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
    n = {'VEC3':3,'VEC2':2,'VEC4':4,'SCALAR':1}[a['type']]; dt = {5126:'<f4',5125:'<u4'}[a['componentType']]
    return np.frombuffer(b, dtype=dt, count=a['count']*n, offset=bv.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,n)
P, N, T, UV, I = acc(0), acc(1), acc(2), acc(3), acc(5).reshape(-1,3)
M = np.eye(4)
for k in (0,1,2,3):
    m = j['nodes'][k].get('matrix')
    if m: M = M @ np.array(m).reshape(4,4).T
R = M[:3,:3]; s = np.linalg.norm(R[:,0]); Rn = R / s
P = P @ R.T + M[:3,3]; N = N @ Rn.T; T = np.concatenate([T[:,:3] @ Rn.T, T[:,3:]], 1)
mn, mx = P.min(0), P.max(0); c = (mn+mx)/2; sc = 3.2/(mx-mn)[1]
P = (P - c) * sc
q = np.round(P*1e4).astype(np.int64); _, inv = np.unique(q, axis=0, return_inverse=True); inv = inv.ravel()
W = inv[I]; r = np.r_[W[:,0],W[:,1]]; cc_ = np.r_[W[:,1],W[:,2]]
n, lab = connected_components(coo_matrix((np.ones(len(r)),(r,cc_)), shape=(inv.max()+1,)*2), directed=False)
tl = lab[W[:,0]]
roles = {3722:'Headband', 2284:'Yoke', 240:'Hinge pin', 3660:'Frame ring', 4040:'Earcup', 3960:'Ear cushion', 920:'Side panel', 1488:'Pivot stub'}
desc = {'Headband':'Main arch. One solid piece in the source model, so padding and band are not separable.',
 'Yoke':'Connects the headband end to the earcup hinge.','Hinge pin':'Small pivot element at the yoke/earcup joint.',
 'Frame ring':'Structural ring behind the earcup shell.','Earcup':'Main housing of the ear cup. Exterior surface only; no interior is modelled.',
 'Ear cushion':'Cushion on the head side of each cup.','Side panel':'Outer-side plate on each cup.',
 'Pivot stub':'Small cylindrical piece on the front or back of a cup. Function not identifiable from geometry alone.'}
off_t = {'Headband':(0,1.5,0),'Yoke':(0.55,0.75,0),'Hinge pin':(1.0,0.5,0),'Frame ring':(0.55,0,0),'Earcup':(0.1,-0.05,0),
         'Ear cushion':(-0.9,0,0),'Side panel':(1.5,0,0),'Pivot stub':(0.35,0,0)}
parts, nodes, meshes, accs, bvs = [], [], [], [], []
binary = bytearray()
def push(arr, target=None):
    while len(binary)%4: binary.append(0)
    bv = {'buffer':0,'byteOffset':len(binary),'byteLength':arr.nbytes}
    if target: bv['target'] = target
    bvs.append(bv); binary.extend(arr.tobytes()); return len(bvs)-1
def add_acc(arr, ctype, typ, bvi, mn_=None, mx_=None):
    a = {'bufferView':bvi,'componentType':ctype,'count':len(arr),'type':typ}
    if mn_ is not None: a['min'], a['max'] = mn_, mx_
    accs.append(a); return len(accs)-1
for k in range(n):
    tri = I[tl==k]; used = np.unique(tri); v = P[used]; ctr = (v.min(0)+v.max(0))/2; nt = len(tri)
    role = roles[nt]; side = '' if role=='Headband' else ('L' if ctr[0] < 0 else 'R'); sx = -1 if ctr[0] < 0 else 1
    ox, oy, oz = off_t[role]
    if role == 'Pivot stub': oz = 0.8 * (1 if ctr[2] > 0 else -1)
    ex = [0 if role=='Headband' else sx*ox, oy, oz]
    remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    pos = (P[used]-ctr).astype('<f4'); nor = N[used].astype('<f4'); tan = T[used].astype('<f4'); uv = UV[used].astype('<f4'); idx = remap[tri].astype('<u4').ravel()
    name = role + (' '+side if side else '') + ((' front' if ctr[2]>0 else ' back') if role=='Pivot stub' else '')
    a = [add_acc(pos,5126,'VEC3',push(pos,34962),pos.min(0).tolist(),pos.max(0).tolist()), add_acc(nor,5126,'VEC3',push(nor,34962)),
         add_acc(tan,5126,'VEC4',push(tan,34962)), add_acc(uv,5126,'VEC2',push(uv,34962)), add_acc(idx,5125,'SCALAR',push(idx,34963))]
    meshes.append({'name':name,'primitives':[{'attributes':{'POSITION':a[0],'NORMAL':a[1],'TANGENT':a[2],'TEXCOORD_0':a[3]},'indices':a[4],'material':0}]})
    nodes.append({'name':name,'mesh':len(meshes)-1,'translation':[float(x) for x in ctr]})
    parts.append({'name':name,'role':role,'side':side,'description':desc[role],'triangles':int(nt),'assembled':[round(float(x),5) for x in ctr],
                  'exploded':[round(float(ctr[i]+ex[i]),5) for i in range(3)]})
imgs = []
for i in j['images']:
    bv = j['bufferViews'][i['bufferView']]; raw = b[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
    im = Image.open(io.BytesIO(raw)).resize((2048,2048), Image.LANCZOS); o = io.BytesIO(); im.save(o,'PNG',optimize=True)
    imgs.append(push(np.frombuffer(o.getvalue(),np.uint8)))
mat = {'name':'headset_mat','doubleSided':True,'normalTexture':{'index':1},'pbrMetallicRoughness':{'baseColorFactor':[0.02,0.02,0.025,1],'metallicFactor':1.0,'roughnessFactor':1.0,'metallicRoughnessTexture':{'index':0}}}
g = {'asset':{'version':'2.0','generator':'prepare_model.py','extras':{'author':'kilianM (https://sketchfab.com/kilianM)','license':'CC-BY-4.0','source':'https://sketchfab.com/3d-models/headset-dc79d4543a634103a12c556998de8b43','title':'Headset'}},
     'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Headset','children':list(range(1,len(nodes)+1))}]+nodes,
     'meshes':meshes,'materials':[mat],'accessors':accs,'bufferViews':bvs,'buffers':[{'byteLength':len(binary)}],
     'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],'textures':[{'sampler':0,'source':0},{'sampler':0,'source':1}],
     'images':[{'bufferView':imgs[0],'mimeType':'image/png'},{'bufferView':imgs[1],'mimeType':'image/png'}]}
js = json.dumps(g, separators=(',',':')).encode(); js += b' '*((4-len(js)%4)%4)
while len(binary)%4: binary.append(0)
out = struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(binary)) + struct.pack('<I4s',len(js),b'JSON') + js + struct.pack('<I4s',len(binary),b'BIN\0') + bytes(binary)
open(DST,'wb').write(out); json.dump({'units':'normalised; model height 3.2','parts':parts}, open(MAN,'w'), indent=1)
print(len(parts),'parts', len(out)//1024,'KB')
for p in parts: print(p['name'], p['triangles'], p['assembled'])
