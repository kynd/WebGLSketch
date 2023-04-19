import $ from "jquery"
import * as THREE from 'three';

export class ScenarioBase {
    constructor() {
    }

    setupContext(w, h) {
        this.context = {};
        this.context.frameCount = 0;
        // Canvas Size
        this.context.width = w;
        this.context.height = h;

        // Camera
        const fov = 65;
        const hFovRadian = fov / 2 / 180 * Math.PI;
        const cz = this.context.height / 2 / Math.tan(hFovRadian);
        this.context.camera = new THREE.PerspectiveCamera(fov, this.context.width/this.context.height, 0.1, cz * 2 );
        this.context.camera.position.z = cz;

        // Renderers
        this.context.renderer = new THREE.WebGLRenderer();
        this.context.renderer.setSize( this.context.width, this.context.height );
        this.context.canvas = $(this.context.renderer.domElement);
        $('#main').append(this.context.canvas);
        $('#main').css({width: this.context.width * 0.5, height: this.context.height * 0.5});

        // Misc
		this.context.raycaster = new THREE.Raycaster();

        $(document).on("pointermove", this.pointerMove.bind(this));
        $(document).on("pointerdown", this.pointerDown.bind(this));
        $(document).on("pointerup", this.pointerUp.bind(this));
    }

    pointerMove(){}
    pointerDown(){}
    pointerUp(){}

    getPointerCrd(evt) {
        const offset = this.context.canvas.offset();
        const dpr = window.devicePixelRatio;
        const x = (evt.pageX - offset.left) * dpr;
        const y = this.context.height - (evt.pageY - offset.top) * dpr;
        return {x, y};
    }

    getPointerCrdNormalized(evt) {
        const m = this.getPointerCrd(evt);
        return { x: m.x / this.context.width * 2 - 1, y: m.y / this.context.height * 2 -1 };
    }

    getPointerIntersects(pointer) {
        this.context.raycaster.setFromCamera(pointer, this.context.camera);
        const intersects = this.context.raycaster.intersectObject( this.scene, true );

        if (intersects.length > 0) {
            return intersects.filter( (res)=> {
                return res && res.object;
            } )
        } else {
            return [];
        }
    }

    wait (func, init = ()=>{}) {
        if (func()) {
            init();
            this.start();
        } else {
            requestAnimationFrame( ()=>{this.wait(func, init)} );
        }
    }

    start () {
        this.animate();
    }

    animate() {
        requestAnimationFrame( this.animate.bind(this) );
        this.update();
        this.context.frameCount ++;
    }

    update() {}
}