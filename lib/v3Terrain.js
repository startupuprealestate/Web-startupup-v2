/** 
 * ทิวเขา clay สำหรับ hero ของหน้า /v3 — สร้างด้วย three.js ล้วน ไม่พึ่งไฟล์โมเดล
 *
 * โหลดแบบ dynamic import เฉพาะบนเดสก์ท็อป (ดู pages/v3.js)
 * มือถือใช้ภูเขา SVG แทน จะได้ไม่ต้องแบก WebGL
 *
 * วิธีจัดฉาก: ใช้ "สันเขา" หลายชั้นที่ extrude จากเส้นซิลูเอตแบบ noise แล้ววาง
 * ไล่ระยะลึกเข้าไป ไม่ได้ใช้ระนาบผืนเดียวมองจากมุมสูง เพราะแบบนั้นคุมเส้นขอบฟ้า
 * ไม่ได้ ผลที่ได้คือทิวเขากินพื้นที่ครึ่งล่างของเฟรม ส่วนบนโปร่งใส ตัวหนังสือที่
 * อยู่ z-index ต่ำกว่า canvas จึงโผล่เหนือเขาแต่ถูกยอดเขาบังส่วนล่าง
 */

const RIDGES = [
  // z ยิ่งลบยิ่งไกล / peak คือช่วงความสูงของยอด / สีไล่จากใกล้เข้ม ไปไกลสว่าง
  { z: -48, peak: [1.0, 8.2], color: 0x5c8468, rough: 1.0, seed: 11 },
  { z: -36, peak: [-0.6, 6.2], color: 0x406c4c, rough: 1.0, seed: 27 },
  { z: -24, peak: [-2.2, 4.2], color: 0x2a583d, rough: 1.0, seed: 43 },
  { z: -12, peak: [-4.0, 2.0], color: 0x184228, rough: 1.0, seed: 61 },
  { z: 0, peak: [-6.4, -0.6], color: 0x081f11, rough: 1.0, seed: 89 },
]

/* ---------- value noise (พอสำหรับเส้นสันเขา ไม่ต้องลง simplex) ---------- */

function makeNoise1(seed) {
  let s = seed >>> 0 || 1
  const rnd = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  const N = 256
  const table = new Float32Array(N)
  for (let i = 0; i < N; i++) table[i] = rnd()
  const fade = (t) => t * t * (3 - 2 * t)
  const at = (i) => table[((i % N) + N) % N]

  const noise = (x) => {
    const i = Math.floor(x)
    const f = x - i
    return at(i) + (at(i + 1) - at(i)) * fade(f)
  }

  /**
   * ridged multifractal — พับค่าที่จุดกึ่งกลางแล้วยกกำลัง ทำให้ได้ยอดแหลมและ
   * หุบเขากว้าง เหมือนเขาค้อ/ภูทับเบิก ต่างจาก fbm ธรรมดาที่ออกมาเป็นเนินมน
   */
  return (x, octaves = 5) => {
    let sum = 0, amp = 0.5, freq = 1, norm = 0
    for (let o = 0; o < octaves; o++) {
      const r = 1 - Math.abs(noise(x * freq) * 2 - 1)
      sum += Math.pow(r, 2.4) * amp
      norm += amp
      amp *= 0.48
      freq *= 2.35
    }
    return sum / norm
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onReady?: () => void }} opts
 */
export async function initTerrain(canvas, opts = {}) {
  const THREE = await import('three')

  const parent = canvas.parentElement
  let w = parent.clientWidth || 1
  let h = parent.clientHeight || 1

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  // หมอกสีเดียวกับพื้นหลัง ทำให้สันไกล ๆ จางลงเองโดยไม่ต้องไล่สีมือ
  scene.fog = new THREE.Fog(0x0b3d1b, 55, 135)

  const CAM_Z = 30
  const FOV = 40
  const camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 300)
  camera.position.set(0, 0, CAM_Z)
  camera.lookAt(0, 0, 0)

  const group = new THREE.Group()
  scene.add(group)

  const disposables = []

  RIDGES.forEach(({ z, peak, color, rough, seed }) => {
    // ความกว้างที่ต้องใช้ให้เต็มเฟรมที่ระยะนั้น (เผื่อไว้ 1.5 เท่า สำหรับ parallax)
    const dist = CAM_Z - z
    const halfH = Math.tan((FOV * Math.PI) / 360) * dist
    const halfW = halfH * Math.max(w / h, 1.2) * 1.5

    const noise = makeNoise1(seed)
    const STEPS = 160
    const shape = new THREE.Shape()
    const BOTTOM = -40 // ต่ำกว่าเฟรมมาก จะได้ไม่เห็นขอบล่าง

    shape.moveTo(-halfW, BOTTOM)
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS
      const x = -halfW + t * halfW * 2
      const n = noise(t * 5.5 + seed * 0.13, 4)
      const y = peak[0] + (peak[1] - peak[0]) * n
      shape.lineTo(x, y)
    }
    shape.lineTo(halfW, BOTTOM)
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 6,
      bevelEnabled: true,
      bevelThickness: 0.7,
      bevelSize: 0.5,
      bevelSegments: 2,
      curveSegments: 1,
    })
    geo.translate(0, 0, z - 3)

    const mat = new THREE.MeshStandardMaterial({
      color, roughness: rough, metalness: 0, flatShading: false,
    })

    const mesh = new THREE.Mesh(geo, mat)
    group.add(mesh)
    disposables.push(geo, mat)
  })

  /* ---------- แสงสตูดิโอนุ่ม ---------- */

  scene.add(new THREE.HemisphereLight(0xf5f2eb, 0x061a0e, 0.7))

  // key ส่องจากหลังซ้ายบน ทำให้ขอบ bevel ของยอดเขาติดทอง
  const key = new THREE.DirectionalLight(0xffd9a0, 2.6)
  key.position.set(-18, 22, 12)
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xbcd8c4, 0.55)
  fill.position.set(16, 4, 20)
  scene.add(fill)

  scene.add(new THREE.AmbientLight(0x214a31, 0.7))

  /* ---------- ลูป ---------- */

  const pointer = { x: 0, y: 0 }
  const eased = { x: 0, y: 0 }
  let raf = 0
  let running = true
  let first = true
  const t0 = performance.now()

  const render = () => {
    if (!running) return
    raf = requestAnimationFrame(render)

    eased.x += (pointer.x - eased.x) * 0.05
    eased.y += (pointer.y - eased.y) * 0.05
    const drift = (performance.now() - t0) * 0.00008

    // ขยับกล้องเล็กน้อย ชั้นใกล้จะเลื่อนมากกว่าชั้นไกลเองตามหลัก perspective
    camera.position.x = eased.x * 3.2 + Math.sin(drift) * 0.6
    camera.position.y = -eased.y * 1.4
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)

    if (first) { first = false; opts.onReady?.() }
  }
  render()

  /* ---------- resize / visibility ---------- */

  const onResize = () => {
    w = parent.clientWidth
    h = parent.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(parent)

  const onVis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf) }
    else if (!running) { running = true; render() }
  }
  document.addEventListener('visibilitychange', onVis)

  return {
    setPointer(x, y) { pointer.x = x; pointer.y = y },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      disposables.forEach((d) => d.dispose?.())
      renderer.dispose()
    },
  }
}
