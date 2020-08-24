import * as t from './three/build/three.module.js';
import { toRad, loadModel, heroLives, monsterLives, updateLives, gameStart, gameOver, setGameOver } from './helper.js';

async function main() {

    // DOM Elements
    let containerDOM = document.querySelector('#scene');
    let nextTimeDOM = document.getElementById("nextTime");
    let messageDOM = document.getElementById("message");
    let livesBoxDOM = document.getElementById("livesBox");


    // Renderer
    let renderer = new t.WebGLRenderer({ antialias: true, alpha: true, });
    renderer.setSize(containerDOM.clientWidth, containerDOM.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerDOM.appendChild(renderer.domElement);

    // Scene and meta
    let scene = new t.Scene();
    const clock = new t.Clock();
    const distanceBw = 0.685;
    const faceOffRotation = 20;
    const leftPlayerPosition = new t.Vector3(-distanceBw, 0, 0);
    const leftPlayerRotation = new t.Vector3(0, toRad(90 - faceOffRotation), 0);
    const rightPlayerPosition = new t.Vector3(distanceBw, 0, 0.7);
    const rightPlayerRotation = new t.Vector3(0, toRad(-90 - faceOffRotation), 0);
    let heroIsOnRight = false;
    let pattern = "";

    // Camera
    const fov = 45;
    const aspect = containerDOM.clientWidth / containerDOM.clientHeight;
    const near = 0.1;
    const far = 500;
    let camera = new t.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 3, 5);
    camera.rotation.x = toRad(-20);

    // Lights
    const ambientLight = new t.AmbientLight(0xffffff, 3.5);
    let dLight = new t.DirectionalLight(0xffffff, 2.5);
    dLight.position.set(0, 10, 10);
    scene.add(ambientLight);
    scene.add(dLight);

    const landGLTF = await loadModel('./3D/land.gltf');
    let land = landGLTF.scene;
    scene.add(land);

    // Monster ----------------------------------------------------------------------
    const monsterGLTF = await loadModel('./3D/monster.gltf');

    // Object
    let monster = monsterGLTF.scene;
    const monsterPosition = heroIsOnRight ? leftPlayerPosition : rightPlayerPosition;
    const monsterRotation = heroIsOnRight ? leftPlayerRotation : rightPlayerRotation;
    monster.position.set(monsterPosition.x, monsterPosition.y, monsterPosition.z);
    monster.rotation.set(monsterRotation.x, monsterRotation.y, monsterRotation.z);
    scene.add(monster);

    // Animations
    let monsterIdle = true;
    let monsterMixer = new t.AnimationMixer(monster);
    const allMonsterClips = monsterGLTF.animations;
    const monsterClips = {
        idle: t.AnimationClip.findByName(allMonsterClips, 'idle'),
        punch: t.AnimationClip.findByName(allMonsterClips, 'punch'),
        dying: t.AnimationClip.findByName(allMonsterClips, 'dying'),
        dance: t.AnimationClip.findByName(allMonsterClips, 'dance'),
    };
    const monsterIdleAnim = monsterMixer.clipAction(monsterClips.idle);
    const monsterPunchAnim = monsterMixer.clipAction(monsterClips.punch);
    const monsterDyingAnim = monsterMixer.clipAction(monsterClips.dying);
    const monsterDanceAnim = monsterMixer.clipAction(monsterClips.dance);
    monsterPunchAnim.loop = t.LoopOnce;
    monsterDyingAnim.loop = t.LoopOnce;
    monsterIdleAnim.play();

    function monsterPunch() {
        if (monsterIdle) {
            monsterIdle = false;
            const fadeInTime = 0.5;
            const fadeOutTime = 0.25;
            monsterPunchAnim.reset().play();
            monsterIdleAnim.crossFadeTo(monsterPunchAnim, fadeInTime, true);
            setTimeout(() => {
                if (heroIdle) {
                    updateLives(heroLives - 1, monsterLives, "You're Hurt");
                    heroReact();
                    if (!heroLives) {
                        heroDie();
                        setGameOver();
                        setTimeout(() => monsterDance(), 1200);
                    }
                }
                else if (heroPunchAnim.isRunning()) {
                    updateLives(heroLives - 1, monsterLives - 1, "Both Hurt");
                    if (!monsterLives) {
                        monsterDie();
                        setGameOver();
                        setTimeout(() => heroDance(), 1200);
                    }
                    if (!heroLives) {
                        heroDie();
                        setGameOver();
                        setTimeout(() => monsterDance(), 1200);
                    }
                }
                else updateLives(heroLives, monsterLives, "Dodged");
            }, monsterClips.punch.duration * 1000 / 2);
            setTimeout(() => {
                monsterIdleAnim.enabled = true;
                monsterPunchAnim.crossFadeTo(monsterIdleAnim, fadeOutTime, true);
                monsterIdle = true;
            }, monsterClips.punch.duration * 1000);
        }
    }

    let nextTimeInterval;
    let monsterPunchTimer = setInterval(() => {
        if (gameStart) {
            if (nextTimeInterval) clearInterval(nextTimeInterval);
            monsterPunch();
            let nextTime = 3;
            nextTimeInterval = setInterval(() => {
                if (nextTime > 0)
                    nextTimeDOM.innerHTML = `Monster will attack in ${nextTime} ${nextTime === 1 ? "second" : "seconds"}`;
                nextTime -= 1;
            }, 1000);
        }
    }, 3000);

    function monsterDie() {
        const fadeInTime = 0.5;
        monsterDyingAnim.reset().play();
        monsterDyingAnim.clampWhenFinished = true;
        if (monsterIdle) {
            monsterIdleAnim.crossFadeTo(monsterDyingAnim, fadeInTime, true);
        }
        else {
            monsterIdleAnim.stop();
            monsterPunchAnim.crossFadeTo(monsterDyingAnim, fadeInTime, true);
        }
    }

    function monsterDance() {
        const fadeInTime = 0.5;
        monsterDanceAnim.reset().play();
        if (monsterIdle) {
            monsterIdleAnim.crossFadeTo(monsterDanceAnim, fadeInTime, true);
        }
        else {
            monsterIdleAnim.stop();
            monsterPunchAnim.crossFadeTo(monsterDanceAnim, fadeInTime, true);
        }
    }

    // ------------------------------------------------------------------------------

    // Hero -------------------------------------------------------------------------
    const heroGLTF = await loadModel('./3D/hero.gltf');

    // Object
    let hero = heroGLTF.scene;
    const heroPosition = heroIsOnRight ? rightPlayerPosition : leftPlayerPosition;
    const heroRotation = heroIsOnRight ? rightPlayerRotation : leftPlayerRotation;
    hero.position.set(heroPosition.x, heroPosition.y, heroPosition.z);
    hero.rotation.set(heroRotation.x, heroRotation.y, heroRotation.z);
    const heroScale = 1.2;
    hero.scale.set(heroScale, heroScale, heroScale);
    scene.add(hero);

    // Animations
    let heroIdle = true;
    let heroMixer = new t.AnimationMixer(hero);
    const allHeroClips = heroGLTF.animations;
    const heroClips = {
        idle: t.AnimationClip.findByName(allHeroClips, 'idle'),
        punch: t.AnimationClip.findByName(allHeroClips, 'punch'),
        dodge: t.AnimationClip.findByName(allHeroClips, 'dodge'),
        react: t.AnimationClip.findByName(allHeroClips, 'react'),
        dying: t.AnimationClip.findByName(allHeroClips, 'dying'),
        dance: t.AnimationClip.findByName(allHeroClips, 'dance'),
    };
    const heroIdleAnim = heroMixer.clipAction(heroClips.idle);
    const heroPunchAnim = heroMixer.clipAction(heroClips.punch);
    const heroDodgeAnim = heroMixer.clipAction(heroClips.dodge);
    const heroReactAnim = heroMixer.clipAction(heroClips.react);
    const heroDyingAnim = heroMixer.clipAction(heroClips.dying);
    const heroDancingAnim = heroMixer.clipAction(heroClips.dance);
    heroPunchAnim.loop = t.LoopOnce;
    heroDodgeAnim.loop = t.LoopOnce;
    heroReactAnim.loop = t.LoopOnce;
    heroDyingAnim.loop = t.LoopOnce;
    heroIdleAnim.play();

    function heroPunch(key = "") {
        if (heroIdle) {
            if (pattern === "UUDDLRL" && key === "R") {
                pattern = "";
                konami();
            }
            else {
                heroIdle = false;
                const fadeInTime = 0.25;
                const fadeOutTime = 0.15;
                heroPunchAnim.reset().play();
                heroIdleAnim.crossFadeTo(heroPunchAnim, fadeInTime, true);
                setTimeout(() => {
                    if (monsterIdle) {
                        updateLives(heroLives, monsterLives - 1, "Monster Hurt");
                    }
                    if (!monsterLives) {
                        monsterDie();
                        setGameOver();
                        setTimeout(() => heroDance(), 1200);
                    }
                }, heroClips.punch.duration * 1000 / 2);
                setTimeout(() => {
                    heroIdleAnim.enabled = true;
                    heroPunchAnim.crossFadeTo(heroIdleAnim, fadeOutTime, true);
                    heroIdle = true;
                }, heroClips.punch.duration * 1000);
            }

            // Konami
            if (key === "U") {
                if (pattern === "" || pattern === "U") pattern += "U";
                else pattern = "";
                if (pattern) console.log(pattern);
            }
            else if (key === "R") {
                if (pattern === "UUDDL") pattern += "R";
                else if (pattern === "UUDDLRL") {
                    // Will never reach here, but stil...
                    pattern = "";
                    konami();
                }
                else pattern = "";
                if (pattern) console.log(pattern);
            }
        }
    }

    function heroDodge(key = "") {
        if (heroIdle) {
            heroIdle = false;
            const fadeInTime = 0.5;
            const fadeOutTime = 0.25;
            heroDodgeAnim.reset().play();
            heroIdleAnim.crossFadeTo(heroDodgeAnim, fadeInTime, true);
            setTimeout(() => {
                heroIdleAnim.enabled = true;
                heroDodgeAnim.crossFadeTo(heroIdleAnim, fadeOutTime, true);
                heroIdle = true;
            }, heroClips.dodge.duration * 1000);

            // Konami
            if (key === "D") {
                if (pattern === "UU" || pattern === "UUD") pattern += "D";
                else pattern = "";
                if (pattern) console.log(pattern);
            }
            else if (key === "L") {
                if (pattern === "UUDD" || pattern === "UUDDLR") pattern += "L";
                else pattern = "";
                if (pattern) console.log(pattern);
            }
        }
    }

    function heroReact() {
        if (heroIdle) {
            heroIdle = false;
            const fadeInTime = 0.25;
            const fadeOutTime = 0.1;
            heroReactAnim.reset().play();
            heroIdleAnim.crossFadeTo(heroReactAnim, fadeInTime, true);
            setTimeout(() => {
                heroIdleAnim.enabled = true;
                heroReactAnim.crossFadeTo(heroIdleAnim, fadeOutTime, true);
                heroIdle = true;
            }, heroClips.react.duration * 1000);
        }
    }

    function heroDie() {
        const fadeInTime = 1;
        heroDyingAnim.reset().play();
        heroDyingAnim.clampWhenFinished = true;
        if (heroIdle) {
            heroIdleAnim.crossFadeTo(heroDyingAnim, fadeInTime, true);
        }
        else {
            heroIdleAnim.stop();
            heroReactAnim.crossFadeTo(heroDyingAnim, fadeInTime, true);
        }
    }

    function heroDance() {
        const fadeInTime = 0.5;
        heroDancingAnim.reset().play();
        if (heroIdle) {
            heroIdleAnim.crossFadeTo(heroDancingAnim, fadeInTime, true);
        }
        else {
            heroIdleAnim.stop();
            heroPunchAnim.crossFadeTo(heroDancingAnim, fadeInTime, true);
        }
    }

    // ------------------------------------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);

        let deltaTime = clock.getDelta();
        monsterMixer.update(deltaTime);
        heroMixer.update(deltaTime);

        let monsterDownTimer;
        let heroDownTimer;

        if (!heroLives || !monsterLives || gameOver) {
            containerDOM.removeEventListener('click', onMouseClick);
            containerDOM.removeEventListener('dblclick', onDblMouseClick);
            containerDOM.removeEventListener('touchstart', onTouchStart);
            containerDOM.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('keydown', onKeyDown);
            clearInterval(monsterPunchTimer);
            clearInterval(nextTimeInterval);
            if (heroIsOnRight) {
                if (hero.rotation.y < 0)
                    hero.rotation.y += 0.01;
                if (monster.rotation.y > 0)
                    monster.rotation.y -= 0.01;
            }
            else {
                if (hero.rotation.y > 0)
                    hero.rotation.y -= 0.01;
                if (monster.rotation.y < 0)
                    monster.rotation.y += 0.01;
            }
        }
        if (!monsterLives) {
            monsterDownTimer = setTimeout(() => {
                monster.position.y -= 0.01;
            }, monsterClips.dying.duration * 500);
            if (monster.position.y < -0.5) clearTimeout(monsterDownTimer);
        }
        if (!heroLives) {
            heroDownTimer = setTimeout(() => {
                hero.position.y -= 0.01;
            }, heroClips.dying.duration * 500);
            if (hero.position.y < -0.5) clearTimeout(heroDownTimer);
        }

        renderer.render(scene, camera);
    }

    animate();

    // Events

    window.addEventListener('resize', () => {
        camera.aspect = containerDOM.clientWidth / containerDOM.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerDOM.clientWidth, containerDOM.clientHeight);
    });

    let clickTimer;
    const clickDelay = 300;
    let clickPrevent = false;

    containerDOM.addEventListener('click', onMouseClick);
    function onMouseClick() {
        clickTimer = setTimeout(() => {
            if (!clickPrevent) {
                heroPunch();
            }
            clickPrevent = false;
        }, clickDelay);
    }

    containerDOM.addEventListener('dblclick', onDblMouseClick)
    function onDblMouseClick() {
        clearTimeout(clickTimer);
        clickPrevent = true;
        heroDodge();
    }

    // Keyboard events
    document.addEventListener('keydown', onKeyDown);
    function onKeyDown(evt) {
        if (!gameStart) return;
        if (evt.keyCode === 38) {
            // Up Key
            heroPunch("U");
        }
        else if (evt.keyCode === 40) {
            // Down Key
            heroDodge("D");
        }
        else if (evt.keyCode === 37) {
            // Left Key
            heroDodge("L");
        }
        else if (evt.keyCode === 39) {
            // Right Key
            heroPunch("R");
        }
    }

    // Touch Events

    containerDOM.addEventListener('touchstart', onTouchStart, false);
    containerDOM.addEventListener('touchmove', onTouchMove, false);

    let xDown;
    let yDown;

    function onTouchStart(evt) {
        const firstTouch = evt.touches[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    };

    function onTouchMove(evt) {
        if (!xDown || !yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                // Left Swipe
                heroDodge("L");
            } else {
                // Right Swipe
                heroPunch("R");
            }
        } else {
            if (yDiff > 0) {
                // Up Swipe
                heroPunch("U");
            } else {
                // Down Swipe
                heroDodge("D");
            }
        }
        /* reset values */
        xDown = null;
        yDown = null;
    };

    // Konami
    function konami() {
        console.log("KONAMI!");
        setGameOver();
        setTimeout(() => {
            monsterDance();
            heroDance();
        }, 800);
        messageDOM.innerHTML = "Let there be peace!";
        nextTimeDOM.innerHTML = "You have found an easter egg!";
        livesBoxDOM.style.display = "none";
    }
}

main().catch(err => {
    console.log(err);
})