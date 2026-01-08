// apps/frontend/src/components/ThreeHero.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeHero = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black BG
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Mount to the DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // 2. CREATE SHAPES
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

    function createRippleCurve(isTop) {
      const shape = new THREE.Shape();
      const yOffset = isTop ? 0.2 : -0.2;
      shape.moveTo(-2, 1 + yOffset);
      shape.quadraticCurveTo(0, -0.5 + yOffset, 2, 1 + yOffset);
      shape.lineTo(2, 0.5 + yOffset);
      shape.quadraticCurveTo(0, -1 + yOffset, -2, 0.5 + yOffset);
      shape.lineTo(-2, 1 + yOffset);
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.center();
      const mesh = new THREE.Mesh(geometry, material);
      if (!isTop) mesh.rotation.x = Math.PI;
      return mesh;
    }

    const topCurve = createRippleCurve(true);
    const bottomCurve = createRippleCurve(false);
    scene.add(topCurve);
    scene.add(bottomCurve);

    // 3. ANIMATION LOOP
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 4. SCROLL LISTENER
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const splitFactor = 0.005;
      topCurve.position.x = -(scrollY * splitFactor);
      bottomCurve.position.x = (scrollY * splitFactor);
    };
    window.addEventListener('scroll', handleScroll);

    // 5. RESIZE LISTENER
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }} // Let clicks pass through to dashboard
    />
  );
};

export default ThreeHero;
