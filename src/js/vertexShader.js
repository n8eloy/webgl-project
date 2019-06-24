const shader = () => `
  varying vec3 pos;
  varying vec3 vecNormal;

  void main() {
    pos = vec3(modelViewMatrix * vec4( position, 0.45 ));
    vecNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.45 );
  }
`;

export default shader();
