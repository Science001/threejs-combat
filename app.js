import * as t from './three/build/three.module.js';
import { toRad, loadModel, heroLives, monsterLives, updateLives, gameStart } from './helper.js';

async function main() {

    // Canvas Container
    let container = document.querySelector('#scene');

    // Renderer
    let renderer = new t.WebGLRenderer({ antialias: true, alpha: true, });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

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

    // Camera
    const fov = 45;
    const aspect = container.clientWidth / container.clientHeight;
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
    };
    const monsterIdleAnim = monsterMixer.clipAction(monsterClips.idle);
    const monsterPunchAnim = monsterMixer.clipAction(monsterClips.punch);
    const monsterDyingAnim = monsterMixer.clipAction(monsterClips.dying);
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
                    }
                }
                else if (heroPunchAnim.isRunning()) {
                    updateLives(heroLives - 1, monsterLives - 1, "Both Hurt");
                    if (!monsterLives) {
                        monsterDie();
                    }
                    if (!heroLives) {
                        heroDie();
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
    };
    const heroIdleAnim = heroMixer.clipAction(heroClips.idle);
    const heroPunchAnim = heroMixer.clipAction(heroClips.punch);
    const heroDodgeAnim = heroMixer.clipAction(heroClips.dodge);
    const heroReactAnim = heroMixer.clipAction(heroClips.react);
    const heroDyingAnim = heroMixer.clipAction(heroClips.dying);
    heroPunchAnim.loop = t.LoopOnce;
    heroDodgeAnim.loop = t.LoopOnce;
    heroReactAnim.loop = t.LoopOnce;
    heroDyingAnim.loop = t.LoopOnce;
    heroIdleAnim.play();

    function heroPunch() {
        if (heroIdle) {
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
                }
            }, heroClips.punch.duration * 1000 / 2);
            setTimeout(() => {
                heroIdleAnim.enabled = true;
                heroPunchAnim.crossFadeTo(heroIdleAnim, fadeOutTime, true);
                heroIdle = true;
            }, heroClips.punch.duration * 1000);
        }
    }

    function heroDodge() {
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

    // ------------------------------------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);

        let deltaTime = clock.getDelta();
        monsterMixer.update(deltaTime);
        heroMixer.update(deltaTime);

        let monsterDownTimer;
        let heroDownTimer;

        if (!heroLives || !monsterLives) {
            container.removeEventListener('click', onMouseClick);
            container.removeEventListener('dblclick', onDblMouseClick);
            clearInterval(monsterPunchTimer);
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
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    let monsterPunchTimer = setInterval(() => {
        let nextTimeInterval;
        if (gameStart) {
            if (nextTimeInterval) clearInterval(nextTimeInterval);
            monsterPunch();
            let nextTime = 3;
            nextTimeInterval = setInterval(() => {
                if (nextTime > 0)
                    document.getElementById("nextTime").innerHTML = `Monster will attack in ${nextTime} ${nextTime === 1 ? "second" : "seconds"}`;
                nextTime -= 1;
            }, 1000);
        }
    }, 3000);

    let clickTimer;
    const clickDelay = 300;
    let clickPrevent = false;

    container.addEventListener('click', onMouseClick);
    function onMouseClick() {
        clickTimer = setTimeout(() => {
            if (!clickPrevent) {
                heroPunch();
            }
            clickPrevent = false;
        }, clickDelay);
    }

    container.addEventListener('dblclick', onDblMouseClick)
    function onDblMouseClick() {
        clearTimeout(clickTimer);
        clickPrevent = true;
        heroDodge();
    }
}

main().catch(err => {
    console.log(err);
})