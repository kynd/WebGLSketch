
import * as THREE from 'three';
import {line, disposeObject, distance2D, stripSidesFromArray, stripFromSides} from "../utils/DrawingUtil.js"
import { Tween } from '../utils/Tween.js';
import { loadText } from '../utils/FileUtil.js'

export class DragTapeTool {
    static async init() {
        DragTapeTool.vertexShaderSource = await loadText('../shaders/common.vert');
        DragTapeTool.fragmentShaderSource = await loadText('../shaders/DragTapeTool.frag');
        DragTapeTool.ready = true;
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
        this.count = 0;
        this.maxCount = 90;
        this.isDone = false;
        this.color = DragTapeTool.colors[DragTapeTool.colorIdx ++ % DragTapeTool.colors.length];
        this.center = null;
        this.points = [];
    }

    updatePreview(data) {
        this.data = data;
        if (this.points.length == 0) {
            this.points.push(data.pointer);
        }
        const lastPoint = this.points[this.points.length - 1];
        if (distance2D(lastPoint, data.pointer) > 5) {
            this.points.push(data.pointer);
        }
        this.sides = stripSidesFromArray(this.smoothenPoints(this.points), 100);
        this.updatePreviewObj();
        this.updatePrintObj();
    }

    updateAuto() {
        if (!this.data) {
            this.isDone = true; return;
        }
        //this.rotation = this.tween.powerInOut(this.count / maxCount) * Math.PI / 2;
        this.count ++;
        if (this.count > this.maxCount) {
            this.isDone = true;
        }

        this.updatePrintObj();
    }

    updatePreviewObj() {
        if (!this.previewObj) {
            this.previewObj = new THREE.Object3D();
        } else {
            disposeObject(this.line0);
            disposeObject(this.line1);
        }
        this.line0 = line(this.sides[0], 0x000000);
        this.line1 = line(this.sides[1], 0x000000);
        this.previewObj.add(this.line0);
        this.previewObj.add(this.line1);
    }

    updatePrintObj() {
        if (!this.printObj) {
            const stripMaterial = new THREE.ShaderMaterial({
                vertexShader: DragTapeTool.vertexShaderSource,
                fragmentShader: DragTapeTool.fragmentShaderSource,
                uniforms: {
                    res: { value: new THREE.Vector2(this.data.context.width, this.data.context.height)},
                }
            })
            this.printObj = new THREE.Mesh(new THREE.BufferGeometry(), stripMaterial);
        }

        this.printObj.geometry.dispose();
        this.printObj.geometry = stripFromSides(this.sides)

        const uniforms = this.printObj.material.uniforms;
        uniforms.tex = {value: this.data.tex.texture};
        uniforms.cA = {value: new THREE.Color(this.color).toArray() };
        uniforms.t = {value: this.tween.powerInOut(this.count / (this.maxCount - 1))};
    }

    smoothenPoints(arr) {
        const newArr = [];
        for (let i = 0; i < arr.length; i ++) {
            if (i == 0 || i == arr.length - 1) {
                newArr.push({x: arr[i].x, y: arr[i].y});
            } else {
                newArr.push({x: (arr[i - 1].x + arr[i + 1].x) * 0.5, 
                    y: (arr[i - 1].y + arr[i + 1].y) * 0.5});
            }
        }
        return newArr;
    }


    endPreview() {
        if (this.previewObj) {disposeObject(this.previewObj);}
    }

    dispose() {
        if (this.previewObj) {disposeObject(this.previewObj);}
        if (this.printObj) {disposeObject(this.printObj);}
    }
}