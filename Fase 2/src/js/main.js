import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MeshPhongMaterial,
  ShaderMaterial,
  PointLight,
  TextureLoader,
  Vector2,
} from '../../assets/js/vendor/three.module.js';

import OBJLoader from '../../assets/js/vendor/OBJLoader.js';
import fragmentShader from './fragmentShader.js';
import vertexShader from './vertexShader.js';

// Not used since we're doing a custom shader
// import * as MTLLoader from '../../assets/js/vendor/MTLLoader.js';

let container;
const root = '.';

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
  const object1 = scene.getObjectByName('CoffeeCup');
  if (!object1) {
    return;
  }

  const object2 = scene.getObjectByName('Table');
  if (!object2) {
    return;
  }

  // Random sin function for cool moves
  // object1.rotation.y += 0.01;
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
  const objLoader = new OBJLoader();
  objLoader.setPath(`${root}/assets/obj/`);

  // const txtLoader = new TextureLoader();
  // txtLoader.setPath(`${root}/assets/txt/`);

  // const mtlLoader = new THREE.MTLLoader();
  // mtlLoader.setPath(`${root}/assets/mtl/`);

  return { objLoader };
};

/* Initializes scene */
const createScene = () => {
  const scene = new Scene();
  return scene;
};

/* Initializes camera */
const createCamera = () => {
  const { width, height } = getContainerSize();

  const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.y = 20;
  camera.position.z = 20;

  return camera;
};

/* Initializes renderer */
const createRenderer = () => {
  const { width, height } = getContainerSize();

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor('#272120');
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // Appends renderer to container div
  container.appendChild(renderer.domElement);

  return renderer;
};

/* Loads an object into scene */
const createObject1 = (objLoader, sceneToAdd, objName) => {
  const onSuccess = (object1) => {
    console.log(`${objName} loaded`);
    const newObject = object1;

    const uniforms = {};

    console.log(vertexShader);
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });

    newObject.name = objName;
    newObject.position.z = -10;
    newObject.position.y = 10;
    newObject.scale.set(1, 1, 1);

    newObject.traverse((node) => {
      if (node.isMesh) {
        node.material = material;
      }
    });

    sceneToAdd.add(newObject);
  };

  const onProgress = (xhr) => {
    console.log(`${xhr.loaded / (xhr.total || 1) * 100}% loaded`);
  };

  objLoader.load(`${objName}.obj`, onSuccess, onProgress,
    (err) => {
      console.log(err);
    });
};

const createObject2 = (objLoader, sceneToAdd, objName) => {
  const onSuccess = (object2) => {
    console.log(`${objName} loaded`);
    const newObject = object2;

    const uniforms = {};

    console.log(vertexShader);
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });

    newObject.name = objName;
    newObject.position.z = 0;
    newObject.position.y = 10;
    newObject.scale.set(1, 1, 1);

    newObject.traverse((node) => {
      if (node.isMesh) {
        node.material = material;
      }
    });

    sceneToAdd.add(newObject);
  };

  const onProgress = (xhr) => {
    console.log(`${xhr.loaded / (xhr.total || 1) * 100}% loaded`);
  };

  objLoader.load(`${objName}.obj`, onSuccess, onProgress,
    (err) => {
      console.log(err);
    });
};

/* Adds lighting to scene */
const createLighting = (scene) => {
  const light = new PointLight(0xFFFF55, 100, -10);
  scene.add(light);
};

/* ---- Init ---- */

const init = () => {
  container = document.getElementById('container');

  const scene = createScene();
  const { objLoader } = createLoaders();
  createObject1(objLoader, scene, 'CoffeeCup');
  createObject2(objLoader, scene, 'Table');

  // Not necessary for first phase
  // createLighting(scene);

  const camera = createCamera();
  const renderer = createRenderer();

  // First time render
  render(scene, camera, renderer);

  // Listens for browser window size changes
  window.addEventListener('resize', onWindowResize.bind(null, scene, camera, renderer));
};

export default () => {
  /* Awaiting for DOM to load so we don't get window size issues */
  window.addEventListener('load', init);
};
