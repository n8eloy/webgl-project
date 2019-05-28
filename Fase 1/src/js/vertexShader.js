const shader = () => `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.65 );
  }
`;

export default shader();
