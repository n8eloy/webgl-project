import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  ShaderMaterial,
  Color,
  Vector3,
  Vector4,
  CubicBezierCurve3,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  CurvePath,
  PointLight,
  AmbientLight,
  AnimationMixer,
  Clock,
} from '../../assets/js/vendor/three.module.js';

import GLTFLoader from '../../assets/js/vendor/GLTFLoader.js';
import OBJLoader from '../../assets/js/vendor/OBJLoader.js';
import fragmentShader from './fragmentShader.js';
import vertexShader from './vertexShader.js';

// Not used since we're doing a custom shader
// import * as MTLLoader from '../../assets/js/vendor/MTLLoader.js';

let CONTAINER;
let CLOCK;
const ROOT = '.';

const USER_INPUT = {
  fanSpeed: 1,
  currCamera: 0,
};

const CAMERA_ARRAY = [];
const GLTF_MIXER_ARRAY = [];
const PATH_ARRAY = [];

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

/* Receives, adds into Bezier's curve path and moves the object */
const moveThroughPath = (scene, objectName, increment) => {
  if (PATH_ARRAY[objectName]) {
    let currPosition = PATH_ARRAY[objectName].Position + increment;
    let nextPosition = PATH_ARRAY[objectName].Position + 0.01;

    if (currPosition > 1) {
      currPosition = 0;
    }
    PATH_ARRAY[objectName].Position = currPosition;

    if (nextPosition > 1) {
      nextPosition = 0;
    }

    const point = PATH_ARRAY[objectName].Curve.getPointAt(currPosition);
    const nextPoint = PATH_ARRAY[objectName].Curve.getPointAt(nextPosition);
    const object = scene.getObjectByName(objectName);

    if (object) {
      object.position.x = point.x;
      object.position.y = point.y;
      object.position.z = point.z;
      object.lookAt(nextPoint);
    }
  }
};

/* Animate mixers */
const gltfAnimate = () => {
  GLTF_MIXER_ARRAY.forEach((mixer) => {
    mixer.update(CLOCK.getElapsedTime());
  });
};

/* Render and animation loop */
const render = (scene, renderer) => {
  rotateObject(scene, 'fan', { incZ: degToRad(USER_INPUT.fanSpeed) });
  moveThroughPath(scene, 'bee', 0.0015);
  gltfAnimate();

  renderer.render(scene, CAMERA_ARRAY[USER_INPUT.currCamera]);
  requestAnimationFrame(render.bind(null, scene, renderer));
};

/* Adds a curve to both scene and animation paths array */
const addCurve = (curvePath, animatedObjectName) => {
  PATH_ARRAY[animatedObjectName] = { Curve: curvePath, Position: 0 };
};

/* ---- Constructors ---- */

/* Initializes file loaders */
const createLoaders = () => {
  const objLoader = new OBJLoader();
  objLoader.setPath(`${ROOT}/assets/obj/`);

  const gltfLoader = new GLTFLoader();
  gltfLoader.setPath(`${ROOT}/assets/gltf/`);

  // const txtLoader = new TextureLoader();
  // txtLoader.setPath(`${ROOT}/assets/txt/`);

  // const mtlLoader = new THREE.MTLLoader();
  // mtlLoader.setPath(`${ROOT}/assets/mtl/`);

  return { objLoader, gltfLoader };
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

/* Loads an GLTF into scene */
const createGLTF = (gltfLoader, sceneToAdd, gltfName,
  {
    posX = 0, posY = 0, posZ = 0,
    scaleX = 1, scaleY = 1, scaleZ = 1,
    rotX = 0, rotY = 0, rotZ = 0,
  }) => {
  const onSuccess = (gltf) => {
    console.log(`${gltfName} loaded`);
    const model = gltf.scene;
    const mixer = new AnimationMixer(model);
    sceneToAdd.add(model);

    model.name = gltfName;
    model.position.set(posX, posY, posZ);
    model.scale.set(scaleX, scaleY, scaleZ);
    model.rotation.set(rotX, rotY, rotZ);

    // test
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });

    GLTF_MIXER_ARRAY.push(mixer);
  };

  const onProgress = (xhr) => {
    console.log(`${xhr.loaded / (xhr.total || 1) * 100}% loaded`);
  };

  gltfLoader.load(`${gltfName}.gltf`, onSuccess, onProgress, (err) => {
    console.log(err);
  });
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
      diffuseCoef: { value: new Vector3(0.8, 0.8, 0.8) },
      specularCoef: { value: new Vector3(0.9, 0.9, 0.9) },
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

/* Creates the Bezier Curve and add it into scene */
const createCurve = (cubicBezierCurve3, sceneToAdd) => {
  const curve = cubicBezierCurve3;

  const curvePath = new CurvePath();
  curvePath.add(curve);

  const points = curve.getPoints(50);
  const geometry = new BufferGeometry().setFromPoints(points);

  const material2 = new LineBasicMaterial({ color: 0xffffff });
  const curveObject = new Line(geometry, material2);
  sceneToAdd.add(curveObject);

  return curvePath;
};

/* Creates a basic defined lighting setup */
const createLight = (sceneToAdd) => {
  const pointLight = new PointLight(0xFFFFFF, 1, 0, 2);
  pointLight.position.set(50, 10, 0);
  const ambientLight = new AmbientLight(0xAAAAAA, 1);

  sceneToAdd.add(pointLight);
  sceneToAdd.add(ambientLight);
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

  // Initializes clock
  CLOCK = new Clock(true);

  const scene = createScene();
  const { objLoader, gltfLoader } = createLoaders();

  // Loads complete GLTF packages into scene
  createGLTF(gltfLoader, scene, 'cat', {
    posY: 8,
    posX: 15,
    rotY: degToRad(1),
    scaleX: 0.01,
    scaleY: 0.01,
    scaleZ: 0.01,
  });

  // Loads objects into scene
  createObject(objLoader, scene, 'coffeeCup', 0xC8AD90,
    {
      posY: 13.3,
      rotY: degToRad(45),
      scaleX: 0.15,
      scaleY: 0.15,
      scaleZ: 0.15,
    });

  createObject(objLoader, scene, 'table', 0x654321,
    {
      posY: 7,
      scaleX: 2,
      scaleY: 2,
      scaleZ: 2,
    });

  createObject(objLoader, scene, 'fan', 0x202020,
    {
      posY: 25,
      rotX: degToRad(-90),
      scaleX: 0.07,
      scaleY: 0.07,
      scaleZ: 0.07,
    });

  createObject(objLoader, scene, 'bee', 0xF7FF00,
    {
      posY: 25,
      rotY: degToRad(90),
      scaleX: 80,
      scaleY: 80,
      scaleZ: 80,
    });

  createObject(objLoader, scene, 'chair', 0x654321,
    {
      posY: 7.5,
      posX: 9,
      posZ: -7,
      rotY: degToRad(-20),
      scaleX: 0.025,
      scaleY: 0.025,
      scaleZ: 0.025,
    });

  createObject(objLoader, scene, 'chair', 0x654321,
    {
      posY: 7.5,
      posX: -8,
      posZ: -6,
      rotY: degToRad(55),
      scaleX: 0.025,
      scaleY: 0.025,
      scaleZ: 0.025,
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

  const renderer = createRenderer();

  // Creates Bee curve
  const beeCurve = createCurve(
    new CubicBezierCurve3(
      new Vector3(-5, 20, 0),
      new Vector3(10, 20, -5),
      new Vector3(10, 10, 10),
      new Vector3(-5, 20, 0)
    ), scene
  );

  // Adds Bezier Curve into scene
  addCurve(beeCurve, 'bee');

  // Adds basic light for non-custom shader objects
  createLight(scene);

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
