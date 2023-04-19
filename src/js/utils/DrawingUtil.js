import * as THREE from 'three';

export function v(x, y, z) {return new THREE.Vector3(x, y, z)};

export function line(points, color) {
    const material = new THREE.LineBasicMaterial( { color } );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    return line;
}