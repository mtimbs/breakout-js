const canvas = document.getElementById("app");
if (window.innerWidth < 2 * window.innerHeight) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerWidth / 2;
} else {
  canvas.width = window.innerHeight * 2;
  canvas.height = window.innerHeight;
}
const ctx = canvas.getContext("2d");

const NATIVE_WIDTH = 1024;
const NATIVE_HEIGHT = 720;
const SCALING_FACTOR = canvas.width / NATIVE_WIDTH;

// Load assets
const image = new Image();
image.src = "assets/Breakout_Tile_Free.png";

const PADDLE_HEIGHT = 15 * SCALING_FACTOR;
const PADDLE_WIDTH = 90 * SCALING_FACTOR;

// Ball
const BALL_RADIUS = 8 * SCALING_FACTOR;
let x = canvas.width / 2;
let y = canvas.height - 2 * BALL_RADIUS - 0.5 * PADDLE_HEIGHT;

// Ball Rate of Change
const INITIAL_DX = 5 * SCALING_FACTOR;
const INITIAL_DY = 5 * SCALING_FACTOR;
let dx = INITIAL_DX;
let dy = -INITIAL_DY;

const SPRITE_MAP = {
  ball: [1403, 652, 64, 64],
  bricks: [
    [772, 260, 384, 128],
    [386, 390, 384, 128],
  ],
  paddle: [
    [1158, 462, 243, 64],
    [1158, 528, 243, 64],
    [1158, 594, 243, 64],
  ],
};

const BRICK_ROW_COUNT = 2;
const BRICK_COLUMN_COUNT = 10;
const BRICK_PADDING = 2 * SCALING_FACTOR;
const BRICK_OFFSET_TOP = 2 * BALL_RADIUS * SCALING_FACTOR;
const BRICK_OFFSET_SIDE = 15 * SCALING_FACTOR;
const room_for_bricks =
  SCALING_FACTOR * NATIVE_WIDTH -
  2 * BRICK_OFFSET_SIDE -
  (BRICK_COLUMN_COUNT - 1) * BRICK_PADDING;

const BRICK_WIDTH = room_for_bricks / BRICK_COLUMN_COUNT;

const BRICK_HEIGHT = BRICK_WIDTH / 4;

function drawBall() {
  const [sx, sy, sw, sh] = SPRITE_MAP.ball;
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x - BALL_RADIUS,
    y - BALL_RADIUS,
    BALL_RADIUS * 2,
    BALL_RADIUS * 2,
  );
}

function moveBall() {
  if (x + dx > canvas.width - BALL_RADIUS || x + dx < BALL_RADIUS) {
    dx = -dx;
  }

  if (y + dy < BALL_RADIUS) {
    dy = -dy;
  } else if (y + dy > canvas.height - BALL_RADIUS - PADDLE_HEIGHT) {
    const leftEdge = x - BALL_RADIUS;
    const rightEdge = x + BALL_RADIUS;
    if (rightEdge > paddle_x && leftEdge < paddle_x + PADDLE_WIDTH) {
      dy = -dy;
    }
  }

  x += dx;
  y += dy;
}

// Paddle
// Paddle starting position

let paddle_x = (canvas.width - PADDLE_WIDTH) / 2.0;
let rightPressed = false;
let leftPressed = false;

let f = 0;
let p = 0;
function drawPaddle() {
  const [sx, sy, sw, sh] = SPRITE_MAP.paddle[p % 3];
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    paddle_x,
    canvas.height - PADDLE_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
  );
  f++;
  if (f % 5 == 0) {
    f = 0;
    p++;
  }
}

const PADDLE_DISTANCE_PER_FRAME = 20 * SCALING_FACTOR;
function movePaddle() {
  if (rightPressed) {
    paddle_x = Math.min(
      paddle_x + PADDLE_DISTANCE_PER_FRAME,
      canvas.width - PADDLE_WIDTH,
    );
  } else if (leftPressed) {
    paddle_x = Math.max(paddle_x - PADDLE_DISTANCE_PER_FRAME, 0);
  }
}

// Bricks

const bricks = [];
for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
  bricks[c] = [];
  for (let r = 0; r < BRICK_ROW_COUNT; r++) {
    bricks[c][r] = { x: 0, y: 0, destroyed: false };
  }
}

function drawBricks() {
  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    for (let r = 0; r < BRICK_ROW_COUNT; r++) {
      if (bricks[c][r].destroyed) {
        continue;
      }
      const brick_x = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_SIDE;
      const brick_y = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
      bricks[c][r].x = brick_x;
      bricks[c][r].y = brick_y;

      const [sx, sy, sw, sh] = SPRITE_MAP.bricks[r];
      ctx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        brick_x,
        brick_y,
        BRICK_WIDTH,
        BRICK_HEIGHT,
      );
    }
  }
}

function collisionDetection() {
  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    for (let r = 0; r < BRICK_ROW_COUNT; r++) {
      const b = bricks[c][r];
      if (b.destroyed) {
        continue;
      }
      const top_ball = y - BALL_RADIUS;
      const bottom_ball = y + BALL_RADIUS;
      const left_ball = x - BALL_RADIUS;
      const right_ball = x + BALL_RADIUS;
      const top_brick = b.y;
      const bottom_brick = b.y + BRICK_HEIGHT;
      const left_brick = b.x;
      const right_brick = b.x + BRICK_WIDTH;

      if (
        // top of ball hits from below
        right_ball > left_brick &&
        left_ball < right_brick &&
        top_ball < bottom_brick &&
        bottom_ball > bottom_brick
      ) {
        dy = -dy;
        b.destroyed = true;
        score++;
        return;
      }
      if (
        // bottom ball hits from above
        right_ball > left_brick &&
        left_ball < right_brick &&
        top_ball > top_brick &&
        bottom_ball < top_brick
      ) {
        dy = -dy;
        b.destroyed = true;
        score++;
        return;
      }
      if (
        // left of ball hits right
        right_ball > left_brick &&
        left_ball < left_brick &&
        top_ball < bottom_brick &&
        bottom_ball > top_brick
      ) {
        dx = -dx;
        b.destroyed = true;
        score++;
        return;
      }
      if (
        // right of ball hits left
        right_ball > right_brick &&
        left_ball < right_brick &&
        top_ball < bottom_brick &&
        bottom_ball > top_brick
      ) {
        dx = -dx;
        b.destroyed = true;
        score++;
        return;
      }
    }
  }
}

// Score
let score = 0;

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText(`Score: ${score}`, 8, 20);
}

// Lives
let lives = 3;
function drawLives() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText(`Lives: ${lives}`, canvas.width - 65, 20);
}

function checkGameOver() {
  // Lose if ball hits bottom of screen not on paddle
  if (lives === 0) {
    alert("GAME OVER");
    document.location.reload();
  }

  const leftEdge = x - BALL_RADIUS;
  const rightEdge = x + BALL_RADIUS;
  if (
    y + dy > canvas.height - BALL_RADIUS &&
    (rightEdge < paddle_x || leftEdge > paddle_x + PADDLE_WIDTH)
  ) {
    lives -= 1;
    x = canvas.width / 2;
    y = canvas.height - 2 * BALL_RADIUS - 0.5 * PADDLE_HEIGHT;
    dy = -INITIAL_DY;
  }

  // WIN when all bricks are gons
  if (score === BRICK_ROW_COUNT * BRICK_COLUMN_COUNT) {
    alert("YOU WIN, CONGRATULATIONS!");
    document.location.reload();
  }
}

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  } else if (e.key === " ") {
    gameLoop();
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawPaddle();
  drawBall();
  movePaddle();
  collisionDetection();
  moveBall();
  drawScore();
  drawLives();
  checkGameOver();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  requestAnimationFrame(gameLoop);
}

// Initialise canvas
drawBricks();
drawPaddle();
drawBall();
drawScore();
drawLives();
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
