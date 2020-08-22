import * as t from './three/build/three.module.js';
import { toRad, loadModel } from './helper.js';

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
    const origin = new t.Vector3(0, 0, 0);
    const distanceBw = 0.8;

    // Camera
    const fov = 45;
    const aspect = container.clientWidth / container.clientHeight;
    const near = 0.1;
    const far = 500;
    let camera = new t.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 3, 5);
    camera.rotation.x = toRad(-20);
    // camera.lookAt(origin);

    // Lights
    const ambientLight = new t.AmbientLight(0xffffff, 3.5);
    let dLight = new t.DirectionalLight(0xffffff, 2.5);
    dLight.position.set(0, 10, 10);
    scene.add(ambientLight);
    scene.add(dLight);

    // Plane
    const planeSide = 15;
    const planeGeometry = new t.PlaneGeometry(planeSide, planeSide);
    const planeMaterial = new t.MeshBasicMaterial({ color: 0x1D2951 });
    let plane = new t.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = toRad(-90);
    // scene.add(plane);

    const landGLTF = await loadModel('./3D/land.gltf');
    let land = landGLTF.scene;
    scene.add(land);

    // Monster ----------------------------------------------------------------------
    const monsterGLTF = await loadModel('./3D/monster.gltf');

    // Object
    let monster = monsterGLTF.scene;
    monster.position.set(-distanceBw, 0, 0);
    monster.rotation.y = toRad(85);
    scene.add(monster);

    // Animations
    let monsterIdle = true;
    let monsterMixer = new t.AnimationMixer(monster);
    const allMonsterClips = monsterGLTF.animations;
    const monsterClips = {
        idle: t.AnimationClip.findByName(allMonsterClips, 'idle'),
        punch: t.AnimationClip.findByName(allMonsterClips, 'punch'),
    };
    const monsterIdleAnim = monsterMixer.clipAction(monsterClips.idle);
    const monsterPunchAnim = monsterMixer.clipAction(monsterClips.punch);
    monsterPunchAnim.loop = t.LoopOnce;
    monsterIdleAnim.play();

    function monsterPunch() {
        if (monsterIdle) {
            monsterIdle = false;
            const fadeInTime = 0.5;
            const fadeOutTime = 0.25;
            monsterPunchAnim.reset().play();
            monsterIdleAnim.crossFadeTo(monsterPunchAnim, fadeInTime, true);
            setTimeout(() => {
                monsterIdleAnim.enabled = true;
                monsterPunchAnim.crossFadeTo(monsterIdleAnim, fadeOutTime, true);
                monsterIdle = true;
            }, monsterClips.punch.duration * 1000);
        }
    }

    // ------------------------------------------------------------------------------

    // Hero -------------------------------------------------------------------------
    const heroGLTF = await loadModel('./3D/hero.gltf');

    // Object
    let hero = heroGLTF.scene;
    hero.position.set(distanceBw, 0, 0.2);
    hero.rotation.y = toRad(-85);
    const heroScale = 1.1;
    hero.scale.set(heroScale, heroScale, heroScale);
    scene.add(hero);

    // Animations
    let heroIdle = true;
    let heroMixer = new t.AnimationMixer(hero);
    const allHeroClips = heroGLTF.animations;
    const heroClips = {
        idle: t.AnimationClip.findByName(allHeroClips, 'idle'),
        punch: t.AnimationClip.findByName(allHeroClips, 'punch'),
    };
    const heroIdleAnim = heroMixer.clipAction(heroClips.idle);
    const heroPunchAnim = heroMixer.clipAction(heroClips.punch);
    heroPunchAnim.loop = t.LoopOnce;
    heroIdleAnim.play();

    function heroPunch() {
        if (heroIdle) {
            heroIdle = false;
            const fadeInTime = 0.5;
            const fadeOutTime = 0.25;
            heroPunchAnim.reset().play();
            heroIdleAnim.crossFadeTo(heroPunchAnim, fadeInTime, true);
            setTimeout(() => {
                heroIdleAnim.enabled = true;
                heroPunchAnim.crossFadeTo(heroIdleAnim, fadeOutTime, true);
                heroIdle = true;
            }, heroClips.punch.duration * 1000);
        }
    }
    // ------------------------------------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);

        let deltaTime = clock.getDelta();
        monsterMixer.update(deltaTime);
        heroMixer.update(deltaTime);

        renderer.render(scene, camera);
    }

    animate();

    // Events

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    container.addEventListener('click', () => {
        monsterPunch();
        heroPunch();
    });
}

main().catch(err => {
    console.log(err);
})