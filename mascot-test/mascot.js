/**
 * でんちゃん 3D Cat — mascot.js
 *
 * Layout principle:
 *   All positions are derived from `sizes` at build time.
 *   Change any size → _layout() recomputes every attachment point → _build().
 *   No part can detach because arms/legs/tail are children of the body mesh.
 *
 * Style ref: Cool Cats NFT — big round head, small blocky body, simple limbs.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class MascotRenderer {
  constructor(canvas, char, items) {
    this.canvas = canvas;
    this.char   = char;
    this.items  = items;
    this.meshes = {};
    this._drag  = { active:false, lx:0, ly:0, ry:0.15, rx:0.04 };
    this._t     = 0;
    this._blink = { timer:2.5, phase:0, lid:0 };
    this._cel   = null;
    this._initScene();
    this._build();
    this._bindDrag();
    this._loop();
  }

  /* ── Scene ──────────────────────────────────────────────────── */
  _initScene() {
    // Use canvas.width/height (actual pixel size) divided by devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const W = this.canvas.width  / dpr;
    const H = this.canvas.height / dpr;
    this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias:true, alpha:true });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(W, H, false); // false = don't override canvas CSS size
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, W/H, 0.1, 100);
    this.camera.position.set(0, 0.5, 7.0);

    this.scene.add(new THREE.AmbientLight(0xfff4f8, 0.85));
    const key = new THREE.DirectionalLight(0xfff8f0, 1.4);
    key.position.set(3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024,1024); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xb8d4ff, 0.5);
    fill.position.set(-4, 1, 3); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffc8e0, 0.4);
    rim.position.set(0, -2, -5); this.scene.add(rim);

    // Shadow blob (repositioned each build)
    this._shadowBlob = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 32),
      new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.07 })
    );
    this._shadowBlob.rotation.x = -Math.PI/2;
    this.scene.add(this._shadowBlob);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.root  = new THREE.Group();
    this.pivot.add(this.root);
  }

  /* ── Materials ──────────────────────────────────────────────── */
  _m(c, r=0.38, met=0)    { return new THREE.MeshStandardMaterial({ color:new THREE.Color(c), roughness:r, metalness:met }); }
  _mB(c, op=1)            { const m=new THREE.MeshBasicMaterial({ color:new THREE.Color(c), side:THREE.DoubleSide }); if(op<1){m.transparent=true;m.opacity=op;} return m; }

  /* ── Layout: compute all attachment points from sizes ───────── */
  _layout() {
    const s = this.char.sizes;
    const headR = s.headR;
    const bodyR = s.bodyR;
    const bodyScY = s.bodyH;                   // body vertical scale
    const bodyActualH = bodyR * bodyScY * 2;

    // Body center Y (root-local) — body sits just below head
    const bodyY = -(headR * 0.85 + bodyR * bodyScY * 0.8);

    // Head center Y (root-local)
    const headY = bodyY + bodyR * bodyScY + headR * 0.82;

    // Arm: attach at body equator sides
    const armR   = s.armR;
    const armX   = bodyR * 1.0 + armR * 0.3;
    const armY   = bodyR * bodyScY * 0.15;     // body-local Y

    // Leg: attach at body bottom
    const legR   = s.legR;
    const legX   = bodyR * 0.5;
    const legY   = -(bodyR * bodyScY * 0.88 + legR * 0.5);  // body-local Y

    // Tail: starts at back-bottom of body
    const tailStart = new THREE.Vector3(-bodyR * 0.75, -bodyR * bodyScY * 0.55, -bodyR * 0.7);

    // Shadow Y
    const shadowY = bodyY - bodyR * bodyScY - legR * 0.9 - 0.05;

    return { headR, bodyR, bodyScY, bodyY, headY, armR, armX, armY, legR, legX, legY, tailStart, shadowY };
  }

  /* ── Build ──────────────────────────────────────────────────── */
  _build() {
    this.root.clear(); this.meshes = {};
    const c   = this.char;
    const col = c.colors;
    const s   = c.sizes;
    const L   = this._layout();

    /* ── Body ──────────────────────────────────── */
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(s.bodyR, 40, 40),
      this._m(col.body, 0.38)
    );
    body.scale.set(1.0, s.bodyH, 0.92);
    body.position.y = L.bodyY;
    body.castShadow = true;
    this.root.add(body);
    this.meshes.body = body;

    // Belly patch (child of body, always attached)
    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(s.bodyR * 0.7, 32, 32),
      this._m(col.belly, 0.5)
    );
    belly.scale.set(0.80, 0.70, 0.52);
    belly.position.set(0, 0.0, s.bodyR * 0.84);
    body.add(belly);

    /* ── Arms (children of body) ───────────────── */
    [[-1],[1]].forEach(([sx]) => {
      const arm = new THREE.Mesh(
        new THREE.SphereGeometry(s.armR, 24, 24),
        this._m(col.body, 0.40)
      );
      arm.scale.set(0.72, 1.10, 0.72);
      arm.position.set(sx * L.armX, L.armY, 0);
      arm.rotation.z = sx * 0.45;
      body.add(arm);       // ← child of body

      // Paw (child of arm)
      const paw = new THREE.Mesh(
        new THREE.SphereGeometry(s.armR * 0.75, 14, 14),
        this._m(col.belly, 0.48)
      );
      paw.scale.set(1.0, 0.58, 0.9);
      paw.position.set(sx * 0.06, -(s.armR * 1.15), s.armR * 0.4);
      arm.add(paw);
    });

    /* ── Legs (children of body) ───────────────── */
    [[-1],[1]].forEach(([sx]) => {
      const leg = new THREE.Mesh(
        new THREE.SphereGeometry(s.legR, 22, 22),
        this._m(col.body, 0.40)
      );
      leg.scale.set(0.90, 0.75, 0.90);
      leg.position.set(sx * L.legX, L.legY, 0);
      body.add(leg);       // ← child of body

      // Toe pad (child of leg)
      const toe = new THREE.Mesh(
        new THREE.SphereGeometry(s.legR * 0.68, 12, 12),
        this._m(col.belly, 0.48)
      );
      toe.scale.set(1.0, 0.55, 0.9);
      toe.position.set(0, -(s.legR * 1.0), s.legR * 0.7);
      leg.add(toe);
    });

    /* ── Tail (child of body) ───────────────────── */
    if (c.parts.tail) {
      this._buildTail(body, L, s, col);
    }

    /* ── Head ──────────────────────────────────── */
    const headG = new THREE.Group();
    headG.position.y = L.headY;
    this.root.add(headG);
    this.meshes.headG = headG;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(s.headR, 48, 48),
      this._m(col.body, 0.36)
    );
    head.scale.set(1.0, 0.97, 0.97);
    head.castShadow = true;
    headG.add(head);
    this.meshes.head = head;

    /* ── Ears ──────────────────────────────────── */
    this._buildEars(headG, s, col);

    /* ── Eyes ──────────────────────────────────── */
    this._buildEyes(headG, s, col);

    /* ── Nose ──────────────────────────────────── */
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(s.headR * 0.09, 14, 14),
      this._m(col.nose, 0.30)
    );
    nose.scale.set(1.2, 0.72, 0.85);
    nose.position.set(0, -s.headR * 0.08, s.headR * 0.93);
    headG.add(nose);

    /* ── Mouth ──────────────────────────────────── */
    const mc = c.parts.mouthCurve ?? 1.0;
    const mPts = [];
    const mR = s.headR;
    for (let i=0; i<=14; i++) {
      const a = (i/14)*Math.PI;
      mPts.push(new THREE.Vector3(
        (Math.cos(a)-0.5) * mR*0.17*2,
        -Math.sin(a)*mR*0.065*mc - mR*0.17,
        mR*0.955
      ));
    }
    headG.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mPts), 14, 0.016, 6, false),
      this._m('#cc5577', 0.5)
    ));

    /* ── Cheeks ─────────────────────────────────── */
    if (c.parts.cheeks) {
      const ckM = this._mB(col.cheek, 0.52);
      [[-1],[1]].forEach(([sx]) => {
        const ck = new THREE.Mesh(new THREE.CircleGeometry(mR*0.165, 16), ckM);
        ck.position.set(sx*mR*0.43, -mR*0.07, mR*0.90);
        headG.add(ck);
      });
    }

    /* ── Whiskers ────────────────────────────────── */
    if (c.parts.whiskers) {
      const wM = new THREE.LineBasicMaterial({ color:new THREE.Color(col.whisker) });
      const wz = mR*0.76, wy = -mR*0.12;
      [
        [-mR*0.96,-mR*0.12,wz, -mR*0.32,wy,wz*1.01],
        [-mR*1.0, -mR*0.21,wz, -mR*0.32,wy-mR*0.08,wz*1.01],
        [ mR*0.96,-mR*0.12,wz,  mR*0.32,wy,wz*1.01],
        [ mR*1.0, -mR*0.21,wz,  mR*0.32,wy-mR*0.08,wz*1.01],
      ].forEach(([x1,y1,z1,x2,y2,z2]) => {
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)
        ]);
        headG.add(new THREE.Line(g, wM));
      });
    }

    /* ── Accessory ───────────────────────────────── */
    this._buildAcc(c.accessory?.item ?? 'none', s.headR);

    /* ── Shadow blob position ────────────────────── */
    this._shadowBlob.position.y = L.shadowY;
  }

  /* ── Tail (child of body) ────────────────────────────────────── */
  _buildTail(body, L, s, col) {
    const curl = s.tailCurl ?? 1.2;
    const len  = s.tailLen  ?? 1.0;
    const pts  = [];
    for (let i=0; i<=22; i++) {
      const t = i/22;
      const a = t * Math.PI * curl * 0.85;
      pts.push(new THREE.Vector3(
        L.tailStart.x + Math.sin(a) * 0.65 * len,
        L.tailStart.y + t * 1.0 * len,
        L.tailStart.z + Math.cos(a) * 0.22 * t
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);

    const tailMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 26, 0.095, 10, false),
      this._m(col.body, 0.40)
    );
    body.add(tailMesh);
    this.meshes.tail = tailMesh;

    // Fluffy tip
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      this._m(col.belly, 0.40)
    );
    const ep = pts[pts.length-1];
    tip.position.copy(ep);
    body.add(tip);
    this.meshes.tailTip = tip;
  }

  /* ── Ears ────────────────────────────────────────────────────── */
  _buildEars(headG, s, col) {
    const earW = s.earW, earH = s.earH, headR = s.headR;
    const makeShape = (w, h) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.quadraticCurveTo(w*0.10, h*0.52, w*0.50, h);
      sh.quadraticCurveTo(w*0.90, h*0.52, w,     0);
      sh.lineTo(0, 0);
      return sh;
    };
    const extO = { depth:0.17, bevelEnabled:true, bevelSize:0.05, bevelThickness:0.05, bevelSegments:4 };
    const extI = { depth:0.05, bevelEnabled:false };
    const oGeo = new THREE.ExtrudeGeometry(makeShape(earW, earH), extO);
    oGeo.center();
    const iGeo = new THREE.ExtrudeGeometry(makeShape(earW*0.52, earH*0.56), extI);
    iGeo.center();

    [[-1],[1]].forEach(([sx]) => {
      const ear = new THREE.Mesh(oGeo, this._m(col.body, 0.40));
      ear.position.set(sx * headR*0.60, headR*0.72, 0);
      ear.rotation.z = sx * (-0.15);
      headG.add(ear);

      const inner = new THREE.Mesh(iGeo, this._m(col.innerEar, 0.50));
      inner.position.set(sx * headR*0.60, headR*0.72, 0.12);
      inner.rotation.z = sx * (-0.15);
      headG.add(inner);
    });
  }

  /* ── Eyes ────────────────────────────────────────────────────── */
  _buildEyes(headG, s, col) {
    this.meshes.eyes = []; this.meshes.lids = []; this.meshes.shine = [];
    const r = s.eyeR, hr = s.headR, shape = this.char.parts.eyeShape ?? 'round';

    [[-hr*0.32, hr*0.16, hr*0.90], [hr*0.32, hr*0.16, hr*0.90]].forEach(([x,y,z]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 22), this._m(col.eye, 0.90));
      if (shape==='almond') eye.scale.set(1.28, 0.80, 1.0);
      eye.position.set(x, y, z);
      headG.add(eye); this.meshes.eyes.push(eye);

      // Shines
      const sh1 = new THREE.Mesh(new THREE.SphereGeometry(r*0.38, 8, 8), this._m('#ffffff', 1.0));
      sh1.position.set(x+r*0.28, y+r*0.34, z+r*0.08); headG.add(sh1); this.meshes.shine.push(sh1);
      const sh2 = new THREE.Mesh(new THREE.SphereGeometry(r*0.16, 6, 6), this._m('#ffffff', 1.0));
      sh2.position.set(x-r*0.22, y-r*0.14, z+r*0.08); headG.add(sh2);

      // Eyelid
      const lid = new THREE.Mesh(
        new THREE.SphereGeometry(r*1.05, 20, 10, 0, Math.PI*2, 0, Math.PI/2),
        this._m(this.char.colors.body, 0.40)
      );
      lid.rotation.x = Math.PI; lid.position.set(x, y, z); lid.scale.y = 0;
      headG.add(lid); this.meshes.lids.push(lid);
    });
  }

  /* ── Accessory ──────────────────────────────────────────────── */
  _buildAcc(id, headR) {
    if (this.meshes.acc) { this.meshes.headG.remove(this.meshes.acc); this.meshes.acc=null; }
    const item = this.items.items.find(i=>i.id===id);
    if (!item || id==='none') return;
    const p=item.params, g=new THREE.Group();
    g.position.y = headR * 1.02;

    if (id==='antenna') {
      const stick=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,p.height,8), this._m(p.color,0.5));
      stick.position.y=p.height/2; g.add(stick);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(p.tipSize,12,12), this._m(p.color,0.15,0.4));
      ball.position.set(0, p.height, 0);
      g.add(ball);

    } else if (id==='bow') {
      [-1,1].forEach(sx=>{
        const w=new THREE.Mesh(new THREE.SphereGeometry(0.18,12,12), this._m(p.color,0.3));
        w.scale.set(1.55,0.88,0.55); w.position.x=sx*0.20; g.add(w);
      });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.065,10,10), this._m(p.knotColor??'#cc2255',0.3)));

    } else if (id==='hat_mini') {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.44,0.04,24), this._m(p.brimColor,0.7)));
      const top=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.28,0.30,24), this._m(p.color,0.7));
      top.position.y=0.17; g.add(top);

    } else if (id==='crown') {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.30,0.17,24), this._m(p.color,0.12,0.7)));
      for(let i=0;i<5;i++){
        const a=(i/5)*Math.PI*2;
        const cone=new THREE.Mesh(new THREE.ConeGeometry(0.048,0.20,8), this._m(p.color,0.12,0.6));
        cone.position.set(Math.cos(a)*0.26,0.185,Math.sin(a)*0.26); g.add(cone);
        if(i%2===0){
          const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.050), this._m(p.gemColor,0.04,0.92));
          gem.position.set(Math.cos(a)*0.20,0.085,Math.sin(a)*0.20); g.add(gem);
        }
      }

    } else if (id==='headphones') {
      const band=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.030,8,24,Math.PI), this._m(p.color,0.4));
      band.rotation.z=Math.PI/2; g.add(band);
      [-0.34,0.34].forEach(x=>{
        const pad=new THREE.Mesh(new THREE.SphereGeometry(0.115,12,12), this._m(p.padColor,0.6));
        pad.position.x=x; pad.scale.z=0.52; g.add(pad);
      });

    } else if (id==='halo') {
      const h=new THREE.Mesh(new THREE.TorusGeometry(0.33,0.040,8,32), this._m(p.color,0.08,0.92));
      h.rotation.x=0.28; g.add(h);

    } else if (id==='star_crown') {
      for(let i=0;i<5;i++){
        const a=(i/5)*Math.PI*2;
        const star=new THREE.Mesh(new THREE.OctahedronGeometry(0.10), this._m(p.color,0.08,0.65));
        star.position.set(Math.cos(a)*0.30,0.08,Math.sin(a)*0.30); g.add(star);
      }
    }

    this.meshes.headG.add(g);
    this.meshes.acc = g;
  }

  /* ── Public setters (all call _build for full relayout) ──────── */
  setSize(key, val)        { this.char.sizes[key]=val;          this._build(); }
  setColor(key, hex)       { this.char.colors[key]=hex;         this._build(); }
  setPart(key, val)        { this.char.parts[key]=val;          this._build(); }
  setAccessory(id)         { this.char.accessory={item:id};     this._buildAcc(id, this.char.sizes.headR); }
  celebrateUpload()        { this._cel={t:0,dur:2.0}; }

  /* ── Drag ────────────────────────────────────────────────────── */
  _bindDrag() {
    const c=this.canvas;
    const S=(x,y)=>{ this._drag.active=true; this._drag.lx=x; this._drag.ly=y; };
    const M=(x,y)=>{
      if(!this._drag.active) return;
      this._drag.ry+=(x-this._drag.lx)*0.013;
      this._drag.rx+=(y-this._drag.ly)*0.009;
      this._drag.rx=Math.max(-1.0,Math.min(1.0,this._drag.rx));
      this._drag.lx=x; this._drag.ly=y;
    };
    const E=()=>{ this._drag.active=false; };
    c.addEventListener('mousedown', e=>S(e.clientX,e.clientY));
    window.addEventListener('mousemove', e=>M(e.clientX,e.clientY));
    window.addEventListener('mouseup', E);
    c.addEventListener('touchstart', e=>{ const t=e.touches[0];S(t.clientX,t.clientY); },{passive:true});
    window.addEventListener('touchmove', e=>{ const t=e.touches[0];M(t.clientX,t.clientY); },{passive:true});
    window.addEventListener('touchend', E);
  }

  /* ── Render loop ─────────────────────────────────────────────── */
  _loop() { this.renderer.setAnimationLoop(()=>this._tick()); }

  _tick() {
    this._t += 0.016;
    const T=this._t;

    // Idle float
    this.root.position.y = Math.sin(T*1.15)*0.07;
    this.root.rotation.z = Math.sin(T*0.62)*0.022;

    // Pivot rotation (drag + idle gentle sway)
    this.pivot.rotation.y = this._drag.ry + (this._drag.active ? 0 : Math.sin(T*0.40)*0.04);
    this.pivot.rotation.x = this._drag.rx;
    if (!this._drag.active) {
      this._drag.ry *= 0.984;
      this._drag.rx *= 0.984;
    }

    // Head look-around
    if (this.meshes.headG) {
      this.meshes.headG.rotation.z = Math.sin(T*0.88)*0.055;
      this.meshes.headG.rotation.x = Math.sin(T*0.72)*0.038;
    }

    // Tail wave
    if (this.meshes.tail) {
      this.meshes.tail.rotation.y = Math.sin(T*1.35)*0.22;
    }
    if (this.meshes.tailTip) {
      this.meshes.tailTip.rotation.y = Math.sin(T*1.35)*0.22;
    }

    // Accessory bobble
    if (this.meshes.acc) {
      this.meshes.acc.rotation.z = Math.sin(T*1.1)*0.055;
    }

    // Blink
    const bk=this._blink;
    bk.timer -= 0.016;
    if (bk.timer<=0 && bk.phase===0) { bk.phase=1; bk.lid=0; bk.timer=3+Math.random()*3; }
    if (bk.phase===1) {
      bk.lid=Math.min(bk.lid+0.30,2);
      this.meshes.lids?.forEach(l=>l.scale.y=bk.lid);
      if(bk.lid>=2) bk.phase=2;
    } else if (bk.phase===2) {
      bk.lid=Math.max(bk.lid-0.34,0);
      this.meshes.lids?.forEach(l=>l.scale.y=bk.lid);
      if(bk.lid<=0) bk.phase=0;
    }

    // Celebrate
    if (this._cel) {
      const p=this._cel.t/this._cel.dur;
      this.root.position.y += Math.abs(Math.sin(p*Math.PI*5))*0.8*(1-p);
      this.root.rotation.z  = Math.sin(p*Math.PI*7)*0.38*(1-p);
      if(this.meshes.acc) this.meshes.acc.rotation.y+=0.22;
      this._cel.t+=0.016;
      if(this._cel.t>=this._cel.dur){ this._cel=null; this.root.rotation.z=0; }
    }

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = this.canvas.width / dpr, H = this.canvas.height / dpr;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H, false);
  }
}
