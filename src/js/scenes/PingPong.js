import * as THREE from 'three';
import { SceneBase } from './SceneBase';

export class PingPong extends SceneBase {
    constructor(context, fragPath) {
        super(context);
        this.scene = new THREE.Scene();
        this.fragPath = fragPath;
        this.setup();

        this.renderTargets = [];
        this.renderTargets.push(new THREE.WebGLRenderTarget(this.context.width, this.context.height, { format: THREE.RGBAFormat}));
        this.renderTargets.push(new THREE.WebGLRenderTarget(this.context.width, this.context.height, { format: THREE.RGBAFormat}));
        this.pingpongIndex = 0;
    }

    getCurrentRenderTarget() {
        return this.renderTargets[this.pingpongIndex];
    }
    
    async setupMain() {
        const vertexShaderSource = await this.loadShader('../shaders/common.vert');
        const fragmentShaderSource = await this.loadShader(this.fragPath);

        const planeMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                res: { value: new THREE.Vector2(this.context.width, this.context.height)},
                tex: { value: this.renderTargets[0].texture }
            }
        });

        const planeGeometry = new THREE.PlaneGeometry(this.context.width, this.context.height, 4, 4);
        this.planeObject = new THREE.Mesh(planeGeometry, planeMaterial);
        this.scene.add( this.planeObject );
    }


    render(scene) {
        this.context.renderer.autoClear = false;
        this.context.renderer.setRenderTarget(this.getCurrentRenderTarget());
        this.context.renderer.render( scene, this.context.camera);
        this.context.renderer.setRenderTarget(null);
        this.context.renderer.autoClear = true;
    }

    update() {
        if (!this.ready) { return; }
        const iA = this.pingpongIndex;
        const iB = (this.pingpongIndex + 1) % 2;
        this.planeObject.material.uniforms.tex.value = this.renderTargets[iA].texture;
        //this.planeObject.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        this.context.renderer.setRenderTarget(this.renderTargets[iB]);
        this.context.renderer.autoClear = false;
        this.context.renderer.render( this.scene, this.context.camera);
        this.context.renderer.autoClear = true;
        this.context.renderer.setRenderTarget(null);

        this.pingpongIndex = iB;
    }
}
