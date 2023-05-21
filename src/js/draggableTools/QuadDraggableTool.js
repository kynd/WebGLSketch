
import * as THREE from 'three';
import { v, line, disposeObject, quadFromCorners} from "../utils/DrawingUtil.js"
import { loadText } from '../utils/FileUtil.js'
import { CyclePalette, palette01 } from '../utils/ColorUtil.js';

export class QuadDraggableTool {

    static ready = false;
    
    static async init() {
        QuadDraggableTool.vertexShaderSource = await loadText('../shaders/common.vert');
        QuadDraggableTool.fragmentShaderSource = await loadText('../shaders/QuadDraggableTool.frag');
        QuadDraggableTool.ready = true;
        QuadDraggableTool.palette = new CyclePalette(palette01);
    }

    constructor() {
        this.vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
        this.mode = "CREATE"; // "MOVE", "EDIT", "IDLE"
        this.color = QuadDraggableTool.palette.get();
    }

    update(data) {
        this.data = data;
        if (!this.origin) {
            this.origin = data.pointer;
            this.verticeOrigins = this.vertices.map(vector => vector.clone());
        }
        this.updateViews();
    }

    updateViews() {
        switch (this.mode) {
            case "CREATE": 
            this.updateViewsCreate();
            break;
            case "EDIT": 
            this.updateViewsEdit();
            break;
            case "MOVE": 
            this.updateViewsMove();
            break;
        }
    }

    updateViewsCreate() {
        // -- BOUNDS --
        if (!this.previewObj) {
            const arr = Array(this.vertices.length + 1).fill(v(0,0,0));
            this.previewObj = new THREE.Object3D();
            this.outline = line(arr, 0x000000);
            this.previewObj.add(this.outline);
            this.handles = [];
            const cornerGeometry = new THREE.CircleGeometry(12, 24);
            const cornerMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        
            this.vertices.forEach((v)=>{
                const handle = new THREE.Mesh(cornerGeometry, cornerMaterial);
                handle.toolRef = this;
                this.handles.push(handle);
                this.previewObj.add(handle);
            })
        }

        // -- MAIN --
        if (this.mainObj) {
            this.mainObj.geometry.dispose();
        } else {

            const mainMaterial = new THREE.ShaderMaterial({
                depthTest: false,
                transparent: true,
                side: THREE.DoubleSide,
                vertexShader: QuadDraggableTool.vertexShaderSource,
                fragmentShader: QuadDraggableTool.fragmentShaderSource,
                uniforms: {
                    res: { value: new THREE.Vector2(this.data.context.width, this.data.context.height)},
                }
            });
            this.mainObj = new THREE.Mesh(new THREE.BufferGeometry(), mainMaterial);
            this.mainObj.toolRef = this;
        }

        // -- VERTICES --

        const l = Math.min(this.origin.x, this.data.pointer.x);
        const r = Math.max(this.origin.x, this.data.pointer.x);
        const t = Math.min(this.origin.y, this.data.pointer.y);
        const b = Math.max(this.origin.y, this.data.pointer.y);
        this.vertices[0].x = l; this.vertices[0].y = t; 
        this.vertices[1].x = r; this.vertices[1].y = t; 
        this.vertices[2].x = r; this.vertices[2].y = b; 
        this.vertices[3].x = l; this.vertices[3].y = b; 
        this.pA = new THREE.Vector3(l, t, 0.0);
        this.pB = new THREE.Vector3(r, b, 0.0);
        // ----------
        this.updateObjects();
    }

    updateViewsMove() {
        const tx = this.data.pointer.x - this.origin.x;
        const ty = this.data.pointer.y - this.origin.y;

        this.vertices.forEach((v, i)=>{
            v.x = this.verticeOrigins[i].x + tx;
            v.y = this.verticeOrigins[i].y + ty;
        });
        this.updateObjects();
    }

    updateViewsEdit() {
        const tx = this.data.pointer.x - this.origin.x;
        const ty = this.data.pointer.y - this.origin.y;
        const idx = this.dragVerticeIndex;
        this.vertices[idx].x = this.verticeOrigins[idx].x + tx;
        this.vertices[idx].y = this.verticeOrigins[idx].y + ty;
        this.updateObjects();
    }

    updateObjects() {
        // -- BOUNDS --
        const positions = this.outline.geometry.attributes.position;
        for (let i = 0; i <= 4; i ++) {
            const idx = i % 4;
            const p = this.vertices[idx];
            positions.setXYZ( i, p.x, p.y, p.z );
            this.handles[idx].position.copy(p);
        }
        positions.needsUpdate = true;

        // -- MAIN --
        const mainGeometry = quadFromCorners(this.vertices);
        this.mainObj.geometry = mainGeometry;

        const uniforms = this.mainObj.material.uniforms;
        uniforms.tex = {value: this.data.tex};
        uniforms.colorSource = {value: this.data.colorSource};
        uniforms.pA = {value: this.pA.toArray() };
        uniforms.pB = {value: this.pB.toArray() };
    
    }

    pointerDown() {
        return true;
    }

    pointerUp() {
        return true;
    }

    startDrag(object) {
        if (object == this.mainObj) {
            this.mode = "MOVE";
        } else {
            this.handles.forEach((handle, i) => {
                if (object == handle) {
                    this.mode = "EDIT";
                    this.dragVerticeIndex = i;
                }
            })
        }
    }

    endDrag() {
        this.mode = "IDLE";
        this.origin = null;
    }

    dispose() {
        if (this.previewObj) {disposeObject(this.previewObj);}
        if (this.mainObj) {disposeObject(this.mainObj);}
    }
}