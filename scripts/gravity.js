let mass = 1;
let pos;
let vel;
let acc;
let gravity = 9.81;
let scale = 100; // 1 meter = 100 pixels

function setup() {
    let cnv = createCanvas(720, 480);
    cnv.id('gravityCanvas');
    pos = createVector(width / 2, 50); // Start near the top
    vel = createVector(0, 0);
    acc = createVector(0, 0);
    background(0);
}

function draw() {
    background(0);
    fill(255);
    noStroke();
    // Draw the mass
    ellipse(pos.x, pos.y, 40, 40);

    // Calculate force (downward)
    let force = mass * gravity; // F = m * g
    acc.y = force / mass;      // a = F / m (just gravity)

    // Update velocity and position
    vel.y += acc.y * (1/60);  // 60 FPS, dt = 1/60 s
    pos.y += vel.y * (1/60) * scale; // scale meters to pixels

    // Stop at the bottom
    if (pos.y > height - 20) {
        pos.y = height - 20;
        vel.y = 0;
    }
}

function initialize() {

}

