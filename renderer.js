const { ipcRenderer } = require('electron');
const Matter = require('matter-js');

// Module aliases
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const World = Matter.World;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Events = Matter.Events;

// Get screen dimensions
const screenWidth = window.screen.width;
const screenHeight = window.screen.height;
const availHeight = window.screen.availHeight;

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas resolution to match screen exactly (prevents distortion)
canvas.width = screenWidth;
canvas.height = screenHeight;

// Ensure 1:1 pixel ratio (prevents oval shapes)
canvas.style.width = screenWidth + 'px';
canvas.style.height = screenHeight + 'px';

// Create engine
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1;

// Ball properties
const ballRadius = 40;
const ballX = screenWidth / 2;
const ballY = 100;

// Create the red ball
const ball = Bodies.circle(ballX, ballY, ballRadius, {
  restitution: 0.8,
  friction: 0.05,
  frictionAir: 0.01,
  density: 0.004,
  render: {
    fillStyle: '#ff0000'
  }
});

World.add(world, ball);

// Create boundaries
const wallThickness = 50;
// Calculate actual taskbar height dynamically
const taskbarHeight = screenHeight - availHeight;

const ground = Bodies.rectangle(
  screenWidth / 2,
  availHeight + wallThickness / 2,
  screenWidth,
  wallThickness,
  { isStatic: true }
);

const leftWall = Bodies.rectangle(
  -wallThickness / 2,
  screenHeight / 2,
  wallThickness,
  screenHeight,
  { isStatic: true }
);

const rightWall = Bodies.rectangle(
  screenWidth + wallThickness / 2,
  screenHeight / 2,
  wallThickness,
  screenHeight,
  { isStatic: true }
);

const ceiling = Bodies.rectangle(
  screenWidth / 2,
  -wallThickness / 2,
  screenWidth,
  wallThickness,
  { isStatic: true }
);

World.add(world, [ground, leftWall, rightWall, ceiling]);

// Mouse control
const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});

World.add(world, mouseConstraint);

// Track if mouse is over ball
let isOverBall = false;
const clickBuffer = 20; // Extra pixels for easier clicking

function isPointInBall(x, y) {
  const dx = x - ball.position.x;
  const dy = y - ball.position.y;
  return Math.sqrt(dx * dx + dy * dy) <= (ballRadius + clickBuffer);
}

// Mouse event handling for click-through
canvas.addEventListener('mousemove', (e) => {
  const wasOverBall = isOverBall;
  isOverBall = isPointInBall(e.clientX, e.clientY);

  if (isOverBall !== wasOverBall) {
    ipcRenderer.send('set-ignore-mouse-events', !isOverBall, { forward: true });
  }
});

// Start with click-through enabled
ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });

// Render loop with manual engine update for high refresh rate displays
let lastTime = performance.now();

function render(currentTime) {
  const delta = currentTime - lastTime;
  lastTime = currentTime;

  // Update physics engine with actual frame delta (syncs to display refresh rate)
  Engine.update(engine, delta);

  // Safety check: Force ball back if it escapes bounds (keeps original velocity and bounciness)
  if (ball.position.x < ballRadius || ball.position.x > screenWidth - ballRadius ||
      ball.position.y < ballRadius || ball.position.y > availHeight - ballRadius) {
    // Clamp position
    const clampedX = Math.max(ballRadius, Math.min(screenWidth - ballRadius, ball.position.x));
    const clampedY = Math.max(ballRadius, Math.min(availHeight - ballRadius, ball.position.y));
    Body.setPosition(ball, { x: clampedX, y: clampedY });

    // Reverse and dampen velocity as if it bounced off the wall
    const velocityX = ball.position.x < ballRadius || ball.position.x > screenWidth - ballRadius
      ? -ball.velocity.x * 0.8
      : ball.velocity.x;
    const velocityY = ball.position.y < ballRadius || ball.position.y > availHeight - ballRadius
      ? -ball.velocity.y * 0.8
      : ball.velocity.y;
    Body.setVelocity(ball, { x: velocityX, y: velocityY });
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;

  // Main ball with radial gradient
  const mainGradient = ctx.createRadialGradient(
    ball.position.x - ballRadius * 0.3,
    ball.position.y - ballRadius * 0.3,
    ballRadius * 0.1,
    ball.position.x,
    ball.position.y,
    ballRadius
  );
  mainGradient.addColorStop(0, '#ff6b6b');
  mainGradient.addColorStop(0.3, '#ff3333');
  mainGradient.addColorStop(0.7, '#cc0000');
  mainGradient.addColorStop(1, '#8b0000');

  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = mainGradient;
  ctx.fill();

  // Remove shadow for overlays
  ctx.shadowColor = 'transparent';

  // Glossy highlight
  const highlightGradient = ctx.createRadialGradient(
    ball.position.x - ballRadius * 0.35,
    ball.position.y - ballRadius * 0.35,
    0,
    ball.position.x - ballRadius * 0.35,
    ball.position.y - ballRadius * 0.35,
    ballRadius * 0.5
  );
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
  highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.beginPath();
  ctx.arc(
    ball.position.x - ballRadius * 0.35,
    ball.position.y - ballRadius * 0.35,
    ballRadius * 0.5,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = highlightGradient;
  ctx.fill();

  // Secondary shine
  const shineGradient = ctx.createRadialGradient(
    ball.position.x - ballRadius * 0.2,
    ball.position.y - ballRadius * 0.5,
    0,
    ball.position.x - ballRadius * 0.2,
    ball.position.y - ballRadius * 0.5,
    ballRadius * 0.25
  );
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.beginPath();
  ctx.arc(
    ball.position.x - ballRadius * 0.2,
    ball.position.y - ballRadius * 0.5,
    ballRadius * 0.25,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = shineGradient;
  ctx.fill();

  // Rim light (bottom right)
  const rimGradient = ctx.createRadialGradient(
    ball.position.x + ballRadius * 0.4,
    ball.position.y + ballRadius * 0.4,
    ballRadius * 0.3,
    ball.position.x + ballRadius * 0.4,
    ball.position.y + ballRadius * 0.4,
    ballRadius * 0.6
  );
  rimGradient.addColorStop(0, 'rgba(255, 150, 150, 0)');
  rimGradient.addColorStop(0.5, 'rgba(255, 100, 100, 0.3)');
  rimGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = rimGradient;
  ctx.fill();

  ctx.restore();

  requestAnimationFrame(render);
}

// Prevent rendering from stopping when window loses focus
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Keep rendering even when hidden
    requestAnimationFrame(render);
  }
});

// Ensure rendering continues even if page is backgrounded
window.addEventListener('blur', () => {
  requestAnimationFrame(render);
});

// Start render loop
requestAnimationFrame(render);
