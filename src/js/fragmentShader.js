const shader = () => `
  uniform vec3 color;
  varying vec3 pos;
  varying vec3 vecNormal;

  uniform vec3 ambientCoef;
  uniform vec3 diffuseCoef;
  uniform vec3 specularCoef;

  uniform vec3 lightInt;
  uniform vec4 lightPos;
  uniform float Shininess;

  void main() {
    vec3 n = normalize(vecNormal);
    vec3 l = normalize(vec3(lightPos) - pos);
    vec3 v = normalize(vec3(-pos));
    vec3 r = reflect(-l, n);

    vec3 ambient = color * ambientCoef;
    vec3 diffuse = color * diffuseCoef * max(dot(l, n), 0.0);
    vec3 specular = color * specularCoef * pow(max(dot(r, v), 0.0), 10.0);

    vec4 finalColor = vec4(lightInt * (ambient + diffuse + specular), 1.0);

    gl_FragColor = finalColor;
  }
`;

export default shader();
