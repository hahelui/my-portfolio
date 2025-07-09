class SnakeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.cellSize = 20;
        this.overlay = null;
        this.container = null;
        this.scoreElement = null;
        this.isPaused = false;
        this.gameOverScreen = null;
        this.highScores = [];
        this.touchStartX = null;
        this.touchStartY = null;
        this.swipeOverlay = null;
        this.gameSpeed = 100;
        this.konamiSequence = [];
        this.konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
        this.isEasterEggActive = false;
        this.foods = []; // Array to store multiple food items for heart shape
        
        // Load high scores from localStorage
        const savedScores = localStorage.getItem('snakeHighScores');
        if (savedScores) {
            this.highScores = JSON.parse(savedScores);
        }
        
        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.touchHandler = this.touchHandler.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.togglePause = this.togglePause.bind(this);
        this.close = this.close.bind(this);
    }

    init() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'snake-game-overlay';
        
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'snake-game-container';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'snake-game-header';
        
        const headerLeft = document.createElement('div');
        headerLeft.className = 'header-left';
        
        const title = document.createElement('h2');
        title.className = 'snake-game-title';
        title.textContent = 'Snake Game';
        
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'icon-button';
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        pauseBtn.addEventListener('click', this.togglePause);
        
        // Create speed control
        const speedControl = document.createElement('div');
        speedControl.className = 'speed-control';
        
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.className = 'speed-slider';
        speedSlider.min = '50';  // Slowest
        speedSlider.max = '200'; // Fastest
        speedSlider.value = this.gameSpeed;
        speedSlider.addEventListener('input', (e) => {
            // Reverse the speed value (slider shows higher = faster)
            this.gameSpeed = 250 - parseInt(e.target.value);
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            }
            // Update slider background with theme-aware colors
            const percentage = ((e.target.value - speedSlider.min) / (speedSlider.max - speedSlider.min)) * 100;
            const isDarkMode = document.documentElement.classList.contains('dark-mode');
            const filledColor = isDarkMode ? 'var(--text-alt)' : '#000000';
            const emptyColor = isDarkMode ? 'var(--bg-alt)' : '#cccccc';
            speedSlider.style.background = `linear-gradient(to right, ${filledColor} 0%, ${filledColor} ${percentage}%, ${emptyColor} ${percentage}%, ${emptyColor} 100%)`;
        });
        
        // Set initial slider background with theme-aware colors
        const initialPercentage = ((speedSlider.value - speedSlider.min) / (speedSlider.max - speedSlider.min)) * 100;
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const filledColor = isDarkMode ? 'var(--text-alt)' : '#000000';
        const emptyColor = isDarkMode ? 'var(--bg-alt)' : '#cccccc';
        speedSlider.style.background = `linear-gradient(to right, ${filledColor} 0%, ${filledColor} ${initialPercentage}%, ${emptyColor} ${initialPercentage}%, ${emptyColor} 100%)`;
        
        speedControl.appendChild(speedSlider);
        
        // Add elements in the correct order
        headerLeft.appendChild(title);
        headerLeft.appendChild(pauseBtn);
        headerLeft.appendChild(speedControl);
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', this.close);
        
        header.appendChild(headerLeft);
        header.appendChild(closeBtn);
        
        // Create score
        this.scoreElement = document.createElement('div');
        this.scoreElement.className = 'snake-game-score';
        this.updateScore();
        
        // Create canvas wrapper for positioning swipe overlay
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'snake-game-canvas';
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        
        // Set canvas size based on screen size
        const updateCanvasSize = () => {
            const isMobile = window.innerWidth <= 768;
            const containerWidth = this.container.clientWidth - 40; // Account for container padding
            const size = Math.min(containerWidth, isMobile ? containerWidth : window.innerHeight * 0.5);
            const gridSize = Math.floor(size / this.cellSize) * this.cellSize;
            
            this.canvas.width = gridSize;
            this.canvas.height = gridSize;
            
            // Force immediate redraw
            this.draw();
        };

        // Initial size
        setTimeout(updateCanvasSize, 0);
        
        // Update size on resize
        window.addEventListener('resize', updateCanvasSize);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Create swipe overlay
        this.swipeOverlay = document.createElement('div');
        this.swipeOverlay.className = 'swipe-overlay';
        
        // Add canvas and swipe overlay to wrapper
        canvasWrapper.appendChild(this.canvas);
        canvasWrapper.appendChild(this.swipeOverlay);
        
        // Create touch controls
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        
        const directions = [
            { icon: 'fa-chevron-up', dir: 'up', grid: '1/2/2/3' },
            { icon: 'fa-chevron-left', dir: 'left', grid: '2/1/3/2' },
            { icon: 'fa-chevron-right', dir: 'right', grid: '2/3/3/4' },
            { icon: 'fa-chevron-down', dir: 'down', grid: '3/2/4/3' }
        ];
        
        directions.forEach(({ icon, dir, grid }) => {
            const btn = document.createElement('button');
            btn.className = 'touch-button';
            btn.innerHTML = `<i class="fas ${icon}"></i>`;
            btn.style.gridArea = grid;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchHandler(dir);
            });
            touchControls.appendChild(btn);
        });
        
        // Assemble container
        this.container.appendChild(header);
        this.container.appendChild(this.scoreElement);
        this.container.appendChild(canvasWrapper);
        this.container.appendChild(touchControls);
        
        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);
        
        // Add animation class after a small delay
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
        });
        
        // Initialize game state
        this.initGame();
        
        // Add event listeners
        document.addEventListener('keydown', this.handleKeydown);
        this.setupSwipeListeners();
    }

    initGame() {
        // Initialize snake in the middle
        const centerX = Math.floor(this.canvas.width / (2 * this.cellSize));
        const centerY = Math.floor(this.canvas.height / (2 * this.cellSize));
        
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.updateScore();
        this.generateFood();
        
        // Start game loop with current speed
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }

    generateFood() {
        const maxX = Math.floor(this.canvas.width / this.cellSize);
        const maxY = Math.floor(this.canvas.height / this.cellSize);
        
        do {
            this.food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
        } while (this.snake.some(segment => 
            segment.x === this.food.x && segment.y === this.food.y));
    }

    generateHeartFoods() {
        const centerX = Math.floor(this.canvas.width / (2 * this.cellSize));
        const centerY = Math.floor(this.canvas.height / (2 * this.cellSize));
        
        // Clear existing foods
        this.foods = [];
        
        // Heart shape coordinates (relative to center)
        const heartPoints = [
            [-3, -4], [-2, -4], [2, -4], [3, -4],
            [-4, -3], [-1, -3], [1, -3], [4, -3],
            [-5, -2], [0, -2], [5, -2],
            [-5, -1], [5, -1],
            [-4, 0], [4, 0],
            [-4, 1], [4, 1],
            [-3, 2], [3, 2],
            [-2, 3], [2, 3],
            [-1, 4], [1, 4],
            [0, 5]
        ];
        
        // Add food for each heart point
        heartPoints.forEach(([xOffset, yOffset]) => {
            this.foods.push({
                x: centerX + xOffset,
                y: centerY + yOffset
            });
        });
    }

    activateEasterEgg() {
        console.log('Activating easter egg');
        this.isEasterEggActive = true;
        this.isPaused = true;
        this.score = 0;
        this.updateScore();
        this.generateHeartFoods();
        this.draw(); // Redraw to show heart
    }

    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.isEasterEggActive ? 
                `I Love Fatima: ${this.score}` : 
                `Score: ${this.score}`;
        }
    }

    update() {
        if (this.isPaused) return;

        // Update snake position
        const head = { x: this.snake[0].x, y: this.snake[0].y };
        
        this.direction = this.nextDirection;
        
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Handle wall teleportation
        const maxX = Math.floor(this.canvas.width / this.cellSize);
        const maxY = Math.floor(this.canvas.height / this.cellSize);
        
        if (head.x < 0) head.x = maxX - 1;
        if (head.x >= maxX) head.x = 0;
        if (head.y < 0) head.y = maxY - 1;
        if (head.y >= maxY) head.y = 0;
        
        // Check for self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver(false);
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if food was eaten
        if (this.isEasterEggActive) {
            // Check collision with any heart food
            const foodEaten = this.foods.findIndex(food => 
                food.x === head.x && food.y === head.y);
            
            if (foodEaten !== -1) {
                this.score += 1000;
                this.updateScore();
                this.foods.splice(foodEaten, 1);
                // If all heart foods are eaten, trigger win condition
                if (this.foods.length === 0) {
                    this.gameOver(true);
                    return;
                }
            } else {
                this.snake.pop();
            }
        } else {
            // Normal game food check
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.updateScore();
                this.generateFood();
            } else {
                this.snake.pop();
            }
        }
        
        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-alt-2').trim();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get snake body color based on theme
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const snakeBodyColor = isDarkMode ? 
            '#cccccc' : // slightly grey for dark mode
            getComputedStyle(document.documentElement).getPropertyValue('--bg-alt').trim();
            
        // Get snake head color (slightly different from body)
        const snakeHeadColor = isDarkMode ? '#ffffff' : '#000000';
            
        // Draw snake body
        this.snake.slice(1).forEach(segment => {
            this.ctx.fillStyle = snakeBodyColor;
            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });
        
        // Draw snake head with different color
        this.ctx.fillStyle = snakeHeadColor;
        this.ctx.fillRect(
            this.snake[0].x * this.cellSize,
            this.snake[0].y * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
        );
        
        // Draw food(s)
        this.ctx.fillStyle = '#ff0000';
        if (this.isEasterEggActive) {
            // Draw all foods in heart shape
            this.foods.forEach(food => {
                this.ctx.fillRect(
                    food.x * this.cellSize,
                    food.y * this.cellSize,
                    this.cellSize - 1,
                    this.cellSize - 1
                );
            });
        } else {
            // Draw single food
            this.ctx.fillRect(
                this.food.x * this.cellSize,
                this.food.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        }
    }

    handleKeydown(e) {
        const key = e.key.toLowerCase();
        
        // Prevent default for arrow keys
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            e.preventDefault();
        }
        
        // Map arrow keys to directions
        let direction = null;
        switch (key) {
            case 'arrowup':
            case 'w':
                direction = 'up';
                if (this.direction !== 'down') {
                    this.nextDirection = 'up';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'arrowdown':
            case 's':
                direction = 'down';
                if (this.direction !== 'up') {
                    this.nextDirection = 'down';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'arrowleft':
            case 'a':
                direction = 'left';
                if (this.direction !== 'right') {
                    this.nextDirection = 'left';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'arrowright':
            case 'd':
                direction = 'right';
                if (this.direction !== 'left') {
                    this.nextDirection = 'right';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case ' ':
                this.togglePause();
                break;
        }
        
        // Check for Konami code
        if (direction) {
            this.konamiSequence.push(direction);
            if (this.konamiSequence.length > this.konamiCode.length) {
                this.konamiSequence.shift();
            }
            
            // Check if sequence matches
            if (this.konamiSequence.length === this.konamiCode.length &&
                this.konamiSequence.every((dir, i) => dir === this.konamiCode[i])) {
                this.activateEasterEgg();
                this.konamiSequence = []; // Reset sequence
            }
        }
    }
    
    touchHandler(direction) {
        // Handle touch controls for snake direction
        switch (direction) {
            case 'up':
                if (this.direction !== 'down') {
                    this.nextDirection = 'up';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'down':
                if (this.direction !== 'up') {
                    this.nextDirection = 'down';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'left':
                if (this.direction !== 'right') {
                    this.nextDirection = 'left';
                    if (this.isPaused) this.togglePause();
                }
                break;
            case 'right':
                if (this.direction !== 'left') {
                    this.nextDirection = 'right';
                    if (this.isPaused) this.togglePause();
                }
                break;
        }
        
        // Check for Konami code with touch/swipe
        this.konamiSequence.push(direction);
        if (this.konamiSequence.length > this.konamiCode.length) {
            this.konamiSequence.shift();
        }
        
        // Check if sequence matches
        if (this.konamiSequence.length === this.konamiCode.length &&
            this.konamiSequence.every((dir, i) => dir === this.konamiCode[i])) {
            this.activateEasterEgg();
            this.konamiSequence = []; // Reset sequence
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = this.container.querySelector('.icon-button i');
        pauseBtn.className = this.isPaused ? 'fas fa-play' : 'fas fa-pause';
    }

    updateHighScores() {
        this.highScores.push(this.score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5); // Keep top 5 scores
        localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
    }

    gameOver(isWin = false) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        this.updateHighScores();
        this.showGameOver(isWin);
    }

    showGameOver(isWin = false) {
        let message, scoreDisplay;
        
        if (this.isEasterEggActive) {
            if (isWin) {  // Won by collecting all heart food
                message = "I won Fatima's heart";
                scoreDisplay = "❤️";
                // Reset to normal mode
                this.isEasterEggActive = false;
            } else {  // Lost during easter egg mode
                message = "You Don't Love Fatima enough";
                scoreDisplay = "💔";
            }
        } else {
            message = "Game Over";
            scoreDisplay = `Score: ${this.score}`;
        }

        if (!this.gameOverScreen) {
            this.gameOverScreen = document.createElement('div');
            this.gameOverScreen.className = 'game-over-screen';
            
            const title = document.createElement('h2');
            title.className = 'game-over-title';
            title.textContent = message;
            
            const score = document.createElement('p');
            score.className = 'game-over-score';
            score.textContent = scoreDisplay;
            
            const buttons = document.createElement('div');
            buttons.className = 'game-over-buttons';
            
            const restartBtn = document.createElement('button');
            restartBtn.className = 'game-over-button';
            restartBtn.innerHTML = '<i class="fas fa-redo"></i> Play Again';
            restartBtn.onclick = () => this.restart();
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'game-over-button';
            closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
            closeBtn.onclick = () => this.close();
            
            buttons.appendChild(restartBtn);
            buttons.appendChild(closeBtn);
            
            this.gameOverScreen.appendChild(title);
            this.gameOverScreen.appendChild(score);
            this.gameOverScreen.appendChild(buttons);
            
            // Add to canvas wrapper
            const canvasWrapper = this.canvas.parentElement;
            canvasWrapper.appendChild(this.gameOverScreen);
        } else {
            // Update title and score
            const titleElement = this.gameOverScreen.querySelector('.game-over-title');
            const scoreElement = this.gameOverScreen.querySelector('.game-over-score');
            titleElement.textContent = message;
            scoreElement.textContent = scoreDisplay;
            this.gameOverScreen.style.display = 'flex';
        }
    }

    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none';
        }
    }

    restart() {
        this.hideGameOver();
        this.initGame();
    }

    close() {
        // Clean up
        clearInterval(this.gameLoop);
        document.removeEventListener('keydown', this.handleKeydown);
        this.removeSwipeListeners();
        
        // Animate out
        this.overlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(this.overlay);
        }, 300);
    }

    setupSwipeListeners() {
        this.swipeOverlay.addEventListener('touchstart', this.handleTouchStart);
        this.swipeOverlay.addEventListener('touchmove', this.handleTouchMove);
        this.swipeOverlay.addEventListener('touchend', this.handleTouchEnd);
    }

    removeSwipeListeners() {
        this.swipeOverlay.removeEventListener('touchstart', this.handleTouchStart);
        this.swipeOverlay.removeEventListener('touchmove', this.handleTouchMove);
        this.swipeOverlay.removeEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // Minimum swipe distance
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (deltaX < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (deltaY < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
            
            // Reset touch start position to allow for continuous swipes
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }

    handleTouchEnd() {
        this.touchStartX = null;
        this.touchStartY = null;
    }
}

// Export for use in other modules
export default SnakeGame;
