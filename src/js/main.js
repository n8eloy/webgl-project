import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  ShaderMaterial,
  Color,
  Vector3,
  Vector4,
  CubicBezierCurve3,
  CubicBezierCurve,
  Vector2,
  BufferGeometry,
  Line,
  LineBasicMaterial
} from '../../assets/js/vendor/three.module.js';

import OBJLoader from '../../assets/js/vendor/OBJLoader.js';
import fragmentShader from './fragmentShader.js';
import vertexShader from './vertexShader.js';

// Not used since we're doing a custom shader
// import * as MTLLoader from '../../assets/js/vendor/MTLLoader.js';

let CONTAINER;
const ROOT = '.';

const USER_INPUT = {
  fanSpeed: 1,
  currCamera: 0,
};

const CAMERA_ARRAY = [];

/* ---- Helpers ---- */

/* Lazy function so we don't have to repeat the same thing several times */
const getContainerSize = () => ({ width: CONTAINER.clientWidth, height: CONTAINER.clientHeight });

/* Converts degrees to radians */
const degToRad = (degrees = 0) => degrees * Math.PI / 180;

/* Updates camera */
const updateCameraRatio = () => {
  const { width, height } = getContainerSize();

  CAMERA_ARRAY[USER_INPUT.currCamera].aspect = width / height;
  CAMERA_ARRAY[USER_INPUT.currCamera].updateProjectionMatrix();
};

/* Resizes canvas, fires when browser window size is altered */
const onWindowResize = (scene, renderer) => {
  const { width, height } = getContainerSize();
  updateCameraRatio();

  console.log(`Canvas Width: ${width}, Heigth: ${height}`);

  // Updates renderer properties
  renderer.setSize(width, height);

  // Renders again
  renderer.render(scene, CAMERA_ARRAY[USER_INPUT.currCamera]);
};

/* Animates a single object, called in every render loop */
const rotateObject = (scene, objectName, { incX = 0, incY = 0, incZ = 0 }) => {
  // Searches for a single object
  const object = scene.getObjectByName(objectName);
  if (!object) {
    return;
  }

  const { x: currX, y: currY, z: currZ } = object.rotation;
  object.rotation.set(currX + incX, currY + incY, currZ + incZ);
};

/* Render and animation loop */
const render = (scene, renderer) => {
  rotateObject(scene, 'Fan', { incZ: degToRad(USER_INPUT.fanSpeed) });
  // rotateObject(scene, 'Table', { incY: degToRad(0.25) });
  // rotateObject(scene, 'CoffeeCup', { incY: degToRad(0.25) });
  renderer.render(scene, CAMERA_ARRAY[USER_INPUT.currCamera]);

  requestAnimationFrame(render.bind(null, scene, renderer));
};

/* ---- Constructors ---- */

/* Initializes file loaders */
const createLoaders = () => {
  const objLoader = new OBJLoader();
  objLoader.setPath(`${ROOT}/assets/obj/`);

  // const txtLoader = new TextureLoader();
  // txtLoader.setPath(`${ROOT}/assets/txt/`);

  // const mtlLoader = new THREE.MTLLoader();
  // mtlLoader.setPath(`${ROOT}/assets/mtl/`);

  return { objLoader };
};

/* Initializes scene */
const createScene = () => {
  const scene = new Scene();
  return scene;
};

/* Initializes camera */
const createCamera = ({
  x = 0, y = 0, z = 0,
  lookX = null, lookY = null, lookZ = null,
}) => {
  const { width, height } = getContainerSize();

  const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(x, y, z);

  if (!(lookX == null || lookY == null || lookZ == null)) {
    camera.lookAt(lookX, lookY, lookZ);
  }

  return camera;
};

/* Initializes renderer */
const createRenderer = () => {
  const { width, height } = getContainerSize();
  console.log(`Canvas Width: ${width}, Heigth: ${height}`);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor('#666');
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // Appends renderer to container div
  CONTAINER.appendChild(renderer.domElement);

  return renderer;
};

/* Loads an object into scene */
const createObject = (objLoader, sceneToAdd, objName, objHexColor,
  {
    posX = 0, posY = 0, posZ = 0,
    scaleX = 1, scaleY = 1, scaleZ = 1,
    rotX = 0, rotY = 0, rotZ = 0,
  }) => {
  const onSuccess = (object) => {
    console.log(`${objName} loaded`);
    const newObject = object;

    const uniforms = {
      color: { type: 'vec3', value: new Color(objHexColor) },
      lightInt: { value: new Vector4(0.7, 0.7, 0.7, 1.0) },
      lightPos: { value: new Vector4(10.0, 10.0, 0.0, 1.0) },
      ambientCoef: { value: new Vector3(0.1, 0.1, 0.1) },
      diffuseCoef: { value: new Vector3(1, 1, 1) },
      specularCoef: { value: new Vector3(0.3, 0.3, 0.3) },
    };

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });

    newObject.name = objName;
    newObject.position.set(posX, posY, posZ);
    newObject.scale.set(scaleX, scaleY, scaleZ);
    newObject.rotation.set(rotX, rotY, rotZ);

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

  objLoader.load(`${objName}.obj`, onSuccess, onProgress, (err) => {
    console.log(err);
  });
};

const addCurve = (sceneToAdd) => {
  const curve = new CubicBezierCurve3(
    new Vector3( -5, 20, 0 ),
    new Vector3( 10, 20, -5 ),
    new Vector3( 10, 10, 10),
    new Vector3( -5, 20, 0 )
  );
  
  const points = curve.getPoints( 50 );
  const geometry = new BufferGeometry().setFromPoints( points );
  
  const material2 = new LineBasicMaterial( { color : 0xff0000 } );
  
  // Create the final object to add to the scene
  const curveObject = new Line( geometry, material2 );

  sceneToAdd.add(curveObject);
};

/* ---- User interaction ---- */

const receiveInput = ({ keyCode }) => {
  switch (keyCode) {
    case 39:
      USER_INPUT.fanSpeed += 1;
      break;
    case 37:
      USER_INPUT.fanSpeed -= 1;
      break;
    case 38:
      if (USER_INPUT.currCamera + 1 >= CAMERA_ARRAY.length) {
        USER_INPUT.currCamera = 0;
      } else {
        USER_INPUT.currCamera += 1;
      }
      updateCameraRatio();
      break;
    case 40:
      if (USER_INPUT.currCamera - 1 < 0) {
        USER_INPUT.currCamera = CAMERA_ARRAY.length - 1;
      } else {
        USER_INPUT.currCamera -= 1;
      }
      updateCameraRatio();
      break;
    default:
      console.log(keyCode);
      break;
  }
};

/* ---- Init ---- */

const init = () => {
  CONTAINER = document.getElementById('container');

  const scene = createScene();
  const { objLoader } = createLoaders();

  // Loads objects into scene
  createObject(objLoader, scene, 'CoffeeCup', 0xC8AD90,
    {
      posY: 13.3,
      scaleX: 0.15,
      scaleY: 0.15,
      scaleZ: 0.15,
      rotY: 20,
    });

  createObject(objLoader, scene, 'Table', 0x654321,
    {
      posY: 7,
      scaleX: 2,
      scaleY: 2,
      scaleZ: 2,
    });

  createObject(objLoader, scene, 'Fan', 0x202020,
    {
      posY: 25,
      rotX: degToRad(-90),
      scaleX: 0.07,
      scaleY: 0.07,
      scaleZ: 0.07,
    });

  CAMERA_ARRAY.push(createCamera({
    x: 0,
    y: 20,
    z: 30,
  }));

  CAMERA_ARRAY.push(createCamera({
    x: 15,
    y: 45,
    lookX: 0,
    lookY: 30,
    lookZ: 0,
  }));
  
  addCurve(scene);

  const renderer = createRenderer();

  // First time render
  render(scene, renderer);

  // Listens for browser window size changes
  window.addEventListener('resize', onWindowResize.bind(null, scene, renderer));
};

export default () => {
  /* Awaits for DOM to load so we don't get window size issues */
  window.addEventListener('load', init);
  /* Awaits for user input */
  window.addEventListener('keydown', receiveInput);
};
