// Optimized Three.js implementation with proper resource management and performance optimizations
class IconsScene {
    static instance = null;
    
    constructor() {
        if (IconsScene.instance) return IconsScene.instance;
        IconsScene.instance = this;
        
        // Reusable objects pool
        this.vectorPool = Array(20).fill().map(() => new THREE.Vector3());
        this.matrixPool = Array(10).fill().map(() => new THREE.Matrix4());
        this.currentVectorIndex = 0;
        this.currentMatrixIndex = 0;
        
        // Scene state
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubes = [];
        this.hoverSquares = [];
        this.hoveredCubeIndex = -1;
        this.masterHoverActive = false;
        this.disposed = false;
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.touchTimeout = null;
        this.lastTapTime = 0;
        
        // Constants
        this.NUM_ICONS = 8;
        this.colorUpdateRequested = false;
        
        // Resource caches
        this.geometryCache = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.edgesGeometry = new THREE.EdgesGeometry(this.geometryCache);
        this.materialCache = new Map();
        this.canvasCache = new Map();
        this.textureLoader = new THREE.TextureLoader();
        
        // Easter egg sequence tracking
        this.easterEggSequence = [];
        this.correctSequence = ['0', '2', '6', '7', 'master'];
        
        // Initialize scene
        this.init();
        
        // Start animation loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    // Get pooled vector
    getVector() {
        const vector = this.vectorPool[this.currentVectorIndex];
        this.currentVectorIndex = (this.currentVectorIndex + 1) % this.vectorPool.length;
        return vector;
    }
    
    // Get pooled matrix
    getMatrix() {
        const matrix = this.matrixPool[this.currentMatrixIndex];
        this.currentMatrixIndex = (this.currentMatrixIndex + 1) % this.matrixPool.length;
        return matrix;
    }
    
    init() {
        // Scene setup with optimized parameters
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
        this.camera.position.z = 7;
        
        // Renderer with optimized settings
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'mediump'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = false;
        
        const container = document.getElementById('three-container');
        container.appendChild(this.renderer.domElement);
        
        // Setup UI elements
        this.setupUIElements(container);
        
        // Create cubes with optimized loading
        this.createCubes();
        
        // Event listeners
        this.setupEventListeners();
    }
    
    setupUIElements(container) {
        const squaresContainer = document.createElement('div');
        Object.assign(squaresContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '10'
        });
        
        const masterRect = this.createMasterRect();
        squaresContainer.appendChild(masterRect);
        container.appendChild(squaresContainer);
        
        this.squaresContainer = squaresContainer;
    }
    
    createMasterRect() {
        const masterRect = document.createElement('div');
        Object.assign(masterRect.style, {
            position: 'absolute',
            width: '150px',
            height: '330px',
            backgroundColor: 'rgba(255, 0, 0, 0)',
            left: '50%',
            top: '58%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            cursor: this.isTouchDevice ? 'default' : 'pointer',
            borderRadius: '12px',
            border: '2px solid rgba(255, 0, 0, 0)',
            zIndex: '11',
            touchAction: 'none' // Prevent default touch actions
        });
        
        if (this.isTouchDevice) {
            masterRect.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMasterHover(true);
            }, { passive: false });
            
            masterRect.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMasterHover(false);
            }, { passive: false });
        } else {
            masterRect.addEventListener('mouseenter', () => this.handleMasterHover(true));
            masterRect.addEventListener('mouseleave', () => this.handleMasterHover(false));
        }
        
        return masterRect;
    }
    
    handleMasterHover(isHovering) {
        this.masterHoverActive = isHovering;
        const currentTime = performance.now() * 0.001;
        
        // Log master hover for debugging
        if (isHovering) {
            console.log('hitbox/cube master');
            
            // Add to easter egg sequence
            this.easterEggSequence.push('master');
            this.checkEasterEggSequence();
        }
        
        this.cubes.forEach(cube => {
            if (isHovering && !cube.hoverPosition) {
                const position = this.getVector().copy(cube.mesh.position);
                cube.hoverPosition = { x: position.x, y: position.y, z: position.z };
                cube.hoverTime = currentTime;
            } else if (!isHovering && cube.hoverPosition) {
                cube.timeOffset = currentTime - cube.hoverTime + cube.timeOffset;
                cube.hoverPosition = null;
                cube.hoverTime = null;
            }
        });
    }
    
    async createCubes() {
        const loadTexture = async (index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = `./assets/icons-lang/lang${index}.png`;
            });
        };
        
        const promises = Array(this.NUM_ICONS).fill().map((_, i) => loadTexture(i + 1));
        const images = await Promise.all(promises);
        
        images.forEach((img, i) => this.createCube(img, i + 1));
    }
    
    createCube(img, index) {
        const { lightCanvas, darkCanvas } = this.prepareCanvases(img, index);
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const initialCanvas = isDarkMode ? darkCanvas : lightCanvas;
        
        const texture = this.createTexture(initialCanvas, index, isDarkMode);
        const materials = Array(6).fill().map(() => new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        }));
        
        const cube = new THREE.Mesh(this.geometryCache, materials);
        this.createEdgeLines(isDarkMode).forEach(line => cube.add(line));
        
        const position = this.calculateCubePosition(index);
        cube.position.copy(position);
        
        const hoverSquare = this.createHoverSquare(index);
        this.squaresContainer.appendChild(hoverSquare);
        this.hoverSquares.push(hoverSquare);
        
        this.scene.add(cube);
        this.cubes.push(this.createCubeState(cube, position));
    }
    
    calculateCubePosition(index) {
        const isLeftSide = index <= Math.ceil(this.NUM_ICONS / 2);
        const sideOffset = isLeftSide ? -1.2 : 1.2;
        const cubesOnThisSide = isLeftSide ? Math.ceil(this.NUM_ICONS / 2) : Math.floor(this.NUM_ICONS / 2);
        const indexOnSide = isLeftSide ? index : (index - Math.ceil(this.NUM_ICONS / 2));
        const verticalSpacing = 0.5;
        const verticalOffset = (indexOnSide - 1) * verticalSpacing - (cubesOnThisSide - 1) * verticalSpacing / 2;
        
        return this.getVector().set(sideOffset, verticalOffset, 0);
    }
    
    createCubeState(cube, position) {
        return {
            mesh: cube,
            baseX: position.x,
            baseY: position.y,
            baseZ: position.z,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            normalRotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            hoverScale: 1.0,
            targetHoverScale: 1.0,
            timeOffset: Math.random() * Math.PI * 2,
            hoverPosition: null,
            hoverTime: null
        };
    }
    
    animate() {
        if (this.disposed) return;
        
        requestAnimationFrame(this.animate);
        const currentTime = performance.now() * 0.001;
        
        // Update cubes with optimized calculations
        this.cubes.forEach((cube, index) => {
            this.updateCube(cube, index, currentTime);
            this.updateHoverSquare(cube, index);
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCube(cube, index, currentTime) {
        const isHovered = index === this.hoveredCubeIndex || this.masterHoverActive;
        
        if (isHovered) {
            this.handleCubeHover(cube, currentTime);
        } else {
            this.handleCubeNormal(cube, currentTime, index);
        }
        
        // Update scale and rotation
        cube.hoverScale += (cube.targetHoverScale - cube.hoverScale) * 0.1;
        cube.mesh.scale.setScalar(cube.hoverScale);
        
        cube.mesh.rotation.x += cube.rotationSpeed.x;
        cube.mesh.rotation.y += cube.rotationSpeed.y;
        cube.mesh.rotation.z += cube.rotationSpeed.z;
    }
    
    handleCubeHover(cube, currentTime) {
        if (!cube.hoverPosition) {
            const position = this.getVector().copy(cube.mesh.position);
            cube.hoverPosition = { x: position.x, y: position.y, z: position.z };
            cube.hoverTime = currentTime;
        }
        
        cube.targetHoverScale = 1.3;
        cube.rotationSpeed.x = cube.normalRotationSpeed.x * 8;
        cube.rotationSpeed.y = cube.normalRotationSpeed.y * 8;
        cube.rotationSpeed.z = cube.normalRotationSpeed.z * 8;
        
        cube.mesh.position.set(
            cube.hoverPosition.x,
            cube.hoverPosition.y,
            cube.hoverPosition.z
        );
    }
    
    handleCubeNormal(cube, currentTime, index) {
        if (cube.hoverPosition) {
            cube.timeOffset = currentTime - cube.hoverTime + cube.timeOffset;
            cube.hoverPosition = null;
            cube.hoverTime = null;
        }
        
        cube.targetHoverScale = 1.0;
        cube.rotationSpeed.x = cube.normalRotationSpeed.x;
        cube.rotationSpeed.y = cube.normalRotationSpeed.y;
        cube.rotationSpeed.z = cube.normalRotationSpeed.z;
        
        const adjustedTime = currentTime - cube.timeOffset;
        const position = this.getVector();
        
        position.y = cube.baseY + Math.sin(adjustedTime * 2 + index) * 0.1;
        position.x = cube.baseX + Math.sin(adjustedTime * 1.5 + index * 2) * 0.05 +
            Math.sin(adjustedTime + index * Math.PI) * 0.1;
        position.z = cube.baseZ + Math.cos(adjustedTime * 1.5 + index * 2) * 0.05;
        
        cube.mesh.position.copy(position);
    }
    
    updateHoverSquare(cube, index) {
        if (!this.hoverSquares[index]) return;
        
        // Get cube's world position
        const position = this.getVector().copy(cube.mesh.position);
        cube.mesh.getWorldPosition(position);
        position.project(this.camera);
        
        // Calculate screen coordinates
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        // Adjust position to center the hitbox on the cube
        const x = (position.x * widthHalf) + widthHalf - 25;
        const y = -(position.y * heightHalf) + heightHalf - 25;
        
        // Apply position with GPU acceleration
        this.hoverSquares[index].style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    
    onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    dispose() {
        this.disposed = true;
        
        // Dispose geometries
        this.geometryCache.dispose();
        this.edgesGeometry.dispose();
        
        // Dispose materials and textures
        this.materialCache.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
        });
        
        // Dispose meshes
        this.cubes.forEach(cube => {
            cube.mesh.geometry.dispose();
            if (Array.isArray(cube.mesh.material)) {
                cube.mesh.material.forEach(mat => mat.dispose());
            } else {
                cube.mesh.material.dispose();
            }
        });
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        // Clear scene
        this.scene.clear();
        
        // Dispose renderer
        this.renderer.dispose();
        
        // Clear caches
        this.materialCache.clear();
        this.canvasCache.clear();
        
        // Remove DOM elements
        this.hoverSquares.forEach(square => square.remove());
        this.renderer.domElement.remove();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize);
        
        document.addEventListener('colorModeChanged', () => {
            const isDarkMode = document.documentElement.classList.contains('dark-mode');
            this.updateCubeColors(isDarkMode);
        });
    }
    
    prepareCanvases(img, index) {
        if (this.canvasCache.has(index)) {
            return this.canvasCache.get(index);
        }

        const lightCanvas = document.createElement('canvas');
        const darkCanvas = document.createElement('canvas');
        [lightCanvas, darkCanvas].forEach(canvas => {
            canvas.width = 512;
            canvas.height = 512;
        });

        // Prepare light mode
        const lightCtx = lightCanvas.getContext('2d');
        lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
        lightCtx.drawImage(img, 0, 0, lightCanvas.width, lightCanvas.height);
        lightCtx.globalCompositeOperation = 'destination-over';
        lightCtx.fillStyle = '#fff';
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);

        // Prepare dark mode
        const darkCtx = darkCanvas.getContext('2d');
        darkCtx.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
        darkCtx.drawImage(img, 0, 0, darkCanvas.width, darkCanvas.height);
        this.invertCanvas(darkCanvas);
        darkCtx.globalCompositeOperation = 'destination-over';
        darkCtx.fillStyle = '#202124';
        darkCtx.fillRect(0, 0, darkCanvas.width, darkCanvas.height);

        const result = { lightCanvas, darkCanvas };
        this.canvasCache.set(index, result);
        return result;
    }
    
    invertCanvas(canvas) {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        
        context.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    createTexture(canvas, index, isDarkMode) {
        const textureKey = `texture_${index}_${isDarkMode ? 'dark' : 'light'}`;
        let texture = this.materialCache.get(textureKey);
        
        if (!texture) {
            texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
            this.materialCache.set(textureKey, texture);
        }
        
        return texture;
    }
    
    createEdgeLines(isDarkMode) {
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: isDarkMode ? 0xFFFFFF : 0x000000,
            transparent: true,
            opacity: 1
        });

        const edgeOffsets = [
            { x: 0, y: 0 }, { x: 0.002, y: 0.002 }, { x: -0.002, y: -0.002 },
            { x: 0.004, y: 0.004 }, { x: -0.004, y: -0.004 }, { x: 0.002, y: -0.002 },
            { x: -0.002, y: 0.002 }, { x: 0.004, y: 0 }, { x: -0.004, y: 0 },
            { x: 0, y: 0.004 }, { x: 0, y: -0.004 }
        ];

        return edgeOffsets.map(offset => {
            const edgeLine = new THREE.LineSegments(this.edgesGeometry, edgesMaterial.clone());
            edgeLine.position.x = offset.x;
            edgeLine.position.y = offset.y;
            return edgeLine;
        });
    }
    
    createHoverSquare(index) {
        const hoverSquare = document.createElement('div');
        Object.assign(hoverSquare.style, {
            position: 'absolute',
            width: '50px',
            height: '50px',
            backgroundColor: 'rgba(255, 0, 0, 0)',
            pointerEvents: 'auto',
            cursor: this.isTouchDevice ? 'default' : 'pointer',
            borderRadius: '8px',
            border: '2px solid rgba(255, 0, 0, 0)',
            zIndex: '12',
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
            touchAction: 'none'
        });

        const cubeIndex = index - 1;
        
        const handleInteractionStart = () => {
            this.hoveredCubeIndex = cubeIndex;
            this.hoverSquares.forEach(square => square.style.zIndex = '12');
            hoverSquare.style.zIndex = '13';
            
            // Log hover for easter egg
            console.log(`hitbox/cube ${cubeIndex}`);
            this.easterEggSequence.push(cubeIndex.toString());
            this.checkEasterEggSequence();
            
            // For touch devices, auto-reset after delay
            if (this.isTouchDevice) {
                if (this.touchTimeout) {
                    clearTimeout(this.touchTimeout);
                }
                this.touchTimeout = setTimeout(() => {
                    this.hoveredCubeIndex = -1;
                    hoverSquare.style.zIndex = '12';
                }, 2000); // Reset after 2 seconds
            }
        };
        
        const handleInteractionEnd = () => {
            if (!this.isTouchDevice) {
                this.hoveredCubeIndex = -1;
                hoverSquare.style.zIndex = '12';
            }
        };
        
        if (this.isTouchDevice) {
            // Handle touch events
            hoverSquare.addEventListener('touchstart', (e) => {
                e.preventDefault();
                
                const now = Date.now();
                
                // Detect double tap
                if (now - this.lastTapTime < 300) {
                    // Double tap detected - toggle persistent hover
                    if (this.hoveredCubeIndex === cubeIndex) {
                        handleInteractionEnd();
                        if (this.touchTimeout) {
                            clearTimeout(this.touchTimeout);
                            this.touchTimeout = null;
                        }
                    } else {
                        handleInteractionStart();
                    }
                } else {
                    // Single tap - temporary hover
                    handleInteractionStart();
                }
                
                this.lastTapTime = now;
            }, { passive: false });
        } else {
            // Handle mouse events
            hoverSquare.addEventListener('mouseenter', handleInteractionStart);
            hoverSquare.addEventListener('mouseleave', handleInteractionEnd);
        }

        return hoverSquare;
    }
    
    checkEasterEggSequence() {
        // Keep only the last 5 interactions
        if (this.easterEggSequence.length > 5) {
            this.easterEggSequence.shift();
        }

        // Check if the sequence matches
        const isMatch = this.easterEggSequence.join(',') === this.correctSequence.join(',');
        
        if (isMatch) {
            console.log('Easter egg sequence matched! 🎉');
            this.showEasterEggConfirmation();
            this.easterEggSequence = []; // Reset sequence
        }
    }

    showEasterEggConfirmation() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'easter-egg-overlay';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'easter-egg-dialog';
        
        // Add content
        dialog.innerHTML = `
            <h2>🎮 Easter Egg Found!</h2>
            <p>You've discovered a hidden snake game! Would you like to play?</p>
            <div class="easter-egg-buttons">
                <button class="easter-egg-button confirm">Let's Play!</button>
                <button class="easter-egg-button cancel">Maybe Later</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Add animation class after a small delay (for transition)
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        // Handle button clicks
        const confirmBtn = dialog.querySelector('.confirm');
        const cancelBtn = dialog.querySelector('.cancel');
        
        const closeDialog = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300); // Match transition duration
        };
        
        confirmBtn.addEventListener('click', async () => {
            closeDialog();
            // Dynamically import the snake game module
            try {
                const { default: SnakeGame } = await import('./snake-game.js');
                const game = new SnakeGame();
                game.init();
            } catch (error) {
                console.error('Failed to load snake game:', error);
            }
        });
        
        cancelBtn.addEventListener('click', closeDialog);
    }

    updateCubeColors(isDarkMode) {
        if (this.colorUpdateRequested) return;
        this.colorUpdateRequested = true;

        const container = document.getElementById('three-container');
        
        // Start exit animation
        container.classList.add('exit');
        
        setTimeout(() => {
            this.cubes.forEach((cube, index) => {
                // Update edge colors
                cube.mesh.children.forEach(edge => {
                    edge.material.color.setHex(isDarkMode ? 0xFFFFFF : 0x000000);
                });

                // Update textures
                const textureKey = `texture_${index + 1}_${isDarkMode ? 'dark' : 'light'}`;
                let texture = this.materialCache.get(textureKey);
                
                if (!texture) {
                    const { lightCanvas, darkCanvas } = this.prepareCanvases(cube.mesh.material[0].map.image, index + 1);
                    const canvas = isDarkMode ? darkCanvas : lightCanvas;
                    texture = this.createTexture(canvas, index + 1, isDarkMode);
                    this.materialCache.set(textureKey, texture);
                }

                cube.mesh.material.forEach(material => {
                    material.map = texture;
                    material.map.needsUpdate = true;
                });
            });

            // Handle animation
            container.style.transition = 'none';
            container.classList.remove('exit');
            container.classList.add('enter');
            container.offsetHeight; // Force reflow
            container.style.transition = '';
            
            requestAnimationFrame(() => {
                container.classList.remove('enter');
            });
            
            this.colorUpdateRequested = false;
        }, 800);
    }
}

// Initialize the scene
const scene = new IconsScene();
