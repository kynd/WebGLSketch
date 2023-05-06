
import * as THREE from 'three';
import { v, line, disposeObject, distance2D} from "../utils/DrawingUtil.js"
import { Tween } from '../utils/Tween.js';
import { loadText } from '../utils/FileUtil.js'

export class CircleSpinnerTool {
    static async init() {
        CircleSpinnerTool.vertexShaderSource = await loadText('../shaders/common.vert');
        CircleSpinnerTool.fragmentShaderSource = await loadText('../shaders/CircleSpinnerTool.frag');
        CircleSpinnerTool.ready = true;
    }

    static ready = false;
    static colors = [
        0xDA0000,
        0x340000,
        0xD7FF00,
        0x88DEFF
    ]

    static colorIdx = 0;
    constructor() {
        this.tween = new Tween();
        this.rotation = 0;
        this.count = 0;
        this.isDone = false;
        this.color = CircleSpinnerTool.colors[CircleSpinnerTool.colorIdx ++ % CircleSpinnerTool.colors.length];
        this.center = null;
        this.radius = 0;
        this.res = 64;
    }

    updatePreview(data) {
        this.data = data;
        if (!this.center) {
            this.center = data.pointer;
        }
        this.radius = distance2D(this.center, data.pointer);
        this.updatePreviewObj();
        this.updatePrintObj();
    }

    updateAuto() {
        if (!this.data) {
            this.isDone = true; return;
        }
        const maxCount = 90;
        this.rotation = this.tween.powerInOut(this.count / maxCount) * Math.PI / 2;
        this.count ++;
        if (this.count > maxCount) {
            this.isDone = true;
        }

        this.updatePrintObj();
    }

    updatePreviewObj() {
        if (!this.previewObj) {
            const arr = [];
            for (let i = 0; i <= this.res; i ++) {
                arr.push(v(0,0,0));
            }
            this.previewObj = line(arr, 0x000000);
        }

        const positions = this.previewObj.geometry.attributes.position;
        for (let i = 0; i <= this.res; i ++) {
            const a = i / this.res * Math.PI * 2;
            const x = this.center.x + Math.cos(a) * this.radius;
            const y = this.center.y + Math.sin(a) * this.radius;
            positions.setXYZ( i, x, y, 0 );
        }
        positions.needsUpdate = true;
    }

    updatePrintObj() {
        // Print
        if (!this.printObj) {
            const circleGeometry = new THREE.CircleGeometry(this.radius, this.res);
            const circleMaterial = new THREE.ShaderMaterial({
                vertexShader: CircleSpinnerTool.vertexShaderSource,
                fragmentShader: CircleSpinnerTool.fragmentShaderSource,
                uniforms: {
                    res: { value: new THREE.Vector2(this.data.context.width, this.data.context.height)},
                }
            });
            this.printObj = new THREE.Mesh(circleGeometry, circleMaterial);
        } else {
            this.printObj.geometry.dispose();
            this.printObj.geometry = new THREE.CircleGeometry(this.radius, this.res);
        }

        const uniforms = this.printObj.material.uniforms;
        uniforms.tex = {value: this.data.tex.texture};
        uniforms.center = {value: [this.center.x, this.center.y]};
        uniforms.cA = {value: new THREE.Color(this.color).toArray() };
        uniforms.rotation = {value: this.rotation};
        this.printObj.position.x = this.center.x;
        this.printObj.position.y = this.center.y;
    }

    endPreview() {
        if (this.previewObj) {disposeObject(this.previewObj);}
    }

    dispose() {
        if (this.previewObj) {disposeObject(this.previewObj);}
        if (this.printObj) {disposeObject(this.printObj);}
    }
}