let container;

/* ---- Helpers ---- */

const getContainerSize = () => {
  console.log(`Width: ${container.clientWidth}, Heigth: ${container.clientHeight}`);
  return { width: container.clientWidth, height: container.clientHeight };
};

const onWindowResize = (scene, camera, renderer) => {
  const { width, height } = getContainerSize();

  // Updates camera and renderer properties
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  // Renders again
  renderer.render(scene, camera);
};

const animateObject = (scene) => {
  const object = scene.getObjectByName('object1');
  // Temporary animation, may be changed in future project phases
  object.rotation.x += 0.01;
  object.rotation.y += 0.10;
};

const firstRender = (scene, camera, renderer) => {
  // Renders and animates
  animateObject(scene);

  renderer.render(scene, camera);

  requestAnimationFrame(firstRender.bind(null, scene, camera, renderer));
};

/* ---- Constructors ---- */

const createObject = () => {
  // Creates an object for display (temporary)
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: '#433F81' });
  const cube = new THREE.Mesh(geometry, material);
  cube.name = "object1";

  return cube;
};

const createScene = (objectArray = []) => {
  // Initializes scene
  const scene = new THREE.Scene();

  // Add objects to scene
  objectArray.forEach((object) => {
    scene.add(object);
  });

  return scene;
};

const createCamera = () => {
  const { width, height } = getContainerSize();

  // Initializes camera
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 1;

  return camera;
};

const createRenderer = () => {
  const { width, height } = getContainerSize();

  // Initializes renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColor('#000000');
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // Appends renderer to container div
  container.appendChild(renderer.domElement);

  return renderer;
};

/* ---- Init ---- */

const init = () => {
  container = document.getElementById('canvasContainer');
  const object = createObject();

  const scene = createScene([object]);
  const camera = createCamera();
  const renderer = createRenderer();

  // Renders and animates
  firstRender(scene, camera, renderer);

  // Listens for browser window size changes
  window.addEventListener('resize', onWindowResize.bind(null, scene, camera, renderer));
};

document.addEventListener('DOMContentLoaded', () => {
  init();
});
