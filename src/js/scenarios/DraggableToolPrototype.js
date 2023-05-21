import * as THREE from 'three';
import { ScenarioBase } from "./ScenarioBase.js";
import { PingPong } from '../scenes/PingPong.js';
import { Menu } from "../utils/Menu.js";
import { QuadDraggableTool } from "../draggableTools/QuadDraggableTool"
import { StrokeDraggableTool } from "../draggableTools/StrokeDraggableTool"
import { SimpleImageScene } from '../scenes/SimpleImageScene.js';
import { ShaderTextureMaker } from "../utils/ShaderTextureMaker.js"

export class DraggableToolPrototype extends ScenarioBase {
    constructor() {
        super();
        this.setupContext(1920, 1920);
        this.setToolList();
        this.setup();
        this.asyncStart();
    }

    setToolList() {
        this.toolList = [
            {label: "Stroke", obj: StrokeDraggableTool, key: "s"},
            {label: "Quad", obj: QuadDraggableTool, key: "q"},
        ]
    }

    setup() {
        this.scene = new THREE.Scene();
        this.mainScene = new THREE.Scene();
        this.printScene = new THREE.Scene();
        this.pingPong = new PingPong(this.context, '../shaders/simple_image.frag');
        this.imageScene = new SimpleImageScene(this.context, '../img/face2.png');

        this.isDragging = false;
        this.waitForToolToFinish = true;
        this.currentTool = null;
        this.toolInstances = [];
        this.dragStartPoint = null;
        this.hitTargets = [];

        this.shaderTexture = new ShaderTextureMaker(this.context.width / 2, this.context.height / 2, '../shaders/ShaderTextureMakerTest.frag', this.context);

        const menuDef = [];
        this.toolList.forEach((tool)=>{
            menuDef.push({label: tool.label, key: tool.key, f: ()=>{this.tool = tool.obj}});
            tool.obj.init();
        })
        this.tool = this.toolList[0].obj;
        this.menu = new Menu(menuDef)
    }

    async asyncStart() {
        this.wait(()=>{
            let ready = this.pingPong.ready && this.imageScene.ready 
                        && this.shaderTexture.ready;
            this.toolList.forEach((tool)=>{
                ready &= tool.obj.ready;
            });
            return ready;
        });
    }

    update() {
        this.shaderTexture.update();
        this.context.renderer.autoClear = false;
        this.context.renderer.render( this.pingPong.scene, this.context.camera);
        //this.context.renderer.render( this.imageScene.scene, this.context.camera);
        
        this.context.renderer.render( this.mainScene, this.context.camera);
        this.context.renderer.render( this.scene, this.context.camera);
        this.context.renderer.autoClear = true;
    }
    
    pointerMove(evt) {
        if (this.isDragging) {
            this.updateCurrentTool(evt);
        } else {
            const pointerCrd = this.getPointerCrdNormalized(evt);
            const hitTargets = [
                ...this.getPointerIntersects(pointerCrd),
                ...this.getPointerIntersects(pointerCrd, this.mainScene)
            ];
            this.hitTargets = hitTargets;
        }
    }

    pointerDown(evt) {
        if (this.currentTool && this.isDragging) {
            this.pointerDownWhileDragging(evt);
        } else {
            this.pointerDownNew(evt);
        }
    }

    pointerDownWhileDragging(evt) {
        const isDone = this.currentTool.pointerDown();
        if (isDone) {
            this.endDrag();
        }
    }

    pointerDownNew(evt) {
        this.isDragging = true;
        this.dragStartPoint = this.getPointerCrd(evt);
        if (this.hitTargets.length > 0 && this.hitTargets[0].object) {
            this.currentTool = this.hitTargets[0].object.toolRef;
            this.currentTool.startDrag(this.hitTargets[0].object);
            this.mainScene.remove(this.currentTool.mainObj);
            this.mainScene.add(this.currentTool.mainObj);
        } else {
            this.currentTool = new this.tool();
            this.updateCurrentTool(evt);
            this.scene.add(this.currentTool.previewObj);
            this.mainScene.add(this.currentTool.mainObj);
        }
    }

    updateCurrentTool(evt) {
        const crd = this.getPointerCrd(evt);
        this.currentTool.update({
            pointer: this.pointerCrdToSceneCrd(crd),
            tex: this.pingPong.getCopyRenderTarget().texture,
            tex2: this.shaderTexture.renderTarget.texture,
            colorSource: this.imageScene.texture,
            context: this.context
        }, this.context);
    }

    pointerUp(evt) {
        if (this.currentTool) {
            const isDone = this.currentTool.pointerUp();
            if (isDone) {
                this.endDrag();
            }
        }
    }

    endDrag() {
        this.isDragging = false;
        this.currentTool.endDrag();
        if (!this.toolInstances.some((tool)=> {tool == this.currentTool})) {
            this.toolInstances.push(this.currentTool);
        }
        this.currentTool = null;
    }
}
