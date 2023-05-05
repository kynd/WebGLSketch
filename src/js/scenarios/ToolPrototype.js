import * as THREE from 'three';
import { ScenarioBase } from "./ScenarioBase.js";
import { distance2D } from "../utils/DrawingUtil.js"
import { PingPong } from '../scenes/PingPong.js';
import { CircleSpinnerTool } from '../tools/CircleSpinnerTool.js';

export class ToolPrototype extends ScenarioBase {
    constructor() {
        super();
        this.setupContext(1920, 1920);
        this.setup();
        this.asyncStart();
    }

    setup() {
        this.autoActors = [];
        this.scene = new THREE.Scene();
        this.printScene = new THREE.Scene();
        this.pingPong = new PingPong(this.context, '../shaders/simple_image.frag');
        this.isDragging = false;
    }

    async asyncStart() {
        await CircleSpinnerTool.init();
        this.start();
    }

    pointerMove(evt) {
        if (this.isDragging) {
            this.updateCurrentTool(evt);
        }
    }

    pointerDown(evt) {
        this.isDragging = true;

        this.currentTool = new CircleSpinnerTool();
        this.updateCurrentTool(evt);
        this.scene.add(this.currentTool.previewObj);
        this.scene.add(this.currentTool.printObj);
    }

    updateCurrentTool(evt) {
        const crd = this.getPointerCrd(evt);
        this.currentTool.updatePreview({
            pointer: this.pointerCrdToSceneCrd(crd),
            tex: this.pingPong.getCopyRenderTarget(),
            context: this.context
        }, this.context);
    }

    pointerUp(evt) {
        this.isDragging = false;
        if (this.currentTool) {
            //this.currentTool.isDone = true;
            this.autoActors.push(this.currentTool);
            this.currentTool.endPreview();
            this.currentTool = null;
        }
    }

    update() {
        for (let i = this.autoActors.length -1; i >=0; i --) {
            const actor = this.autoActors[i];
            if (actor.isDone) {
                this.printScene.add(actor.printObj);
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
