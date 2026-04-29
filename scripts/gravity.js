let mass1 = 10;
let mass2 = 20;
let pos1, pos2, acc, vel, force, distance;
let camOffset;

function setup() {
    const canvas = createCanvas(1000, 400);
    canvas.id('gravityCanvas');

    pos1      = createVector(width / 2, height / 2);
    pos2      = createVector(width / 2 + 100, height / 2);
    vel       = createVector(0, 0);
    camOffset = createVector(width / 2, height / 2);
}

function draw() {
    background(0);

    // pan only when a ball leaves the visible area
    let margin = 40;
    let left   = camOffset.x - width  / 2 + margin;
    let right  = camOffset.x + width  / 2 - margin;
    let top    = camOffset.y - height / 2 + margin;
    let bottom = camOffset.y + height / 2 - margin;

    let outOfBounds =
        pos1.x < left || pos1.x > right || pos1.y < top || pos1.y > bottom ||
        pos2.x < left || pos2.x > right || pos2.y < top || pos2.y > bottom;

    if (outOfBounds) {
        let target = p5.Vector.add(pos1, pos2).mult(0.5);
        camOffset.x = lerp(camOffset.x, target.x, 0.05);
        camOffset.y = lerp(camOffset.y, target.y, 0.05);
    }

    push();
    translate(width / 2 - camOffset.x, height / 2 - camOffset.y);

    fill(255, 0, 0);
    ellipse(pos1.x, pos1.y, 20, 20);
    fill(0, 0, 255);
    ellipse(pos2.x, pos2.y, 20, 20);

    pop();

    // physics
    distance = p5.Vector.dist(pos1, pos2);
    if (distance < 10) distance = 10;
    force = (mass1 * mass2) / (distance * distance);
    acc   = p5.Vector.sub(pos2, pos1).setMag(force / mass1);
    vel.add(acc);
    pos1.add(vel);
    pos2.sub(vel);
}

function mousePressed() {
    pos1.x = mouseX;
    pos1.y = mouseY;
    vel.set(0, 0);
}

function resetSimulation() {
    pos1      = createVector(width / 2, height / 2);
    pos2      = createVector(width / 2 + 100, height / 2);
    vel       = createVector(0, 0);
    camOffset = createVector(width / 2, height / 2);
}