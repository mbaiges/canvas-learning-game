/* Constants */ 

console.log("Llego");

var GRID_SIZE   = 20;

/* Variables */

// Entorno
var canvas      = null;
var context     = null;

// Juego
var map         = null;

var cellSize    = null;
var rows        = null;
var columns     = null;

var characters  = null;

/* Classes */

const directions = {
    UP:     "UP",
    DOWN:   "DOWN",
    LEFT:   "LEFT",
    RIGHT:  "RIGHT"
};

class Character {

    constructor(name, img) {
        this.name   = name;
        this.img    = img;
    }

    findRandomPlace(map) {
        let placeFound = false;
        let x, y;

        while (!placeFound) {
            x = getRandomInt(0,    rows);
            y = getRandomInt(0, columns);       

            placeFound = map[x][y] === null;
        }

        this.x = x;
        this.y = y;

        const directionsList        = Object.values(directions);
        const lookingDirection      = Object.keys(directions)[getRandomInt(0, directionsList.length)];
        this.lookingDirection       = lookingDirection;

        map[x][y] = this;
    }

    move(direction) {
        let newX = this.x;
        let newY = this.y;
        switch (direction) {
            case directions.UP:
                newY -= 1;
                break;
            case directions.DOWN:
                newY += 1;
                break;
            case directions.LEFT:
                newX -= 1;
                break;
            case directions.RIGHT:
                newX += 1;
                break;
            default:
                console.log(`Character ${this.name} tried to move to invalid direction ${this.direction}`);
                return;
        }

        if (newX >= 0 && newX < rows && newY >= 0 && newY < columns) {
            this.x = newX;
            this.y = newY;

            this.lookingDirection = direction;
        }
    }

    draw() {
        const centerX = this.x * cellSize + cellSize/2;
        const centerY = this.y * cellSize + cellSize/2;
        const radius  = cellSize/2;

        drawCircle(centerX, centerY, radius, "#000000")

        const eyeDistance = radius/2;

        let eye1X = centerX;
        let eye2X = centerX;
        let eye1Y = centerY;
        let eye2Y = centerY;
        
        const eyeRadius = radius/4;
        const eyeDistanceBetween = radius/3;

        switch (this.lookingDirection) {
            case directions.UP:
                eye1Y -= eyeDistance;
                eye2Y -= eyeDistance;
                eye1X -= eyeDistanceBetween;
                eye2X += eyeDistanceBetween;
                break;
            case directions.DOWN:
                eye1Y += eyeDistance;
                eye2Y += eyeDistance;
                eye1X -= eyeDistanceBetween;
                eye2X += eyeDistanceBetween;
                break;
            case directions.LEFT:
                eye1X -= eyeDistance;
                eye2X -= eyeDistance;
                eye1Y -= eyeDistanceBetween;
                eye2Y += eyeDistanceBetween;
                break;
            case directions.RIGHT:
                eye1X += eyeDistance;
                eye2X += eyeDistance;
                eye1Y -= eyeDistanceBetween;
                eye2Y += eyeDistanceBetween;
                break;
        }

        drawCircle(eye1X, eye1Y, eyeRadius, "#f15654");
        drawCircle(eye2X, eye2Y, eyeRadius, "#f15654");
    }

    toString() {
        let s = `Character "${this.name}:\n"`;
        Object.getOwnPropertyNames(this).forEach(function(val, idx, array) {
            s += `${val} -> ${this[val]} \n`;
        });
        return s;
    }

}

class MatiCharacter extends Character {
  
    constructor() {
        super("Mati", "filePath");
    }

}

/* Functions */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getCharacters() {
    return [
        new MatiCharacter()
    ]
}

function drawCircle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
}

window.addEventListener('resize', initCanvas);

function initCanvas() {
    setup();

    loadAssets();

    play();
}

function setup() {
    canvas          = document.getElementById("canvas");
    context         = canvas.getContext('2d');

    let cellWidth   = window.innerWidth  / GRID_SIZE;
    let cellHeight  = window.innerHeight / GRID_SIZE;

    cellSize        = cellWidth < cellHeight ? cellWidth : cellHeight;
    rows            = Math.trunc(window.innerWidth  / cellSize);
    columns         = Math.trunc(window.innerHeight / cellSize);

    canvas.width    = rows * cellSize;
    canvas.height   = columns * cellSize;

    initMatrix();
}

function initMatrix() {
    console.log("Initializing matrix");

    matrix = [];
    for (let row = 0; row < rows; row++) {
        matrix.push([]);
        for (let col = 0; col < columns; col++) {
            matrix[row].push(null);
        }
    }

    characters = getCharacters();
    for (let character of characters) {
        character.findRandomPlace(matrix);
    }

    console.table(matrix);
    console.log(characters[0]);
}

function loadAssets() {
    console.log("Assets loaded");
}

function play() {
    console.log("Game started");

    drawCanvas();

    document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        const mainCharacter = characters[0];

        switch (keyName) {
            case 'ArrowUp':
                mainCharacter.move(directions.UP);
                break;
            case 'ArrowDown':
                mainCharacter.move(directions.DOWN);
                break;
            case 'ArrowLeft':
                mainCharacter.move(directions.LEFT);
                break;
            case 'ArrowRight':
                mainCharacter.move(directions.RIGHT);
                break;
        }

        drawCanvas();
    });
}

function resetCanvas() {
    // Store the current transformation matrix
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Restore the transform
    context.restore();
}

function drawCanvas() {
    resetCanvas();

    for (let character of characters) {
        character.draw();
    }
}
