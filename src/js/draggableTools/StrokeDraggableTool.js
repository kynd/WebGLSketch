
import * as THREE from 'three';
import { v, line, disposeObject, createBezierCP, createBezierCP2, cpToBezier, stripSidesFromArray, stripFromSides} from "../utils/DrawingUtil.js"
import { loadText } from '../utils/FileUtil.js'
import { CyclePalette, palette01 } from '../utils/ColorUtil.js';
import { FloatDataTexture} from '../utils/FloatDataTexture.js';


export class StrokeDraggableTool {
    static ready = false;
    static async init() {
        StrokeDraggableTool.vertexShaderSource = await loadText('../shaders/common.vert');
        StrokeDraggableTool.fragmentShaderSource = await loadText('../shaders/StrokeDraggableTool.frag');
        this.prevLength = 0;
        StrokeDraggableTool.ready = true;
        StrokeDraggableTool.palette = new CyclePalette(palette01);
    }

    constructor() {
        this.vertices = [];
        this.mode = "CREATE"; // "MOVE", "EDIT", "IDLE"
        this.color = StrokeDraggableTool.palette.get();

        this.sideBufferLength = 2048;
        this.sideTexture = new FloatDataTexture(null, this.sideBufferLength, 2);
    }

    update(data) {
        this.data = data;

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
        if (this.vertices.length == 0) {
            this.vertices.push(v(this.data.pointer.x, this.data.pointer.y, 0));
            this.vertices.push(v(this.data.pointer.x, this.data.pointer.y, 0));
        }

        this.vertices[this.vertices.length - 1].x = this.data.pointer.x;
        this.vertices[this.vertices.length - 1].y = this.data.pointer.y;
        this.updateObjects();
    }

    saveOrigin() {
        if (!this.origin) {
            this.origin = this.data.pointer;
            this.verticeOrigins = this.vertices.map(vector => vector.clone());
        }
    }

    updateViewsMove() {
        this.saveOrigin();
        const tx = this.data.pointer.x - this.origin.x;
        const ty = this.data.pointer.y - this.origin.y;

        this.vertices.forEach((v, i)=>{
            v.x = this.verticeOrigins[i].x + tx;
            v.y = this.verticeOrigins[i].y + ty;
        });
        this.updateObjects();
    }

    updateViewsEdit() {
        this.saveOrigin();
        const tx = this.data.pointer.x - this.origin.x;
        const ty = this.data.pointer.y - this.origin.y;
        const idx = Math.min(this.vertices.length - 1 , this.dragVerticeIndex);
        console.log(idx);
        this.vertices[idx].x = this.verticeOrigins[idx].x + tx;
        this.vertices[idx].y = this.verticeOrigins[idx].y + ty;
        this.updateObjects();
    }

    updateObjects() {
        if (this.vertices.length > 1) {
            const cp = createBezierCP(this.vertices);
            this.bezierPoints = cpToBezier(cp);
        }
        this.updatePreview();
        this.updateMainObject();
    }

    updatePreview() {
        if (!this.previewObj) {
            this.previewObj = new THREE.Object3D();
            this.handles = [];
            this.cornerGeometry = new THREE.CircleGeometry(12, 24);
            this.cornerMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        }

        // HANDLES
        for (let i = this.handles.length; i < this.vertices.length; i ++) {
            const handle = new THREE.Mesh(this.cornerGeometry, this.cornerMaterial);
            handle.toolRef = this;
            this.handles.push(handle);
            this.previewObj.add(handle);
        }
        for (let i = 0; i < this.handles.length; i ++) {
            if (i < this.vertices.length) {
                this.handles[i].position.copy(this.vertices[i]);
            } else {
                disposeObject(this.handles[i]);
                this.handles.pop();
            }
        }

        // CENTER LINE
        if (this.lineObj) {
            disposeObject(this.lineObj);
        }

        this.lineObj = line(this.bezierPoints, 0x000000);
        this.previewObj.add(this.lineObj);
    }

    updateMainObject() {
        if (!this.mainObj) {
            const stripMaterial = new THREE.ShaderMaterial({
                vertexShader: StrokeDraggableTool.vertexShaderSource,
                fragmentShader: StrokeDraggableTool.fragmentShaderSource,
                uniforms: {
                    res: { value: new THREE.Vector2(this.data.context.width, this.data.context.height)},
                }
            })
            this.mainObj = new THREE.Mesh(new THREE.BufferGeometry(), stripMaterial);this.mainObj.toolRef = this;
        }
        this.sides = stripSidesFromArray(this.bezierPoints, 300);

        if (this.vertices.length > 1 && this.vertices[0].distanceTo(this.vertices[this.vertices.length - 1]) > 4) {
            this.mainObj.geometry.dispose();
            this.mainObj.geometry = stripFromSides(this.sides)

        }

        const uniforms = this.mainObj.material.uniforms;
        const nSideLength = Math.min(this.sides[0].length, this.sides[1].length);

        if (this.mode == "CREATE") {
            for (let i = 0; i < nSideLength; i ++) {
                this.sideTexture.setPixel(i, 0, [
                    this.sides[0][i].x, this.sides[0][i].y, 0, 1
                ]);
                this.sideTexture.setPixel(i, 1, [
                    this.sides[1][i].x, this.sides[1][i].y, 0, 1
                ]);
            }
            this.sideTexture.update();
        }
        

        if (nSideLength > this.sideBufferLength) {
            console.log(`WARNING: The strip has too many vertices (${nSideLength}). Keep it under ${this.sideBufferLength}` );
        }

        uniforms.nSidePoints = {value: nSideLength};
        uniforms.maxSidePoints = {value: this.sideBufferLength};
        uniforms.tex = {value: this.data.tex};
        uniforms.colorSource = {value: this.data.colorSource};
        uniforms.sides = {value: this.sideTexture.texture};
    }
    
    pointerDown() {
        if (this.mode == "CREATE") {
            const pointer = v(this.data.pointer.x, this.data.pointer.y, 0);
            if (this.vertices[this.vertices.length - 2].distanceTo(pointer) > 4) {
                this.vertices.push(v(this.data.pointer.x, this.data.pointer.y, 0));
                return false;
            } else {
                this.vertices.pop();
            }
        }
        return true;
    }

    pointerUp() {
        if (this.mode == "CREATE") {
            return false;
        } else {
            return true;
        }
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
        if (this.sideTexture ) { this.sideTexture.dispose(); }
        if (this.previewObj) { disposeObject(this.previewObj); }
        if (this.mainObj) { disposeObject(this.mainObj); }
    }
}


