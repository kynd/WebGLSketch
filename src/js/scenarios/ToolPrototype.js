import * as THREE from 'three';
import { ScenarioBase } from "./ScenarioBase.js";
import { v, line, disposeObject, distance2D } from "../utils/DrawingUtil.js"
import { PingPong } from '../scenes/PingPong.js';
import { loadText } from '../utils/FileUtil.js'

export class ToolPrototype extends ScenarioBase {
    constructor() {
        super();
        this.setupContext(1920, 1920);
        this.setup();
        this.asyncStart();
        this.autoActors = [];
    }

    async asyncStart() {
        await Circle.init();
        this.start();
    }

    setup() {
        this.scene = new THREE.Scene();
        this.printScene = new THREE.Scene();
        //this.context.renderer.setClearColor(0xFFFFFFFF);
        this.pingPong = new PingPong(this.context, '../shaders/simple_image.frag');
        this.isDragging = false;
    }

    pointerMove(evt) {
        if (this.isDragging) {
            this.updateCircle(evt);
        }
    }

    pointerDown(evt) {
        this.isDragging = true;
        this.dragStartPointerCrd = this.getPointerCrd(evt);

        this.currentTool = new Circle();
        this.updateCircle(evt);
        this.scene.add(this.currentTool.outlineObj);
        this.scene.add(this.currentTool.fillObj);
    }

    updateCircle(evt) {
        const crd = this.getPointerCrd(evt);
        const radius = distance2D(this.dragStartPointerCrd, crd);
        const center = this.pointerCrdToSceneCrd(this.dragStartPointerCrd);
        const pointer = this.pointerCrdToSceneCrd(crd);
        this.currentTool.updatePreview({
            x: center.x,
            y: center.y,
            px: pointer.x,
            py: pointer.y,
            radius,
            tex: this.pingPong.getCopyRenderTarget(),
            context: this.context
        }, this.context);
    }

    pointerUp(evt) {
        this.isDragging = false;
        if (this.currentTool) {
            //this.currentTool.isDone = true;
            this.autoActors.push(this.currentTool);
            this.currentTool = null;
        }
    }

    update() {
        for (let i = this.autoActors.length -1; i >=0; i --) {
            const actor = this.autoActors[i];
            if (actor.isDone) {
                this.printScene.add(actor.fillObj);
                this.pingPong.renderOnCurrentRenderTarget(this.printScene);
                actor.dispose();
                this.autoActors.splice(i, 1);
                this.pingPong.update();
            } else {
                actor.updateAuto();
            }
        };

        this.context.renderer.autoClear = false;
        this.context.renderer.render( this.pingPong.scene, this.context.camera);
        this.context.renderer.render( this.scene, this.context.camera);
        this.context.renderer.autoClear = true;

        
    }
}

class Circle {
    static async init() {
        Circle.vertexShaderSource = await loadText('../shaders/common.vert');
        Circle.fragmentShaderSource = await loadText('../shaders/circle_tool_proto.frag');
    }

    static colors = [
        0xDAEEBA,
        0x340053,
        0xD7FF00,
        0x88DEFF
    ]

    static colorIdx = 0;
    constructor() {
        this.rotation = 0;
        this.count = 0;
        this.isDone = false;
        this.color = Circle.colors[Circle.colorIdx ++  % Circle.colors.length];
    }

    updatePreview(data) {
        this.rotation += Math.PI / 60;
        this.data = data;
        this.updateMain();
    }

    updateAuto() {
        if (!this.data) {
            this.isDone = true; return;
        }
        //this.rotation += Math.PI / 60;
        this.count ++;
        if (this.count > 90) {
            this.isDone = true;
        }

        this.updateMain();
    }

    updateMain() {
        this.x = this.data.x;
        this.y = this.data.y;
        this.radius = this.data.radius;
        this.res = this.data.res ? this.data.res : 64;

        if (!this.outlineObj) {
            const arr = [];
            for (let i = 0; i <= this.res; i ++) {
                arr.push(v(0,0,0));
            }
            this.outlineObj = line(arr, 0x000000);
        }

        const positions = this.outlineObj.geometry.attributes.position;
        for (let i = 0; i <= this.res; i ++) {
            const a = i / this.res * Math.PI * 2;
            const x = this.x + Math.cos(a) * this.radius;
            const y = this.y + Math.sin(a) * this.radius;
            positions.setXYZ( i, x, y, 0 );
        }
        positions.needsUpdate = true;

        if (!this.fillObj) {
            const circleGeometry = new THREE.CircleGeometry(this.radius, this.res);
            const circleMaterial = new THREE.ShaderMaterial({
                vertexShader: Circle.vertexShaderSource,
                fragmentShader: Circle.fragmentShaderSource,
                uniforms: {
                    res: { value: new THREE.Vector2(this.data.context.width, this.data.context.height)},
                }
            });
            this.fillObj = new THREE.Mesh(circleGeometry, circleMaterial);
        } else {
            this.fillObj.geometry.dispose();
            this.fillObj.geometry = new THREE.CircleGeometry(this.radius, this.res);
        }
        this.fillObj.material.uniforms.tex = {value: this.data.tex.texture};
        this.fillObj.material.uniforms.center = {value: [this.x, this.y]};
        this.fillObj.material.uniforms.rotation = {value: this.rotation};
        this.fillObj.material.uniforms.cA = {value: new THREE.Color(this.color).toArray() };
        this.fillObj.position.x = this.x;
        this.fillObj.position.y = this.y;
    }

    dispose() {
        if (this.outlineObj) {disposeObject(this.outlineObj);}
        if (this.fillObj) {disposeObject(this.fillObj);}
    }
}