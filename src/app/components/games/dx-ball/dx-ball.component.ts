import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Game configuration constants
const GAME_CONFIG = {
  INITIAL_BALL_SPEED: 3,
  PADDLE_SPEED: 8,
  BALL_RADIUS: 10,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 20,
  BRICK_WIDTH: 65,
  BRICK_HEIGHT: 25,
  BRICK_PADDING: 5,
  BRICK_OFFSET_TOP: 30,
  BRICK_OFFSET_LEFT: 30,
  BRICK_ROWS: 5,
  BRICK_COLS: 8,
  LIVES: 3,
  CANVAS_SCALE: 800,
  VIEWPORT_HEIGHT_RATIO: 0.6
};

// Game colors
const GAME_COLORS = {
  PRIMARY: '#64ffda',
  SPECIAL_BRICK: '#ff6b6b',
  OVERLAY: 'rgba(0, 0, 0, 0.3)',
  TEXT: '#64ffda'
};

// Game text
const GAME_TEXT = {
  TITLE: 'DX Ball',
  START_MESSAGE: 'Click to begin',
  GAME_OVER: 'It was cool while it lasted! lets hire Chirag now.',
  RESTART_MESSAGE: 'Click to restart',
  CONTINUE_MESSAGE: 'Click to continue',
  SCORE_PREFIX: 'Score: ',
  LIVES_PREFIX: 'Lives: '
};

// Game state interface
interface GameState {
  score: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  isStarted: boolean;
}

// Ball interface
interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
}

// Paddle interface
interface Paddle {
  x: number;
  width: number;
  height: number;
}

// Brick interface
interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  isSpecial: boolean;
}

@Component({
  selector: 'app-dx-ball',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './dx-ball.component.html',
  styleUrls: ['./dx-ball.component.scss']
})
export class DxBallComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') private canvasRef: ElementRef<HTMLCanvasElement>;
  
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private paddle: Paddle;
  private ball: Ball;
  private bricks: Brick[];
  private animationFrameId: number;
  private scale: number = 1;
  private gameState: GameState = {
    score: 0,
    lives: GAME_CONFIG.LIVES,
    isGameOver: false,
    isPaused: false,
    isStarted: false
  };

  // CJ pattern definition (1: CJ brick, 0: empty, 2: regular brick)
  private readonly CJ_PATTERN = [
    [2, 1, 1, 1, 2, 2, 2, 1, 1, 1, 2],
    [2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2],
    [2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2],
    [2, 1, 2, 2, 2, 2, 1, 2, 1, 2, 2],
    [2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2],
  ];

  private isInViewport = false;
  private observer: IntersectionObserver | null = null;

  constructor(
    private renderer: Renderer2,
    private translate: TranslateService
  ) {
    this.initializeGameObjects();
  }

  ngOnInit(): void {
    // Set up intersection observer to detect when component is in viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this.isInViewport = entry.isIntersecting;
          if (this.isInViewport) {
            this.startGame();
          } else {
            this.stopGame();
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.initGame();
    this.setupEventListeners();
    this.startGame();
    this.observer?.observe(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.stopGame();
    this.observer?.disconnect();
    this.observer = null;
  }

  // Initialize game objects with default values
  private initializeGameObjects(): void {
    this.paddle = {
      x: 0,
      width: GAME_CONFIG.PADDLE_WIDTH,
      height: GAME_CONFIG.PADDLE_HEIGHT
    };

    this.ball = {
      x: 0,
      y: 0,
      radius: GAME_CONFIG.BALL_RADIUS,
      dx: GAME_CONFIG.INITIAL_BALL_SPEED,
      dy: -GAME_CONFIG.INITIAL_BALL_SPEED
    };

    this.bricks = [];
  }

  // Resize canvas and adjust game elements based on container size
  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = window.innerHeight * GAME_CONFIG.VIEWPORT_HEIGHT_RATIO;
    
    this.scale = containerWidth / GAME_CONFIG.CANVAS_SCALE;
    
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;

    this.adjustGameElements();
    this.createBricks(); // Recreate bricks with new scale
  }

  // Adjust game elements based on scale
  private adjustGameElements(): void {
    this.paddle.width = GAME_CONFIG.PADDLE_WIDTH * this.scale;
    this.paddle.height = GAME_CONFIG.PADDLE_HEIGHT * this.scale;
    this.ball.radius = GAME_CONFIG.BALL_RADIUS * this.scale;
    this.ball.dx = GAME_CONFIG.INITIAL_BALL_SPEED * this.scale;
    this.ball.dy = -GAME_CONFIG.INITIAL_BALL_SPEED * this.scale;
  }

  // Initialize game state and create bricks
  private initGame(): void {
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height - 30 * this.scale;
    this.createBricks();
  }

  // Create bricks based on CJ pattern
  private createBricks(): void {
    const { BRICK_WIDTH, BRICK_HEIGHT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT } = GAME_CONFIG;
    
    // Adjust padding for mobile devices
    const isMobile = window.innerWidth <= 768;
    const paddingMultiplier = isMobile ? 1.5 : 1; // 50% more padding on mobile
    
    this.bricks = this.CJ_PATTERN.reduce((acc, row, r) => {
      const rowBricks = row.map((brickType, c) => {
        if (brickType === 0) return null;
        return {
          x: c * (BRICK_WIDTH + BRICK_PADDING * paddingMultiplier) * this.scale + BRICK_OFFSET_LEFT * this.scale,
          y: r * (BRICK_HEIGHT + BRICK_PADDING * paddingMultiplier) * this.scale + BRICK_OFFSET_TOP * this.scale,
          width: BRICK_WIDTH * this.scale,
          height: BRICK_HEIGHT * this.scale,
          active: true,
          isSpecial: brickType === 1
        };
      }).filter(Boolean) as Brick[];
      return [...acc, ...rowBricks];
    }, [] as Brick[]);
  }

  // Setup event listeners for mouse and touch events
  private setupEventListeners(): void {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!this.gameState.isStarted) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const relativeX = (clientX - rect.left) * scaleX;
      const paddleX = Math.max(0, Math.min(relativeX - this.paddle.width / 2, this.canvas.width - this.paddle.width));
      this.paddle.x = paddleX;
    };

    this.renderer.listen(this.canvas, 'mousemove', handleMove);
    this.renderer.listen(this.canvas, 'touchmove', (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    });

    const handleClick = (e: MouseEvent | TouchEvent) => {
      // Check if click is outside canvas
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (clientX < rect.left || clientX > rect.right || 
          clientY < rect.top || clientY > rect.bottom) {
        if (this.gameState.isStarted && !this.gameState.isPaused) {
          this.gameState.isPaused = true;
        }
        return;
      }

      if (!this.gameState.isStarted) {
        this.gameState.isStarted = true;
        return;
      }

      if (this.gameState.isGameOver) {
        this.restartGame();
      } else if (this.gameState.isPaused) {
        this.gameState.isPaused = false;
      }
    };

    this.renderer.listen('document', 'click', handleClick);
    this.renderer.listen('document', 'touchend', handleClick);

    // Add visibility change listener
    this.renderer.listen('document', 'visibilitychange', () => {
      if (document.hidden && this.gameState.isStarted && !this.gameState.isPaused) {
        this.gameState.isPaused = true;
      }
    });
  }

  // Restart game state
  public restartGame(): void {
    this.gameState = {
      score: 0,
      lives: GAME_CONFIG.LIVES,
      isGameOver: false,
      isPaused: false,
      isStarted: true
    };
    this.initGame();
  }

  // Start game loop
  private startGame(): void {
    this.gameLoop();
  }

  // Main game loop
  private gameLoop(): void {
    if (!this.isInViewport) return;

    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  // Update game state
  private update(): void {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    if (!this.gameState.isStarted) return; // Don't update ball position if game hasn't started

    this.updateBallPosition();
    this.handleWallCollisions();
    this.handlePaddleCollision();
    this.handleBrickCollisions();
    this.checkGameOver();
  }

  // Update ball position
  private updateBallPosition(): void {
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
  }

  // Handle ball collisions with walls
  private handleWallCollisions(): void {
    if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
      this.ball.dx = -this.ball.dx;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy = -this.ball.dy;
    }
  }

  // Handle ball collision with paddle
  private handlePaddleCollision(): void {
    if (this.ball.y + this.ball.radius > this.canvas.height - this.paddle.height &&
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width) {
      
      const hitPoint = (this.ball.x - this.paddle.x) / this.paddle.width;
      const speed = this.getBallSpeed();
      
      this.ball.dx = GAME_CONFIG.PADDLE_SPEED * this.scale * (hitPoint - 0.5);
      this.ball.dy = -Math.abs(this.ball.dy);
      
      this.normalizeBallSpeed(speed);
    }
  }

  // Handle ball collisions with bricks
  private handleBrickCollisions(): void {
    this.bricks.forEach(brick => {
      if (!brick.active) return;

      if (this.checkCollision(this.ball, brick)) {
        if (brick.isSpecial) {
          this.handleSpecialBrickCollision(brick);
        } else {
          this.handleRegularBrickCollision(brick);
        }
      }
    });
  }

  // Check collision between ball and brick
  private checkCollision(ball: Ball, brick: Brick): boolean {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    return ballRight > brick.x &&
           ballLeft < brick.x + brick.width &&
           ballBottom > brick.y &&
           ballTop < brick.y + brick.height;
  }

  // Handle collision with special (CJ) brick
  private handleSpecialBrickCollision(brick: Brick): void {
    const speed = this.getBallSpeed();
    const angle = Math.atan2(
      this.ball.y - (brick.y + brick.height / 2),
      this.ball.x - (brick.x + brick.width / 2)
    );

    this.ball.dx = Math.cos(angle) * speed;
    this.ball.dy = Math.sin(angle) * speed;

    // Add slight randomness to prevent infinite loops
    this.ball.dx += (Math.random() - 0.5) * 0.5;
    this.ball.dy += (Math.random() - 0.5) * 0.5;

    this.normalizeBallSpeed(speed);
  }

  // Handle collision with regular brick
  private handleRegularBrickCollision(brick: Brick): void {
    const speed = this.getBallSpeed();
    const ballLeft = this.ball.x - this.ball.radius;
    const ballRight = this.ball.x + this.ball.radius;
    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;

    const hitFromTop = Math.abs(ballBottom - brick.y) < 5;
    const hitFromBottom = Math.abs(ballTop - (brick.y + brick.height)) < 5;
    const hitFromLeft = Math.abs(ballRight - brick.x) < 5;
    const hitFromRight = Math.abs(ballLeft - (brick.x + brick.width)) < 5;

    if (hitFromTop || hitFromBottom) this.ball.dy = -this.ball.dy;
    if (hitFromLeft || hitFromRight) this.ball.dx = -this.ball.dx;

    this.normalizeBallSpeed(speed);
    brick.active = false;
    this.gameState.score++;

    if (this.bricks.every(b => !b.active || b.isSpecial)) {
      this.gameState.isGameOver = true;
    }
  }

  // Get current ball speed
  private getBallSpeed(): number {
    return Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
  }

  // Normalize ball speed to maintain consistent velocity
  private normalizeBallSpeed(speed: number): void {
    const newSpeed = this.getBallSpeed();
    this.ball.dx = (this.ball.dx / newSpeed) * speed;
    this.ball.dy = (this.ball.dy / newSpeed) * speed;
  }

  // Check for game over conditions
  private checkGameOver(): void {
    if (this.ball.y + this.ball.radius > this.canvas.height) {
      this.gameState.lives--;
      if (this.gameState.lives === 0) {
        this.gameState.isGameOver = true;
      } else {
        this.gameState.isPaused = true;
        this.resetBallPosition();
      }
    }
  }

  // Reset ball position after losing a life
  private resetBallPosition(): void {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height - 30 * this.scale;
    this.ball.dx = GAME_CONFIG.INITIAL_BALL_SPEED * this.scale;
    this.ball.dy = -GAME_CONFIG.INITIAL_BALL_SPEED * this.scale;
  }

  // Draw game elements
  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Always draw all game elements
    this.drawBricks();
    this.drawPaddle();
    this.drawBall();
    this.drawScore();
    this.drawLives();
    
    // Draw overlay and messages based on game state
    if (!this.gameState.isStarted) {
      this.drawOverlay();
      this.drawStartMessage();
    } else if (this.gameState.isGameOver) {
      this.drawOverlay();
      this.drawGameOverMessage();
    } else if (this.gameState.isPaused) {
      this.drawOverlay();
      this.drawPauseMessage();
    }
  }

  // Draw overlay
  private drawOverlay(): void {
    this.ctx.fillStyle = GAME_COLORS.OVERLAY;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw start message
  private drawStartMessage(): void {
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = GAME_COLORS.TEXT;
    this.translate.get('dxBall.title').subscribe(text => {
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 60);
    });
    
    this.ctx.font = 'bold 32px Arial';
    this.translate.get('dxBall.startMessage').subscribe(text => {
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 20);
    });
    
    this.ctx.textAlign = 'left';
  }

  // Draw paddle with shadow effect
  private drawPaddle(): void {
    this.ctx.beginPath();
    this.ctx.rect(this.paddle.x, this.canvas.height - this.paddle.height, this.paddle.width, this.paddle.height);
    this.ctx.fillStyle = GAME_COLORS.PRIMARY;
    this.ctx.fill();
    this.ctx.shadowColor = GAME_COLORS.PRIMARY;
    this.ctx.shadowBlur = 10;
    this.ctx.closePath();
  }

  // Draw ball
  private drawBall(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = GAME_COLORS.PRIMARY;
    this.ctx.fill();
    this.ctx.closePath();
  }

  // Draw bricks
  private drawBricks(): void {
    this.bricks.forEach(brick => {
      if (brick.active) {
        this.ctx.beginPath();
        this.ctx.rect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.fillStyle = brick.isSpecial ? GAME_COLORS.SPECIAL_BRICK : GAME_COLORS.PRIMARY;
        this.ctx.fill();
        this.ctx.closePath();
      }
    });
  }

  // Draw score and lives
  private drawScore(): void {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = GAME_COLORS.TEXT;
    this.translate.get('dxBall.score', { score: this.gameState.score }).subscribe(text => {
      this.ctx.fillText(text, 8, 20);
    });
  }

  private drawLives(): void {
    this.translate.get('dxBall.lives', { lives: this.gameState.lives }).subscribe(text => {
      this.ctx.fillText(text, this.canvas.width - 65, 20);
    });
  }

  // Draw game over message
  private drawGameOverMessage(): void {
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = GAME_COLORS.TEXT;
    this.translate.get('dxBall.gameOver').subscribe(text => {
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 60);
    });
    
    this.ctx.font = 'bold 32px Arial';
    this.translate.get('dxBall.restartMessage').subscribe(text => {
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 20);
    });
    
    this.ctx.textAlign = 'left';
  }

  // Draw pause message
  private drawPauseMessage(): void {
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillStyle = GAME_COLORS.TEXT;
    this.translate.get('dxBall.continueMessage').subscribe(text => {
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    });
    this.ctx.textAlign = 'left';
  }

  private stopGame(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
} 