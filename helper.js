import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
const loader = new GLTFLoader();

export const toRad = (degree) => (degree * Math.PI / 180);

export function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

export function loadModel(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, data => resolve(data), null, err => reject(err));
    });
}
