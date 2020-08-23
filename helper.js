import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingManager } from "./three/build/three.module.js";

export let gameStart = false;
export let gameOver = false;

const loadingScreen = document.getElementById("loadingScreen");
const loaderHeading = document.getElementById("loaderHeading");
const startBtn = document.getElementById("startBtn");
const spinner = document.getElementById("spinner");
const loadingManager = new LoadingManager(() => {
    startBtn.style.display = "block";
    spinner.style.display = "none";
    loaderHeading.innerHTML = "All set for the epic battle"
});
const loader = new GLTFLoader(loadingManager);

startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loadingScreen.style.display = "none";
    gameStart = true;
})

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
        loadingScreen.style.display = "flex";
        loader.load(url, data => resolve(data), null, err => reject(err));
    });
}

// Lives
const messageBox = document.getElementById("message");
const livesBox = document.getElementById("livesBox");
const heroLivesBox = document.getElementById("heroLives");
const monsterLivesBox = document.getElementById("monsterLives");
export let heroLives = 5;
export let monsterLives = 8;
heroLivesBox.innerHTML = heroLives;
monsterLivesBox.innerHTML = monsterLives;

export function updateLives(hero, monster, message) {
    heroLives = hero;
    monsterLives = monster;
    heroLivesBox.innerHTML = heroLives;
    monsterLivesBox.innerHTML = monsterLives;
    messageBox.innerHTML = message;
    console.log(heroLives, monsterLives, message);

    if (!heroLives || !monsterLives) {
        livesBox.style.display = "none";
        gameOver = true;
    }
    if (!heroLives && !monsterLives) {
        messageBox.innerHTML = "Match Draw";
    }
    else if (!heroLives) {
        messageBox.innerHTML = "Monster Won";
    }
    else if (!monsterLives) {
        messageBox.innerHTML = "You Won";
    }
}