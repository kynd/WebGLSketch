import * as THREE from 'three';

export function distance2D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
export function v(x, y, z) {return new THREE.Vector3(x, y, z)};

export function line(points, color) {
    const material = new THREE.LineBasicMaterial( { color } );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    return line;
}

export function disposeObject(obj) {
    if (obj.parent) {
        obj.parent.remove(obj);
    }

    if (obj.geometry) {
        obj.geometry.dispose();
    }

    if (obj.material) {
        if (Array.isArray(obj.material)) {
        obj.material.forEach((material) => {
            if (material.map) {
            material.map.dispose();
            }
            if (material.lightMap) {
            material.lightMap.dispose();
            }
            if (material.bumpMap) {
            material.bumpMap.dispose();
            }
            if (material.normalMap) {
            material.normalMap.dispose();
            }
            if (material.specularMap) {
            material.specularMap.dispose();
            }
            if (material.envMap) {
            material.envMap.dispose();
            }
            material.dispose();
        });
        } else {
        if (obj.material.map) {
            obj.material.map.dispose();
        }
        if (obj.material.lightMap) {
            obj.material.lightMap.dispose();
        }
        if (obj.material.bumpMap) {
            obj.material.bumpMap.dispose();
        }
        if (obj.material.normalMap) {
            obj.material.normalMap.dispose();
        }
        if (obj.material.specularMap) {
            obj.material.specularMap.dispose();
        }
        if (obj.material.envMap) {
            obj.material.envMap.dispose();
        }
        obj.material.dispose();
        }
    }

    // Recursively dispose children
    if (obj.children) {
        while (obj.children.length > 0) {
        disposeObject(obj.children[0]);
        }
    }
}