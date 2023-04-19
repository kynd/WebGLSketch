import * as THREE from 'three';
import { SceneBase } from './SceneBase';

export class SimpleImageScene extends SceneBase {
    constructor(context, imagePath) {
        super(context);
        this.scene = new THREE.Scene();
        this.imagePath = imagePath;
        this.texture = textureLoader.load(this.imagePath);
        this.setup();
    }

    async setupMain() {
        const vertexShaderSource = await this.loadShader('../shaders/common.vert');
        const fragmentShaderSource = await this.loadShader('../shaders/simple_image.vert');

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                res: { value: new THREE.Vector2(this.context.width, this.context.height)},
                tex: this.texture
            }
        });

        const planeGeometry = new THREE.PlaneGeometry(this.context.width, this.context.height, 4, 4);
        this.planeObject = new THREE.Mesh(planeGeometry, this.material);
        this.scene.add( this.planeObject );
    }

    update() {
    }
}
