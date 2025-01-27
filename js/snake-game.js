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
        
        headerLeft.appendChild(title);
        headerLeft.appendChild(pauseBtn);
        
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
            { icon: 'fa-chevron-down', dir: 'down', grid: '2/2/3/3' },
            { icon: 'fa-chevron-right', dir: 'right', grid: '2/3/3/4' }
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
        
        // Start game loop
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 100);
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
            this.gameOver();
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if food was eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
        } else {
            this.snake.pop();
        }
        
        this.draw();
    }

    checkCollision(head) {
        // Only check for self collision since we have wall teleportation
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-alt-2').trim();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        this.ctx.fillStyle = isDarkMode ? 
            getComputedStyle(document.documentElement).getPropertyValue('--text-alt').trim() :
            getComputedStyle(document.documentElement).getPropertyValue('--bg-alt').trim();
            
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });
        
        // Draw food
        const textColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--text').trim();
        this.ctx.fillStyle = textColor;
        this.ctx.fillRect(
            this.food.x * this.cellSize,
            this.food.y * this.cellSize,
            this.cellSize - 1,
            this.cellSize - 1
        );
    }

    handleKeydown(e) {
        const key = e.key.toLowerCase();
        
        // Prevent default for arrow keys
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            e.preventDefault();
        }
        
        switch (key) {
            case 'arrowup':
            case 'w':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'arrowdown':
            case 's':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'arrowleft':
            case 'a':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'arrowright':
            case 'd':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
            case ' ':
                this.togglePause();
                break;
        }
    }

    touchHandler(direction) {
        switch (direction) {
            case 'up':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'down':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'left':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'right':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = this.container.querySelector('.icon-button i');
        pauseBtn.className = this.isPaused ? 'fas fa-play' : 'fas fa-pause';
    }

    updateScore() {
        this.scoreElement.textContent = `Score: ${this.score}`;
    }

    updateHighScores() {
        this.highScores.push(this.score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 5); // Keep top 5 scores
        localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.updateHighScores();
        this.showGameOver();
    }

    showGameOver() {
        // Create game over screen if it doesn't exist
        if (!this.gameOverScreen) {
            this.gameOverScreen = document.createElement('div');
            this.gameOverScreen.className = 'game-over-screen';
            
            const title = document.createElement('h2');
            title.className = 'game-over-title';
            title.textContent = 'Game Over!';
            
            const score = document.createElement('p');
            score.className = 'game-over-score';
            score.textContent = `Score: ${this.score}`;
            
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
            // Update score
            const scoreElement = this.gameOverScreen.querySelector('.game-over-score');
            scoreElement.textContent = `Score: ${this.score}`;
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
