// CORE SETUP + ASSET LOADING + SIGNAL SYSTEM
const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");

// SIMULATION CONSTANTS
const SIMULATION_TIME = 120;
const DEFAULT_GREEN = 10;
const DEFAULT_YELLOW = 5;

const STOP_LINES = {
    right: 592,   // left edge of vertical road (entering from the left)
    down: 332,    // top edge of horizontal road (entering from the top)
    left: 781,    // right edge of vertical road (entering from the right)
    up: 528       // bottom edge of horizontal road (entering from the bottom)
};

const SIGNAL_POSITIONS = [
    { x: 552, y: 252 },
    { x: 821, y: 252 },
    { x: 821, y: 568 },
    { x: 552, y: 568 }
];

// GLOBAL VARIABLES
let simulationTimer = SIMULATION_TIME;

let currentGreen = 0;
let currentYellow = 0;
let boxOccupiedBy = null;

let signals = [];

let vehicles = {
    right: [],
    down: [],
    left: [],
    up: []
};

let assets = {
    background: null,

    signals: {
        red: null,
        yellow: null,
        green: null
    },

    vehicles: {
        right: {},
        down: {},
        left: {},
        up: {}
    }
};

// IMAGE LOADER
function loadImage(path) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => {
            console.log("Loaded:", path);
            resolve(img);
        };

        img.onerror = () => {
            console.error("Failed:", path);
            reject(path);
        };

        img.src = path;

    });
}

async function loadAssets() {

    console.log("Loading Assets...");

    // Background
    assets.background =
        await loadImage("bg/intersection.png");

    // Signal Images
    assets.signals.red =
        await loadImage("signal/red.png");

    assets.signals.yellow =
        await loadImage("signal/yellow.png");

    assets.signals.green =
        await loadImage("signal/green.png");

    // Vehicle Images
    const directions = [
        "right",
        "down",
        "left",
        "up"
    ];

    const vehicleTypes = [
        "car",
        "bus",
        "truck",
        "bike"
    ];

    for (const direction of directions) {

        for (const type of vehicleTypes) {

            assets.vehicles[direction][type] =
                await loadImage(
                    `${direction}/${type}.png`
                );
        }
    }

    console.log("All Assets Loaded");
}

// SIGNAL CLASS
class TrafficSignal {

    constructor(red, yellow, green) {
        this.red = red;
        this.yellow = yellow;
        this.green = green;
    }
}

// INITIALIZE SIGNALS
function initializeSignals() {

    signals = [

        new TrafficSignal(
            0,
            DEFAULT_YELLOW,
            DEFAULT_GREEN
        ),

        new TrafficSignal(
            DEFAULT_GREEN + DEFAULT_YELLOW,
            DEFAULT_YELLOW,
            DEFAULT_GREEN
        ),

        new TrafficSignal(
            DEFAULT_GREEN * 2 + DEFAULT_YELLOW * 2,
            DEFAULT_YELLOW,
            DEFAULT_GREEN
        ),

        new TrafficSignal(
            DEFAULT_GREEN * 3 + DEFAULT_YELLOW * 3,
            DEFAULT_YELLOW,
            DEFAULT_GREEN
        )
    ];
}

// SIGNAL TIMER LOOP
function startSignalSystem() {

    setInterval(() => {

        if (currentYellow === 0) {

            signals[currentGreen].green--;

            if (signals[currentGreen].green <= 0) {
                currentYellow = 1;
            }

        } else {

            signals[currentGreen].yellow--;

            if (signals[currentGreen].yellow <= 0) {

                let totalVehicles =
                    vehicles.right.length +
                    vehicles.left.length +
                    vehicles.up.length +
                    vehicles.down.length;

                signals[currentGreen].green =
                    Math.min(
                        25,
                        Math.max(
                            10,
                            Math.floor(totalVehicles / 3)
                        )
                    );

                signals[currentGreen].yellow = DEFAULT_YELLOW;

                currentYellow = 0;

                currentGreen = (currentGreen + 1) % 4;
            }
        }

    }, 1000);
}

// DRAW BACKGROUND
function drawBackground() {

    if (!assets.background) return;

    ctx.drawImage(
        assets.background,
        0, 0,
        canvas.width,
        canvas.height
    );
}

// DRAW SIGNALS
function drawSignals() {

    for (let i = 0; i < 4; i++) {

        let image;

        if (i === currentGreen) {

            if (currentYellow === 1) {
                image = assets.signals.yellow;
            } else {
                image = assets.signals.green;
            }

        } else {
            image = assets.signals.red;
        }

        ctx.drawImage(
            image,
            SIGNAL_POSITIONS[i].x,
            SIGNAL_POSITIONS[i].y,
            30,
            80
        );

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";

        const timer =
            i === currentGreen
                ? (currentYellow ? signals[i].yellow : signals[i].green)
                : "---";

        ctx.fillText(
            timer,
            SIGNAL_POSITIONS[i].x,
            SIGNAL_POSITIONS[i].y - 10
        );
    }
}

// DASHBOARD TIMER
function startSimulationClock() {

    const timerElement =
        document.getElementById("simulationTime");

    setInterval(() => {

        simulationTimer--;

        timerElement.innerText = simulationTimer + "s";

        if (simulationTimer <= 0) {
            alert("Simulation Completed");
            location.reload();
        }

    }, 1000);
}

// ANIMATION LOOP
function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    updateVehicles();

    if (boxOccupiedBy !== null) {
        const stillExists = Object.keys(vehicles).some(
            direction => vehicles[direction].includes(boxOccupiedBy)
        );
        if (!stillExists) {
            boxOccupiedBy = null;
        }
    }

    maintainVehicleSpacing();

    removeOffscreenVehicles();

    drawVehicles();

    drawSignals();

    updateDashboard();

    requestAnimationFrame(animate);
}

// START SIMULATION
async function startSimulation() {

    try {

        await loadAssets();

        initializeSignals();

        startSignalSystem();

        startSimulationClock();

        startVehicleSpawner();

        animate();

    } catch (error) {

        console.error(error);
    }
}

window.onload = startSimulation;

// VEHICLE SYSTEM
const VEHICLE_TYPES = [
    "car",
    "bus",
    "truck",
    "bike"
];

const VEHICLE_SPEEDS = {
    car: 2.25,
    bus: 1.8,
    truck: 1.8,
    bike: 2.5
};

const VEHICLE_SPAWN_POSITIONS = {

    right: { x: 0,    y: 380 },
    down:  { x: 639,  y: 0   },
    left:  { x: 1400, y: 478 },
    up:    { x: 734,  y: 922 }
};

const DIRECTION_AFTER_TURN = {
    right: "down",
    down:  "left",
    left:  "up",
    up:    "right"
};

// VEHICLE CLASS
class Vehicle {

    constructor(type, direction, willTurn) {

        this.type = type;
        this.direction = direction;
        this.willTurn = willTurn;
        this.speed = VEHICLE_SPEEDS[type];
        this.turned = false;
        this.relocated = false;
        this.angle = 0;
        this.crossed = false;

        this.image = assets.vehicles[direction][type];

        this.width = this.image.width;
        this.height = this.image.height;

        this.x = VEHICLE_SPAWN_POSITIONS[direction].x;
        this.y = VEHICLE_SPAWN_POSITIONS[direction].y;

        this.stop = STOP_LINES[direction];

        this.homeKey = direction;
    }

    // BASIC MOVEMENT
    move() {

        if (this.willTurn) {

            this.handleTurning();

            if (!this.turned) {

                switch (this.direction) {
                    case "right": this.moveRight(); break;
                    case "left":  this.moveLeft();  break;
                    case "up":    this.moveUp();    break;
                    case "down":  this.moveDown();  break;
                }
            }

            if (this.turned && !this.relocated) {

                const newDirection = DIRECTION_AFTER_TURN[this.direction];

                if (newDirection === "up" || newDirection === "down") {
                    this.x = VEHICLE_SPAWN_POSITIONS[newDirection].x;
                } else {
                    this.y = VEHICLE_SPAWN_POSITIONS[newDirection].y;
                }

                this.direction = newDirection;
                this.stop = STOP_LINES[this.direction];
                this.relocated = true; // array move handled in updateVehicles()
            }

            if (this.relocated) {

                switch (this.direction) {
                    case "right": this.moveRight(); break;
                    case "left":  this.moveLeft();  break;
                    case "up":    this.moveUp();    break;
                    case "down":  this.moveDown();  break;
                }
            }

            return;
        }

        switch (this.direction) {
            case "right": this.moveRight(); break;
            case "left":  this.moveLeft();  break;
            case "up":    this.moveUp();    break;
            case "down":  this.moveDown();  break;
        }
    }

    // RIGHT
    moveRight() {

        if (currentGreen === 0 && currentYellow === 0) {
            this.x += this.speed;
        } else {
            if (this.x + this.width < STOP_LINES.right) {
                this.x += this.speed;
            }
        }
    }

    // LEFT
    moveLeft() {

        if (currentGreen === 2 && currentYellow === 0) {
            this.x -= this.speed;
        } else {
            if (this.x > STOP_LINES.left) {
                this.x -= this.speed;
            }
        }
    }

    // UP
     moveUp() {

        if (currentGreen === 3 && currentYellow === 0) {
            this.y -= this.speed;
        } else {
            if (this.y > STOP_LINES.up) {
                this.y -= this.speed;
            }
        }
    }

    // DOWN
    moveDown() {

        if (currentGreen === 1 && currentYellow === 0) {
            this.y += this.speed;
        } else {
            if (this.y + this.height < STOP_LINES.down) {
                this.y += this.speed;
            }
        }
    }

    // DRAW
    draw() {

        ctx.save();

        ctx.translate(
            this.x + this.width / 2,
            this.y + this.height / 2
        );

        ctx.rotate(this.angle * Math.PI / 180);

        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2
        );

        ctx.restore();
    }
}

// VEHICLE GENERATOR
function generateVehicle() {

    const directions = ["right", "down", "left", "up"];

    const type =
        VEHICLE_TYPES[
            Math.floor(Math.random() * VEHICLE_TYPES.length)
        ];

    const direction =
        directions[
            Math.floor(Math.random() * directions.length)
        ];

    const willTurn = Math.random() < 0.4;

    const vehicle = new Vehicle(type, direction, willTurn);

    vehicles[direction].push(vehicle);
}

// SPAWNER LOOP
function startVehicleSpawner() {

    setInterval(() => {
        generateVehicle();
    }, 1000);
}

// UPDATE VEHICLES
function updateVehicles() {

    Object.keys(vehicles).forEach(direction => {

        vehicles[direction].forEach(vehicle => {
            vehicle.move();
        });
    });

    Object.keys(vehicles).forEach(homeKey => {

        const stillHome = [];

        vehicles[homeKey].forEach(vehicle => {

            if (vehicle.relocated && vehicle.homeKey !== vehicle.direction) {
                vehicles[vehicle.direction].push(vehicle);
                vehicle.homeKey = vehicle.direction;
            } else {
                stillHome.push(vehicle);
            }
        });

        vehicles[homeKey] = stillHome;
    });
}

// REMOVE OFFSCREEN VEHICLES
function removeOffscreenVehicles() {

    Object.keys(vehicles).forEach(direction => {

        vehicles[direction] = vehicles[direction].filter(v => {
            return !(
                v.x < -200  ||
                v.x > 1600  ||
                v.y < -200  ||
                v.y > 1000
            );
        });
    });
}

// DRAW VEHICLES
function drawVehicles() {

    Object.keys(vehicles).forEach(direction => {

        vehicles[direction].forEach(vehicle => {
            vehicle.draw();
        });
    });
}

// TURNING SYSTEM
const TURN_WAIT_BUFFER = 18;

const TURN_MIDPOINTS = {
    right: { x: 660, y: 427 },
    down:  { x: 686, y: 460 },
    left:  { x: 713, y: 427 },
    up:    { x: 686, y: 400 }
};

// EXTEND VEHICLE PROTOTYPE — HANDLE TURNING
Vehicle.prototype.handleTurning = function () {

    if (!this.willTurn) return;

    const turnStep = this.speed * 0.6;   // per-axis movement during the arc
    const angleStep = this.speed * 1.1;  // degrees per frame

    switch (this.direction) {

        // RIGHT → DOWN
        case "right":

            if (!this.turned) {
                if (this.x >= TURN_MIDPOINTS.right.x &&
                    (boxOccupiedBy === null || boxOccupiedBy === this)) {

                    boxOccupiedBy = this;

                    this.angle += angleStep;
                    this.x += turnStep;
                    this.y += turnStep;

                    if (this.angle >= 90) {
                        this.angle = 90;
                        this.turned = true;
                        boxOccupiedBy = null;
                    }
                } else if (boxOccupiedBy !== null &&
                           this.x < TURN_MIDPOINTS.right.x - TURN_WAIT_BUFFER) {
                    this.x += this.speed;
                }

            }

            break;

        // DOWN → LEFT
        case "down":

            if (!this.turned) {

                if (this.y >= TURN_MIDPOINTS.down.y &&
                    (boxOccupiedBy === null || boxOccupiedBy === this)) {

                    boxOccupiedBy = this;

                    this.angle += angleStep;
                    this.x -= turnStep;
                    this.y += turnStep;

                    if (this.angle >= 90) {
                        this.angle = 90;
                        this.turned = true;
                        boxOccupiedBy = null;
                    }
                } else if (boxOccupiedBy !== null &&
                           this.y < TURN_MIDPOINTS.down.y - TURN_WAIT_BUFFER) {
                    this.y += this.speed;
                }

            }

            break;

        // LEFT → UP
        case "left":

            if (!this.turned) {

                if (this.x <= TURN_MIDPOINTS.left.x &&
                    (boxOccupiedBy === null || boxOccupiedBy === this)) {

                    boxOccupiedBy = this;

                    this.angle += angleStep;
                    this.x -= turnStep;
                    this.y -= turnStep;

                    if (this.angle >= 90) {
                        this.angle = 90;
                        this.turned = true;
                        boxOccupiedBy = null;
                    }
                } else if (boxOccupiedBy !== null &&
                           this.x > TURN_MIDPOINTS.left.x + TURN_WAIT_BUFFER) {
                    this.x -= this.speed;
                }

            }

            break;

        // UP → RIGHT
        case "up":

            if (!this.turned) {

                if (this.y <= TURN_MIDPOINTS.up.y &&
                    (boxOccupiedBy === null || boxOccupiedBy === this)) {

                    boxOccupiedBy = this;

                    this.angle += angleStep;
                    this.x += turnStep;
                    this.y -= turnStep;

                    if (this.angle >= 90) {
                        this.angle = 90;
                        this.turned = true;
                        boxOccupiedBy = null;
                    }
                } else if (boxOccupiedBy !== null &&
                           this.y > TURN_MIDPOINTS.up.y + TURN_WAIT_BUFFER) {
                    this.y -= this.speed;
                }

            }

            break;
    }
};

// MAINTAIN VEHICLE SPACING
function maintainVehicleSpacing() {
    Object.keys(vehicles).forEach(direction => {

        const lane = vehicles[direction].filter(v => !(v.willTurn && !v.turned && v.angle > 0));

        const gap = 50;

        let sorted;

        switch (direction) {

            case "right":
                // travelling +x, so further along = larger x
                sorted = [...lane].sort((a, b) => b.x - a.x);
                for (let i = 1; i < sorted.length; i++) {
                    const front = sorted[i - 1];
                    const back = sorted[i];
                    if (back.x + back.width + gap > front.x) {
                        back.x = front.x - back.width - gap;
                    }
                }
                break;

            case "left":
                // travelling -x, so further along = smaller x
                sorted = [...lane].sort((a, b) => a.x - b.x);
                for (let i = 1; i < sorted.length; i++) {
                    const front = sorted[i - 1];
                    const back = sorted[i];
                    if (back.x < front.x + front.width + gap) {
                        back.x = front.x + front.width + gap;
                    }
                }
                break;

            case "up":
                // travelling -y, so further along = smaller y
                sorted = [...lane].sort((a, b) => a.y - b.y);
                for (let i = 1; i < sorted.length; i++) {
                    const front = sorted[i - 1];
                    const back = sorted[i];
                    if (back.y < front.y + front.height + gap) {
                        back.y = front.y + front.height + gap;
                    }
                }
                break;

            case "down":
                // travelling +y, so further along = larger y
                sorted = [...lane].sort((a, b) => b.y - a.y);
                for (let i = 1; i < sorted.length; i++) {
                    const front = sorted[i - 1];
                    const back = sorted[i];
                    if (back.y + back.height + gap > front.y) {
                        back.y = front.y - back.height - gap;
                    }
                }
                break;
        }
    });
}

// UPDATE DASHBOARD
function updateDashboard() {

    document.getElementById("northCount").innerText = vehicles.up.length;
    document.getElementById("eastCount").innerText  = vehicles.right.length;
    document.getElementById("southCount").innerText = vehicles.down.length;
    document.getElementById("westCount").innerText  = vehicles.left.length;
}