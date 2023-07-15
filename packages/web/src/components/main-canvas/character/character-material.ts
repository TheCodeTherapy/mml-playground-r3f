import { Color, CubeTexture, MeshPhysicalMaterial, UniformsUtils } from "three";

import { bayerDither, injectBefore, injectBeforeMain, injectInsideMain } from "../../../helpers/shader-helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TUniform<TValue = any> = { value: TValue };

export class CharacterMaterial extends MeshPhysicalMaterial {
  public uniforms: Record<string, TUniform> = {};
  public envTexture: CubeTexture | null = null;
  public colorsCube216: Color[] = [];

  constructor() {
    super();
    this.color = new Color(0xffffff);
    this.opacity = 1.0;
    this.metalness = 0.99;
    this.roughness = 0.1;
    this.specularColor = new Color(0x0077ff);
    this.specularIntensity = 0.1;
    this.envMapIntensity = 1.8;
    this.transmission = 0.9;
    this.ior = 1.5;
    this.thickness = 0.1;
    this.sheenColor = new Color(0x000000);
    this.sheen = 0.25;

    this.onBeforeCompile = (shader) => {
      this.uniforms = UniformsUtils.clone(shader.uniforms);
      this.uniforms.nearClip = { value: 0.01 };
      this.uniforms.farClip = { value: 1000.0 };
      this.uniforms.ditheringNear = { value: 0.25 };
      this.uniforms.ditheringRange = { value: 0.55 };
      this.uniforms.time = { value: 0.0 };
      this.uniforms.diffuseRandomColor = { value: new Color() };
      shader.uniforms = this.uniforms;

      shader.vertexShader = injectBeforeMain(shader.vertexShader, "varying vec2 vUv;");
      shader.vertexShader = injectInsideMain(shader.vertexShader, "vUv = uv;");

      shader.fragmentShader = injectBeforeMain(
        shader.fragmentShader,
        /* glsl */ `
          varying vec2 vUv;
          uniform float nearClip;
          uniform float farClip;
          uniform float ditheringNear;
          uniform float ditheringRange;
          uniform float time;
          uniform vec3 diffuseRandomColor;
          ${bayerDither}
        `
      );

      shader.fragmentShader = injectBefore(
        shader.fragmentShader,
        "#include <opaque_fragment>",
        /* glsl */ `
          float distance = length(vWorldPosition - cameraPosition);
          float normalizedDistance = (distance - nearClip) / (farClip - nearClip);
          ivec2 p = ivec2(mod(gl_FragCoord.xy, 8.0));
          float d = 0.0;
          if (p.x <= 3 && p.y <= 3) {
            d = bayerDither(bayertl, p);
          } else if (p.x > 3 && p.y <= 3) {
            d = bayerDither(bayertr, p - ivec2(4, 0));
          } else if (p.x <= 3 && p.y > 3) {
            d = bayerDither(bayerbl, p - ivec2(0, 4));
          } else if (p.x > 3 && p.y > 3) {
            d = bayerDither(bayerbr, p - ivec2(4, 4));
          }
          if (distance <= ditheringNear + d * ditheringRange) discard;
          float s = clamp(0.35 + 0.35 * sin(5.0 * -time + vUv.y * 800.0), 0.0, 1.0);
          float scanLines = pow(s, 1.33);
          outgoingLight *= diffuseRandomColor;
          outgoingLight += smoothstep(0.1, 0.0, scanLines) * 0.05;
        `
      );
    };

    this.generateColorCube();
  }

  generateColorCube() {
    const saturation = 0.75;
    const lightness = 0.65;
    const goldenRatioConjugate = 0.618033988749895;
    let hue = 0;

    for (let i = 0; i < 216; i++) {
      const color = new Color();
      color.setHSL(hue, saturation, lightness);
      this.colorsCube216.push(color);
      hue = (hue + goldenRatioConjugate) % 1;
    }
  }

  setEnvTexture(cubeTexture: CubeTexture): void {
    this.envTexture = cubeTexture;
    this.transmissionMap = this.envTexture;
  }
}
