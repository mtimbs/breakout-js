let customFont = new FontFace("CustomFont", "url(assets/QuinqueFive.woff)");

const canvas = document.getElementById("app");

const NATIVE_WIDTH = 400;
const NATIVE_HEIGHT = 300;
const NATIVE_RATIO = NATIVE_WIDTH / NATIVE_HEIGHT;

if (window.innerWidth < window.innerHeight * NATIVE_RATIO) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerWidth / NATIVE_RATIO;
} else {
  canvas.width = window.innerHeight * NATIVE_RATIO;
  canvas.height = window.innerHeight;
}

const SCALING_FACTOR = canvas.width / NATIVE_WIDTH;
const TOP_PADDING = canvas.height > 650 ? 50 : 0.075 * canvas.height;
const INITIAL_DX = 0.01 * canvas.width;
const INITIAL_DY = 0.0125 * canvas.height;

const BALL_RADIUS = 0.0075 * canvas.width;

const PADDLE_HEIGHT = 0.03 * NATIVE_HEIGHT * SCALING_FACTOR;
const PADDLE_WIDTH = 0.125 * canvas.width;

const BRICK_ROW_COUNT = 2;
const BRICK_COLUMN_COUNT = 15;
const BRICK_PADDING = 0.0015 * canvas.width;
const BRICK_OFFSET_TOP = 4 * BALL_RADIUS;
const BRICK_OFFSET_SIDE = 2 * BALL_RADIUS;
const room_for_bricks =
  canvas.width -
  2 * BRICK_OFFSET_SIDE -
  (BRICK_COLUMN_COUNT - 1) * BRICK_PADDING;

const BRICK_WIDTH = room_for_bricks / BRICK_COLUMN_COUNT;

const BRICK_HEIGHT = BRICK_WIDTH / 3;

// Load assets
const image = new Image();
image.src = "assets/Breakout_Tile_Free.png";
const SPRITE_MAP = {
  ball: [1403, 652, 64, 64],
  bricks: [
    [772, 520, 384, 128], // border
    [772, 260, 384, 128], // Red
    [386, 390, 384, 128], // Yellow
  ],
  paddle: [
    [1158, 462, 243, 64],
    [1158, 462, 243, 64],
    [1158, 462, 243, 64],
    [1158, 528, 243, 64],
    [1158, 528, 243, 64],
    [1158, 594, 243, 64],
    [1158, 594, 243, 64],
    [1158, 594, 243, 64],
  ],
  lives: [1637, 652, 64, 58],
  prizes: [
    [1403, 66, 243, 64], //  +50 points
    [1084, 846, 243, 64], //  +100 points
    [1403, 0, 243, 64], //  +250 points
    [1329, 1924, 243, 64], //  +500 points
    [1158, 264, 243, 64], //  grow paddle
    [1158, 198, 243, 64], //  shrink paddle
    [594, 910, 243, 64], //  3-ball
    [349, 910, 243, 64], //  fast
    [1158, 66, 243, 64], //  slow
  ],
};

const ctx = canvas.getContext("2d");

// Ball
let x = canvas.width * 0.5;
let y = canvas.height - 2 * BALL_RADIUS - 0.5 * PADDLE_HEIGHT;

// Ball Rate of Change
let dx = INITIAL_DX;
let dy = -INITIAL_DY;

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
  const rightEdge = x + BALL_RADIUS;
  const leftEdge = x - BALL_RADIUS;

  if (rightEdge + dx > canvas.width || leftEdge + dx < 0) {
    dx = -dx;
  }

  const bottomEdge = y + BALL_RADIUS;
  const topEdge = y - BALL_RADIUS;

  if (topEdge + dy < TOP_PADDING + BORDER_BRICK_HEIGHT) {
    dy = -dy;
  } else if (bottomEdge + dy > canvas.height - PADDLE_HEIGHT) {
    if (rightEdge + dx > paddle_x && leftEdge + dx < paddle_x + PADDLE_WIDTH) {
      dy = -dy;
    }
  }

  x += dx;
  y += dy;
}

// Paddle
// Paddle starting position

let paddle_x = (canvas.width - PADDLE_WIDTH) * 0.5;
let rightPressed = false;
let leftPressed = false;

let p = 0;
function drawPaddle() {
  const [sx, sy, sw, sh] = SPRITE_MAP.paddle[p % 8];
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
  p++;
}

let paddle_distance_per_frame = 0.25 * PADDLE_WIDTH;
function movePaddle() {
  if (rightPressed) {
    paddle_x = Math.min(
      paddle_x + paddle_distance_per_frame,
      canvas.width - PADDLE_WIDTH,
    );
  } else if (leftPressed) {
    paddle_x = Math.max(paddle_x - paddle_distance_per_frame, 0);
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
      const brick_y =
        r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP + TOP_PADDING;
      bricks[c][r].x = brick_x;
      bricks[c][r].y = brick_y;

      const [sx, sy, sw, sh] = SPRITE_MAP.bricks[r + 1];
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

let remaining_bricks = BRICK_ROW_COUNT * BRICK_COLUMN_COUNT;
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
        score += 10 * (BRICK_ROW_COUNT - r);
        remaining_bricks--;
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
        score += 10 * (BRICK_ROW_COUNT - r);
        remaining_bricks--;
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
        score += 10 * (BRICK_ROW_COUNT - r);
        remaining_bricks--;
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
        score += 10 * (BRICK_ROW_COUNT - r);
        remaining_bricks--;
        return;
      }
    }
  }
}

// Score
let score = 0;

const FONT_SIZE = 0.5 * TOP_PADDING;
function drawScore() {
  ctx.font = `${FONT_SIZE}px CustomFont`;
  ctx.fillStyle = "#EEE";
  ctx.fillText(
    String(score).padStart(5, "0"),
    BRICK_OFFSET_SIDE,
    1.25 * FONT_SIZE,
  );
}

// Lives
let lives = 3;
const HEART_WIDTH = 0.5 * TOP_PADDING;
const HEART_PADDING = 0.25 * HEART_WIDTH;

function drawLives() {
  const [sx, sy, sw, sh] = SPRITE_MAP.lives;
  for (let i = lives; i > 0; i--) {
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      canvas.width - i * (HEART_WIDTH + HEART_PADDING) - BRICK_OFFSET_SIDE,
      0.2 * TOP_PADDING,
      HEART_WIDTH,
      HEART_WIDTH,
    );
  }
}

function checkLossOfLife() {
  const leftEdge = x - BALL_RADIUS;
  const rightEdge = x + BALL_RADIUS;
  const topEdge = y + BALL_RADIUS;
  if (
    topEdge > canvas.height &&
    (rightEdge < paddle_x || leftEdge > paddle_x + PADDLE_WIDTH)
  ) {
    lives -= 1;
    // little glitch animation for feedback
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // reset ball to fire automatically
    x = canvas.width * 0.5;
    y = canvas.height - 2 * BALL_RADIUS - 0.5 * PADDLE_HEIGHT;
    dy = -INITIAL_DY;

    if (lives === 0) {
      alert("GAME OVER");
      document.location.reload();
    }
  }
}

function checkLevelWon() {
  // WIN when all bricks are gons
  if (remaining_bricks == 0) {
    alert("YOU WIN, CONGRATULATIONS!");
    document.location.reload();
  }
}

const BORDER_BRICK_WIDTH = canvas.width * 0.05;
const BORDER_BRICK_HEIGHT = 0.25 * BORDER_BRICK_WIDTH;
function drawBorderBricks() {
  const [sx, sy, sw, sh] = SPRITE_MAP.bricks[0];
  for (let i = 0; i < 20; i++) {
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      i * canvas.width * 0.05,
      TOP_PADDING,
      BORDER_BRICK_WIDTH,
      BORDER_BRICK_HEIGHT,
    );
  }
}

function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBorderBricks();
  drawBricks();
  drawPaddle();
  drawBall();
  movePaddle();
  collisionDetection();
  moveBall();
  drawScore();
  drawLives();
  checkLossOfLife();
  checkLevelWon();
}

function renderMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const items = [
    [8 * SCALING_FACTOR, "Instructions"],
    [8 * SCALING_FACTOR, ""],
    [4 * SCALING_FACTOR, "> [Space] to start/stop the ball."],
    [4 * SCALING_FACTOR, "> Destroy all the bricks to get to the next level."],
    [
      4 * SCALING_FACTOR,
      "> Bricks will drop powerups randomly which will help you",
    ],
  ];
  ctx.fillStyle = "#EEE";

  for (const [i, [font_size, text]] of items.entries()) {
    console.log({ i, font_size, text });
    ctx.font = `${font_size}px CustomFont`;
    ctx.fillText(
      text,
      canvas.width * 0.5 - text.length * font_size * 0.5,
      canvas.height * 0.5 +
        items.length * 0.5 -
        16 * SCALING_FACTOR * (items.length - i),
    );
  }

  text = "* START GAME *";
  const font_size = 10 * SCALING_FACTOR;
  ctx.fillStyle = "#32CD32";
  ctx.font = `${font_size}px CustomFont`;
  ctx.fillText(
    text,
    canvas.width * 0.5 - text.length * font_size * 0.5,
    canvas.height * 0.5 + 6 * SCALING_FACTOR * items.length * 0.5 + font_size,
  );
}

let frame = undefined;
let display = "Menu";
function start() {
  if (display == "Menu") {
    renderMenu();
  } else if (display == "Game") {
    renderGame();
  }
  frame = requestAnimationFrame(start);
}

function pauseGame() {
  cancelAnimationFrame(frame);
  frame = undefined;
}

// Initialise canvas
customFont.load().then((font) => {
  document.fonts.add(font);
  start();
  pauseGame();
});

function keyDownHandler(e) {
  if (display == "Game") {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = true;
    } else if (e.key === " ") {
      if (frame) {
        pauseGame();
      } else {
        start();
      }
    }
  }
}

function displayMenu() {
  display = "Menu";
  start();
  pauseGame();
}

function displayGame() {
  display = "Game";
  start();
  pauseGame();
}

function keyUpHandler(e) {
  if (display == "Game") {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = false;
    } else if (e.key === "Escape") {
      pauseGame();
      displayMenu();
    }
  } else if (display == "Menu") {
    if (e.key === "Enter") {
      displayGame();
    }
  }
}
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
