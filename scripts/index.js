/* Constants */ 

const GRID_SIZE         = 10;
const FPS               = 3;
const FRAMES_PER_ACTION = 3;
const INITIAL_HEALTH    = 100;
const DAMAGE_PER_STAB   = 20;

/* Variables */

// Entorno
var canvas              = null;
var context             = null;

var intervalId          = null;

// Juego
var map                 = null;

var cellSize            = null;
var rows                = null;
var columns             = null;

var characters          = null;

var framesCount         = null;
var elapsedTime         = null;

/* Classes */

const directions = {
    UP:     "UP",
    DOWN:   "DOWN",
    LEFT:   "LEFT",
    RIGHT:  "RIGHT"
};

const BODY_HURT_COLORS  = ["#000000", "#ff2222", "#515100"];
const BODY_COLORS       = ["#000000"]
const EYE_COLOR         =  "#f15654";

class Character {

    constructor(name, img) {
        this.name       = name;
        this.health     = INITIAL_HEALTH;
        this.lastHealth = this.health;
        this.img        = img;
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

        this.lookingDirection = getRandomDirection();

        map[x][y] = this;
    }

    move(direction, others) {
        const {x: newX, y: newY} = nextPositionInDirection(this.x, this.y, direction);

        this.lookingDirection = direction;

        if (newX >= 0 && newX < rows && newY >= 0 && newY < columns) {
            const charAt = characterAt(newX, newY, others);

            if (charAt == null) {
                this.x = newX;
                this.y = newY;
    
                const {x: stabX, y: stabY} = nextPositionInDirection(this.x, this.y, direction);

                if (stabX >= 0 && stabX < rows && stabY >= 0 && stabY < columns) {
                    const charAt = characterAt(stabX, stabY, others);

                    if (charAt != null) {
                        const newHealth = charAt.health - DAMAGE_PER_STAB;
                        charAt.health = newHealth >= 0 ? newHealth : 0;
                    }
                }
            }
        }
    }

    toInformationCharacter() {
        const obj = {
            'name': this.name,
            'x': this.x,
            'y': this.y,
            'lookingDirection': this.lookingDirection
        };
        return obj;
    }

    decide(others) {
        // to implement
        throw Error("Need to implement decide method.");
    }

    execute(others) {
        let othersInfo = others.map(char => char.toInformationCharacter());
        const direction = this.decide(othersInfo);
        this.move(direction, others);
    }

    wasHurt(i) {
        const hurt = this.health < this.lastHealth;

        if (i === FRAMES_PER_ACTION - 1) {
            this.lastHealth = this.health;
        }

        return hurt;
    }

    draw(i) {
        const bodyColorArray        = this.wasHurt(i) ? BODY_HURT_COLORS : BODY_COLORS;
        const bodyColorIdx          = i < bodyColorArray.length ? i : bodyColorArray.length - 1;
        const bodyColor             = bodyColorArray[bodyColorIdx];

        // Body

        const centerX               = this.x * cellSize + cellSize / 2;
        const centerY               = this.y * cellSize + cellSize / 2;
        const radius                = cellSize/2;

        drawCircle(centerX, centerY, radius, bodyColor)

        // Eyes

        const eyeDistance           = radius/2;

        let eye1X, eye2X, eye1Y, eye2Y;
        
        const eyeRadius             = radius/4;
        const eyeDistanceBetween    = radius/3;

        switch (this.lookingDirection) {
            case directions.UP:
                eye1Y = centerY - eyeDistance;
                eye2Y = centerY - eyeDistance;
                eye1X = centerX - eyeDistanceBetween;
                eye2X = centerX + eyeDistanceBetween;
                break;
            case directions.DOWN:
                eye1Y = centerY + eyeDistance;
                eye2Y = centerY + eyeDistance;
                eye1X = centerX - eyeDistanceBetween;
                eye2X = centerX + eyeDistanceBetween;
                break;
            case directions.LEFT:
                eye1X = centerX - eyeDistance;
                eye2X = centerX - eyeDistance;
                eye1Y = centerY - eyeDistanceBetween;
                eye2Y = centerY + eyeDistanceBetween;
                break;
            case directions.RIGHT:
                eye1X = centerX + eyeDistance;
                eye2X = centerX + eyeDistance;
                eye1Y = centerY - eyeDistanceBetween;
                eye2Y = centerY + eyeDistanceBetween;
                break;
        }

        drawCircle(eye1X, eye1Y, eyeRadius, EYE_COLOR);
        drawCircle(eye2X, eye2Y, eyeRadius, EYE_COLOR);

        // Dagger

        this.drawDagger();
    }

    drawDagger() {
        const daggerWidth  = cellSize/8;
        const daggerLength = cellSize/2; 
        const daggerDist   = cellSize/6

        let x, y, w, h;

        switch (this.lookingDirection) {
            case directions.UP:
                x = this.x * cellSize + cellSize / 2 - daggerWidth / 2;
                y = this.y * cellSize - daggerLength - daggerDist;
                w = daggerWidth;
                h = daggerLength;
                break;
            case directions.DOWN:
                x = this.x * cellSize + cellSize / 2 - daggerWidth / 2;
                y = this.y * cellSize + cellSize + daggerDist;
                w = daggerWidth;
                h = daggerLength;
                break;
            case directions.LEFT:
                x = this.x * cellSize - daggerLength - daggerDist;
                y = this.y * cellSize + cellSize / 2 - daggerWidth / 2;
                w = daggerLength;
                h = daggerWidth;
                break;
            case directions.RIGHT:
                x = this.x * cellSize + cellSize + daggerDist;
                y = this.y * cellSize + cellSize / 2 - daggerWidth / 2;
                w = daggerLength;
                h = daggerWidth;
                break;
        }

        drawRectangle(x, y, w, h, "red");
    }

    someoneInDirection(direction, step, others) {
       return characterInDirectionRec(this.x, this.y, direction, step, others);
    }
    
    toString() {
        let s = `Character "${this.name}:\n"`;
        Object.getOwnPropertyNames(this).forEach(function(val, idx, array) {
            s += `${val} -> ${this[val]} \n`;
        });
        return s;
    }

}

class BotCharacter extends Character {
  
    constructor(name) {
        super(name, "filePath");
    }

    decide(others) {
        for (let direction of Object.values(directions)) {
            if (this.someoneInDirection(direction, 2, others) != null) {
                return direction;
            }
        }
        return getRandomDirection();
    }

}

/* Functions */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomDirection() {
    const directionsList        = Object.values(directions);
    return Object.values(directionsList)[getRandomInt(0, directionsList.length)];
}

function getCharacters() {
    return [
        new BotCharacter("Bot1"),
        new BotCharacter("Bot2")
    ]
}

function characterAt(x, y, others) {
    for (const char of others) {
        if (char.x === x && char.y === y) {
            return char;
        }
    }
    return null;
}

function nextPositionInDirection(x, y, direction) {
    let newX = x;
    let newY = y;
    switch (direction) {
        case directions.UP:
            newY--;
            break;
        case directions.DOWN:
            newY++;
            break;
        case directions.LEFT:
            newX--;
            break;
        case directions.RIGHT:
            newX++;
            break;
    }
    return {
        x: newX,
        y: newY
    };
}

function characterInDirectionRec(x, y, direction, step, others) {
    if (step == 0) {
        if (x >= 0 && x < rows && x >= 0 && x < columns) {
            return characterAt(x, y, others);
        }
        else {
            return null;
        }
    }

    const {x: nextX, y: nextY} = nextPositionInDirection(x, y, direction);
    return characterInDirectionRec(nextX, nextY, direction, step-1, others);
}

function drawCircle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
}

function drawRectangle(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
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
}

function loadAssets() {
    console.log("Assets loaded");
}

function play() {
    console.log("Game started");

    framesCount = 0;
    const startTime = Date.now();

    window.clearInterval(intervalId);

    intervalId = window.setInterval(function() {
        elapsedTime = Date.now() - startTime;
        playFrame();
    }, 1000/FPS);
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function playFrame() {
    if (framesCount % FRAMES_PER_ACTION == FRAMES_PER_ACTION - 1) {
        let char;

        for (let i = characters.length-1; i >= 0; i--) {
            char = characters[i];
    
            if (char.health <= 0) {
                console.log(`Our precious friend "${char.name}" died`);
                characters.splice(i, 1);
            }
        }
        const alive = characters.length;
    
        if (alive > 1) {

            let indexes = [];
            for (let i = 0; i < characters.length; i++) {
                indexes.push(i);
            }
            shuffleArray(indexes);

            let others;
            for (let index of indexes) {
                const character = characters[index]     
                others = characters
                    .filter(char => char.name !== character.name); 
                character.execute(others);
            }
        }
        else {
            window.clearInterval(intervalId);
    
            if (alive == 1) {
                const winner = characters[0];
                console.log(`And the winner is "${winner.name}" with ${winner.health} of health`);
            }
            else {
                console.log("Wow! Nobody survived!!");
            }
        }
    }

    drawCanvas();
}

function drawCanvas() {
    resetCanvas();

    for (let character of characters) {
        character.draw(framesCount % FRAMES_PER_ACTION);
    }

    framesCount++;
}
