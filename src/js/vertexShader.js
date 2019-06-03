const shader = () => `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.45 );
  }
`;

export default shader();
