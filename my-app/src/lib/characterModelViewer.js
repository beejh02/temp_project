import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createCharacterModelViewer(host, buffer, onContextLost) {
  let renderer;
  let geometry;
  let material;
  let controls;
  let observer;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    controls?.dispose();
    geometry?.dispose();
    material?.dispose();
    if (renderer) {
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("keydown", keyDown);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
  function contextLost(event) {
    event.preventDefault();
    onContextLost();
  }
  let rotate;
  let zoom;
  let reset;
  function keyDown(event) {
    const actions = { ArrowLeft: () => rotate(-1), ArrowRight: () => rotate(1), "+": () => zoom(1 / 1.2), "=": () => zoom(1 / 1.2), "-": () => zoom(1.2), Home: () => reset() };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  }

  try {
    geometry = new STLLoader().parse(buffer);
    // This STL is Z-up and faces -Y. Convert to Three.js Y-up, facing +Z.
    geometry.rotateX(-Math.PI / 2);
    geometry.center();
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere.radius;
    if (!Number.isFinite(radius) || radius <= 0) throw new Error("모델 파일을 읽지 못했어요. 다시 시도해 주세요.");
    geometry.scale(1 / radius, 1 / radius, 1 / radius);
    geometry.computeVertexNormals();

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      throw new Error("이 브라우저에서는 3D 화면을 표시할 수 없어요. 다른 브라우저에서 열어 주세요.");
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "누리고 캐릭터 키링 3D 모델. 좌우 방향키로 회전, 더하기와 빼기로 확대·축소, Home 키로 처음 위치.");
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("keydown", keyDown);
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
    material = new THREE.MeshStandardMaterial({ color: 0xf2be52, roughness: 0.48, metalness: 0.05 });
    scene.add(new THREE.Mesh(geometry, material));
    scene.add(new THREE.HemisphereLight(0xfffbef, 0x789986, 2.3));
    const key = new THREE.DirectionalLight(0xfff2d6, 3.2);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.8);
    fill.position.set(4, 1, -3);
    scene.add(fill);

    controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 0.8;
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = Math.PI - 0.12;
    const render = () => { if (!disposed) renderer.render(scene, camera); };
    controls.addEventListener("change", render);
    // Draw only on interaction or resize; an idle preview uses no animation loop.
    reset = () => {
      controls.target.set(0, 0, 0);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const distance = 1.12 / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
      controls.maxDistance = Math.max(10, distance * 2);
      camera.position.set(0, 0.13, 1).normalize().multiplyScalar(distance);
      controls.update();
      render();
    };
    rotate = (direction) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 8);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    zoom = (factor) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    const resize = () => {
      if (disposed) return;
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      reset();
    };
    observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return { dispose, rotate, zoom, reset };
  } catch (error) {
    dispose();
    throw error;
  }
}
