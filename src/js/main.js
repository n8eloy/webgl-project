let container;
let root = '.';

/* ---- Helpers ---- */

/* Lazy function so we don't have to repeat the same thing several times */
const getContainerSize = () => {
  console.log(`Canvas Width: ${container.clientWidth}, Heigth: ${container.clientHeight}`);
  return { width: container.clientWidth, height: container.clientHeight };
};

/* Resizes canvas, fires when browser window size is altered */
const onWindowResize = (scene, camera, renderer) => {
  const { width, height } = getContainerSize();

  // Updates camera and renderer properties
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  // Renders again
  renderer.render(scene, camera);
};

/* Animates a single object, called in every render loop */
const animateObject = (scene) => {
  // Temporary animation, may be changed in future project phases

  // Searches for a single object
  const object = scene.getObjectByName('Cat');
  if (!object) {
    return;
  }

  // Random sin function for cool moves
  object.rotation.z = Math.sin(object.rotation.y / 2) / 2;
  object.rotation.y += 0.02;
};

/* Renders and call animation */
const render = (scene, camera, renderer) => {
  animateObject(scene);
  renderer.render(scene, camera);

  requestAnimationFrame(render.bind(null, scene, camera, renderer));
};

/* ---- Constructors ---- */

/* Initializes file loaders */
const createLoaders = () => {
  const objLoader = new THREE.OBJLoader();
  objLoader.setPath(`${root}/assets/obj/`);

  const txtLoader = new THREE.TextureLoader();
  txtLoader.setPath(`${root}/assets/txt/`);

  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath(`${root}/assets/mtl/`);

  return { objLoader, txtLoader, mtlLoader };
};

/* Initializes scene */
const createScene = () => {
  const scene = new THREE.Scene();
  return scene;
};

/* Initializes camera */
const createCamera = () => {
  const { width, height } = getContainerSize();

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.y = 20;
  camera.position.z = 20;

  return camera;
};

/* Initializes renderer */
const createRenderer = () => {
  const { width, height } = getContainerSize();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor('#272120');
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // Appends renderer to container div
  container.appendChild(renderer.domElement);

  return renderer;
};

/* Loads an object into scene */
const createObject = (objLoader, txtLoader, mtlLoader, sceneToAdd, objName) => {
  const onSuccess = (object) => {
    console.log(`${objName} loaded`);

    const texture = txtLoader.load(`${objName}.jpeg`);
    const material = new THREE.MeshPhongMaterial({ map: texture });

    object.name = objName;
    object.position.z = -70;
    object.position.y = 0;
    object.scale.set(0.1, 0.1, 0.1);

    object.traverse((node) => {
      if (node.isMesh) {
        node.material = material;
      }
    });

    sceneToAdd.add(object);
  };

  const onProgress = (xhr) => {
    console.log(`${xhr.loaded / (xhr.total || 1) * 100}% loaded`);
  };

  objLoader.load(`${objName}.obj`, onSuccess, onProgress,
    (err) => {
      console.log(err);
    });

  /* Currently not working (or is it?)
  mtlLoader.load(`${objName}.mtl`, (materials) => {
    materials.preload();
    objLoader.setMaterials(materials);
    objLoader.load(`${objName}.obj`, onSuccess, onProgress,
      (err) => {
        console.log(err);
      });
  }, onProgress, () => {
    console.log(`Couldn't load ${objName} material, loading object only`);
    objLoader.load(`${objName}.obj`, onSuccess, onProgress,
      (err) => {
        console.log(err);
      });
  // });
  */
};

/* Adds lighting to scene */
const createLighting = (scene) => {
  const light = new THREE.PointLight(0xFFFF55, 100, -10);
  scene.add(light);
};

/* ---- Init ---- */

const init = () => {
  container = document.getElementById('canvasContainer');

  const scene = createScene();
  const { objLoader, txtLoader, mtlLoader } = createLoaders();
  createObject(objLoader, txtLoader, mtlLoader, scene, 'Cat');

  // Not necessary for first phase
  createLighting(scene);

  const camera = createCamera();
  const renderer = createRenderer();

  // First time render
  render(scene, camera, renderer);

  // Listens for browser window size changes
  window.addEventListener('resize', onWindowResize.bind(null, scene, camera, renderer));
};

/* Awaiting for DOM to load so we don't get window size issues */
window.addEventListener('load', () => {
  init();
});
