// apps/frontend/src/components/ParticleAssembler.tsx
// High-performance Three.js particle system that assembles an image from particles
// Based on scroll position and mouse interaction

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// GLSL Vertex Shader
const vertexShader = `
  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uMouseSpeed;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uTexture;
  uniform float uParticleCount;
  
  attribute float aIndex;
  attribute vec2 aUv;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vMouseDistance;
  varying float vMouseInfluence;
  
  // Random function for particle dispersion
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Noise function for smooth random distribution
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Sample color from texture at UV coordinate
    vec4 texColor = texture2D(uTexture, aUv);
    vColor = texColor.rgb;
    
    // Original position (forming the image)
    vec3 originalPos = position;
    
    // Calculate particle ID for randomization
    float particleId = aIndex;
    vec2 seed = vec2(particleId, particleId * 0.1);
    
    // Dispersed position (random 3D position)
    float angle1 = random(seed) * 3.14159 * 2.0;
    float angle2 = random(seed * 0.7) * 3.14159;
    float radius = 5.0 + random(seed * 0.3) * 8.0;
    
    vec3 dispersedPos = vec3(
      sin(angle2) * cos(angle1) * radius,
      cos(angle2) * radius + 2.0,
      sin(angle2) * sin(angle1) * radius
    );
    
    // Interpolate between original and dispersed based on uProgress
    vec3 targetPos = mix(originalPos, dispersedPos, uProgress);
    
    // Add subtle floating movement when dispersed
    vec3 floatOffset = vec3(
      sin(uTime * 0.5 + particleId * 0.01) * 0.1,
      cos(uTime * 0.7 + particleId * 0.015) * 0.1,
      sin(uTime * 0.6 + particleId * 0.012) * 0.1
    ) * uProgress;
    
    // Mouse interaction - simplified approach
    // Calculate in world space first, then we'll use screen space for distance
    vec2 mouseWorldPos = vec2(
      ((uMouse.x / uResolution.x) - 0.5) * 8.0, // Map to world width (8 units)
      ((1.0 - uMouse.y / uResolution.y) - 0.5) * (8.0 / (uResolution.x / uResolution.y))
    );
    
    // Particle position in world space (before mouse offset)
    vec2 particleWorldPos = vec2(targetPos.x, targetPos.y);
    
    // Calculate distance from particle to mouse (in world space)
    vec2 diff = particleWorldPos - mouseWorldPos;
    vMouseDistance = length(diff);
    
    // Calculate mouse influence (only when mouse is moving fast and particle is near)
    float mouseRadius = 2.0; // Radius of mouse influence in world space
    float mouseInfluence = 0.0;
    
    if (uMouseSpeed > 0.015 && vMouseDistance < mouseRadius) {
      // Scale influence based on distance and mouse speed
      float distanceFactor = 1.0 - smoothstep(0.0, mouseRadius, vMouseDistance);
      // Higher mouse speed = stronger influence (non-linear for visual impact)
      mouseInfluence = distanceFactor * pow(uMouseSpeed, 1.3) * 1.2;
    }
    
    vMouseInfluence = mouseInfluence;
    
    // Apply mouse push effect (move away from mouse horizontally, towards camera on Z)
    vec3 mouseOffset = vec3(0.0);
    if (mouseInfluence > 0.0 && vMouseDistance > 0.001) {
      vec2 direction = normalize(diff);
      // Push particles away from mouse
      mouseOffset = vec3(
        direction * mouseInfluence * 0.4,
        mouseInfluence * 0.6 // Move towards camera
      );
    }
    
    // Final position
    vec3 finalPos = targetPos + floatOffset + mouseOffset;
    
    // Transform to clip space
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Base point size - increased for better visibility on full-screen
    float pointSize = 350.0 / -mvPosition.z;
    
    // Scale up when mouse is near
    pointSize *= (1.0 + mouseInfluence * 3.0);
    
    // Slightly larger when dispersed for visibility
    pointSize *= (1.0 + uProgress * 0.3);
    
    // Ensure minimum size for readability
    gl_PointSize = max(2.0, pointSize);
    gl_Position = projectionMatrix * mvPosition;
    
    // Alpha based on progress and mouse interaction
    vAlpha = mix(1.0, 0.3, uProgress * 0.7) + mouseInfluence * 0.3;
  }
`;

// GLSL Fragment Shader
const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vMouseDistance;
  varying float vMouseInfluence;
  
  void main() {
    // Create circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Glow effect when mouse is near
    float glow = 0.0;
    if (vMouseInfluence > 0.0) {
      glow = vMouseInfluence * 0.5;
    }
    
    vec3 finalColor = vColor + vec3(glow);
    gl_FragColor = vec4(finalColor, alpha * vAlpha);
  }
`;

interface ParticleAssemblerProps {
  particleCount?: number;
  imagePath?: string;
  containerRef?: React.RefObject<HTMLElement | null>; // Parent container element
}

export function ParticleAssembler({ 
  particleCount = 80000, // Increased for better density on full-screen
  imagePath = '/images/house-model.png',
  containerRef
}: ParticleAssemblerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get container dimensions or fallback to window
  const getContainerSize = () => {
    if (containerRef?.current) {
      return {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  };
  
  const initialSize = getContainerSize();
  const mousePosRef = useRef({ x: initialSize.width / 2, y: initialSize.height / 2 });
  const lastMousePosRef = useRef({ x: initialSize.width / 2, y: initialSize.height / 2 });
  const mouseSpeedRef = useRef(0);
  const progressRef = useRef({ value: 1.0 }); // Start dispersed (1.0) - will be 0 at bottom (image formed)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Get initial container dimensions
    const containerSize = getContainerSize();
    const containerWidth = containerSize.width || window.innerWidth;
    const containerHeight = containerSize.height || window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.setClearColor(0x000000, 0); // Transparent
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.objectFit = 'cover';
    
    // Mount canvas to mountRef (which is rendered as a child of containerRef)
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);
    }

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Load image texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imagePath,
      (texture) => {
        texture.flipY = false;
        
        // Calculate grid dimensions to match image aspect ratio
        const aspect = texture.image.width / texture.image.height;
        const cols = Math.ceil(Math.sqrt(particleCount * aspect));
        const rows = Math.ceil(particleCount / cols);
        const actualParticleCount = cols * rows;
        
        // Create instanced geometry for performance
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(actualParticleCount * 3);
        const uvs = new Float32Array(actualParticleCount * 2);
        const indices = new Float32Array(actualParticleCount);
        
        const imageAspect = texture.image.width / texture.image.height;
        const worldWidth = 8; // World space width
        const worldHeight = worldWidth / imageAspect;
        
        // Generate particle positions and UVs
        for (let i = 0; i < actualParticleCount; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          
          const u = col / cols;
          const v = row / rows;
          
          // Position in world space (centered)
          positions[i * 3] = (u - 0.5) * worldWidth;
          positions[i * 3 + 1] = (0.5 - v) * worldHeight;
          positions[i * 3 + 2] = 0;
          
          // UV coordinates for texture sampling
          uvs[i * 2] = u;
          uvs[i * 2 + 1] = v;
          
          // Index for randomization
          indices[i] = i;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uProgress: { value: progressRef.current.value },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uMouseSpeed: { value: 0 },
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(containerWidth, containerHeight) },
            uTexture: { value: texture },
            uParticleCount: { value: actualParticleCount }
          },
          transparent: true,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          vertexColors: false
        });
        
        materialRef.current = material;
        
        // Create point cloud
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        
        // Start animation loop
        const clock = new THREE.Clock();
        
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          
          const elapsed = clock.getElapsedTime();
          
          // Update shader uniforms
          if (material.uniforms) {
            material.uniforms.uTime.value = elapsed;
            material.uniforms.uProgress.value = progressRef.current.value;
            material.uniforms.uMouse.value.set(mousePosRef.current.x, mousePosRef.current.y);
            material.uniforms.uMouseSpeed.value = mouseSpeedRef.current;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
      }
    );

    // Mouse tracking with speed calculation - relative to container
    let lastFrameTime = performance.now();
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const deltaTime = (now - lastFrameTime) / 1000; // Convert to seconds
      lastFrameTime = now;
      
      // Get mouse position relative to container
      let mouseX = e.clientX;
      let mouseY = e.clientY;
      
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      }
      
      const lastX = lastMousePosRef.current.x;
      const lastY = lastMousePosRef.current.y;
      
      // Calculate distance moved
      const dx = mouseX - lastX;
      const dy = mouseY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate speed (pixels per second, normalized)
      mouseSpeedRef.current = Math.min(distance / (deltaTime * 100), 1.0); // Cap at 1.0
      
      mousePosRef.current.x = mouseX;
      mousePosRef.current.y = mouseY;
      
      // Decay speed over time (exponential decay)
      requestAnimationFrame(() => {
        mouseSpeedRef.current *= 0.92; // Decay factor
      });
      
      lastMousePosRef.current = { x: mouseX, y: mouseY };
    };

    // Attach mouse listener to container if available, otherwise window
    const mouseTarget = containerRef?.current || window;
    mouseTarget.addEventListener('mousemove', handleMouseMove, { passive: true });

    // GSAP ScrollTrigger setup - Trigger between Hero 4 and Hero 5 (Impact section)
    const triggerElement = document.querySelector('[data-particle-trigger]');
    
    if (triggerElement) {
      ScrollTrigger.create({
        trigger: triggerElement,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          // When scrolling DOWN to bottom: progress goes from 1 to 0 (particles form image)
          // When scrolling UP from bottom: progress goes from 0 to 1 (particles disperse)
          // Reverse the progress so 0 = image formed, 1 = dispersed
          progressRef.current.value = 1 - self.progress;
        },
        scrub: true, // Smooth scrubbing tied to scroll
      });
    }

    // Fallback: Direct scroll listener for fine control
    // This provides smoother control than GSAP for the particle transition
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = Math.max(documentHeight - windowHeight, 1);
      
      // Progress calculation:
      // At bottom (scrollY >= maxScroll - 100px): progress = 0 (image fully formed)
      // When scrolling up: progress increases (particles disperse)
      // Transition zone: last 40% of scrollable area
      const transitionStart = maxScroll * 0.6;
      const scrollFromBottom = maxScroll - scrollY;
      const transitionZone = maxScroll * 0.4;
      
      if (scrollY >= transitionStart) {
        // In transition zone - particles are forming/dispersing
        const progressInZone = (scrollY - transitionStart) / transitionZone;
        progressRef.current.value = 1 - progressInZone; // Invert: 0 = bottom (formed), 1 = dispersed
      } else if (scrollY >= maxScroll - 50) {
        // At very bottom - image fully formed
        progressRef.current.value = 0;
      } else {
        // Above transition zone - particles fully dispersed
        progressRef.current.value = 1;
      }
      
      progressRef.current.value = Math.max(0, Math.min(1, progressRef.current.value));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize on mount
    setTimeout(handleScroll, 100);

    // Handle resize - Use container dimensions, not window
    const handleResize = () => {
      const containerSize = getContainerSize();
      const containerWidth = containerSize.width || window.innerWidth;
      const containerHeight = containerSize.height || window.innerHeight;
      
      // Update camera aspect ratio
      camera.aspect = containerWidth / containerHeight;
      camera.updateProjectionMatrix();
      
      // Update renderer size to match container
      renderer.setSize(containerWidth, containerHeight);
      
      // Update shader resolution uniform
      if (materialRef.current?.uniforms?.uResolution) {
        materialRef.current.uniforms.uResolution.value.set(containerWidth, containerHeight);
      }
    };

    // Initial resize call
    handleResize();
    
    // Use ResizeObserver for container, fallback to window resize
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef?.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      const mouseTarget = containerRef?.current || window;
      mouseTarget.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [imagePath, particleCount, containerRef]);

  return (
    <div
      ref={mountRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        objectFit: 'cover'
      }}
    />
  );
}
