/*
  GUIDELINES NOT FOLLOWED:
  https://tetris.fandom.com/wiki/Tetris_Guideline

  Key codes:
  https://keycode.info/for/alt

  Tetris game
  by Rangoiv
*/

// ========================= CLASSES ============================

class Cell{
    constructor(name) { this.name = name; }
}

class Tetrimino {
    constructor(name, rot1, rot2, rot3, rot4) {
        this.name = name;
        this.rotation = [rot1, rot2, rot3, rot4];
    }
}

class FallingTetronimo {
    constructor() {
        this.bag = [];
        this.holdTetronimo;
        this.isHolding = false;
    }

    grid(i,j) {
        if (this.tetronimo.rotation[this.rot][i*4+j] == '1') {
            return new Cell(this.tetronimo.name);
        }
        return null;
    }

    nextGrid(k,i,j) {
        k = this.bag.length-k-1;
        if (this.bag[k]) {
            if (this.bag[k].rotation[0][i*4+j] == '1') {
                return new Cell(this.bag[k].name);
            }
        }
        return null;
    }
    holdGrid(i,j) {
        if (this.holdTetronimo) {
            if (this.holdTetronimo.rotation[0][i*4+j] == '1') {
                return new Cell(this.holdTetronimo.name);
            }
        }
        return null;
    }

    rotate() {
        this.rotateRight();
    }
    rotateRight() {
        this.rot = (this.rot+1)%4;
    }
    rotateLeft() {
        this.rot = (this.rot+3)%4;
    }
    moveLeft() {
        this.x -= 1;
    }
    moveRight() {
        this.x += 1;
    }
    moveDown() {
        this.y += 1;
    }
    moveUp() {
        this.y -= 1;
    }
    setNewTetronimo(fromHold = false) {
        if (fromHold == false) {
            this.isHolding = false;
        }

        // Set the new bag if needed
        // Using 7-bag Random Generator for new tetrominoes
        if (this.bag.length < 7) {
            var newBag = [];
            for (let i = 0; i < TETRONIMOS.length; i++) {
                newBag[i] = Object.assign({}, TETRONIMOS[i]);
            }
            shuffleArray(newBag);
            this.bag = [...newBag, ...this.bag];
        }

        // Set the new piece
        if (fromHold) {
            if (this.holdTetronimo) {
                var newTetronimo = this.tetronimo;
                this.tetronimo = this.holdTetronimo;
                this.holdTetronimo = newTetronimo;
            } else {
                this.holdTetronimo = this.tetronimo;
                this.tetronimo = this.bag.pop();
            }
        } else {
            this.tetronimo = this.bag.pop();
        }
        
        this.x =  Math.floor(WIDTH/2)-2;
        this.y = -3;
        this.rot = 0;
    }
    holdPiece() {
        if (this.isHolding) {
            return;
        }
        this.isHolding = true;
        this.setNewTetronimo(true);
    }
}

// ========================= CONSTANTS ============================

const WIDTH = 10;
const HEIGHT = 20;

Tetrimino_L = new Tetrimino("L", "0000011001000100", "0000000011100010", "0000010001001100", "0000100011100000");
Tetrimino_J = new Tetrimino("J", "0000010001000110", "0000000011101000", "0000110001000100", "0000001011100000");
Tetrimino_O = new Tetrimino("O", "0000011001100000", "0000011001100000", "0000011001100000", "0000011001100000");
Tetrimino_I = new Tetrimino("I", "0100010001000100", "0000000011110000", "0100010001000100", "0000000011110000");
Tetrimino_T = new Tetrimino("T", "0000010001100100", "0000000011100100", "0000010011000100", "0000010011100000");
Tetrimino_S = new Tetrimino("S", "0000011011000000", "0000010001100010", "0000000001101100", "0000100011000100");
Tetrimino_Z = new Tetrimino("Z", "0000110001100000", "0000001001100100", "0000000011000110", "0000010011001000");

const TETRONIMOS = [Tetrimino_L, Tetrimino_J, Tetrimino_O, Tetrimino_I, Tetrimino_T, Tetrimino_S, Tetrimino_Z];

const ROW_SCORE = 10;
const TETRIS_SCORE = 100;
const PIECE_SCORE = 1;
const NEXT_PIECES = 3;

// ========================= VARIABLES ============================

var mainGrid = [];
var tickInterval;
var docMainGrid=[];

var docNextGrid=[];
var docHoldGrid=[];

var score = 0;
var lines = 0;
var pieces = 0;
var fallingTetronimo = new FallingTetronimo();

var isPaused;
var isGameOver;

var audioPlayer = new Audio('Korobienki.mp3');

var xDown = null;
var yDown = null;

var scoreText;
var linesText;

var isMusicPlaying = false;

window.onload = load;

// ========================= GAME SCRIPT ============================

function load() {
    documentGridElement = document.getElementById("mainGrid");
    scoreText = document.getElementById("score");
    linesText = document.getElementById("lines");

    nextGridElements = []
    holdGridElement = document.getElementById("holdGrid");

    // Create new cells in html document for all next grids
    for (let k=0; k<NEXT_PIECES; k++) {
        nextGridElements[k] = document.getElementById("nextGrid_"+(k+1));
        docNextGrid[k] = [];

        for (let i = 0; i < 4; i++) {
            nextGridElements[k][i]=[];
            docNextGrid[k][i]=[];
            for (let j = 0; j < 4; j++) {
                var cell = document.createElement('div');
                cell.classList.add('cell');
                cell.id = 'n:'+k+':'+i+':'+j;
                nextGridElements[k].appendChild(cell);
                docNextGrid[k][i][j] = document.getElementById('n:'+k+':'+i+':'+j);
            }
        }
    }

    // Create new cells in html document for main grid
    for (let i = 0; i < HEIGHT; i++) {
        docMainGrid[i]=[];
        for (let j = 0; j < WIDTH; j++) {
            var cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = ''+i+':'+j;
            documentGridElement.appendChild(cell);
            docMainGrid[i][j] = document.getElementById(''+i+':'+j);
        }
    }

    // Create new cells in html document
    for (let i = 0; i < 4; i++) {
        docHoldGrid[i]=[];
        for (let j = 0; j < 4; j++) {
            var cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = 'h:'+i+':'+j;
            holdGridElement.appendChild(cell);
            docHoldGrid[i][j] = document.getElementById('h:'+i+':'+j);
        }
    }

    // Uncomment this line to disable music at the start
    document.addEventListener("click", playMusic);
    begin();
}

function restart() {
    restartButton = document.getElementById("restart");
    restartButton.blur();
    begin();
}

function begin() {
    score = 0;
    lines = 0;
    pieces = 0;

    // Initialize main grid to be empty
    for (let i = 0; i < HEIGHT; i++) {
        mainGrid[i] = [];
        for (let j = 0; j < WIDTH; j++) {
            mainGrid[i][j] = null;
        }
    }
    
    fallingTetronimo = new FallingTetronimo();
    fallingTetronimo.setNewTetronimo();

    document.getElementById("game_over").style.visibility = "hidden";

    document.addEventListener("keydown", keyPush);

    isGameOver = false;
    isPaused = false;
    tick()
}


// ========================= MUSIC SCRIPT ============================

function playMusic() {
    if (typeof audioPlayer.loop == 'boolean')
    {
        audioPlayer.loop = true;
    }
    else
    {
        audioPlayer.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }
    audioPlayer.volume = 0.25;

    toggleMusic();
    document.removeEventListener("click", playMusic);
}

function toggleMusic() {
    toggleMusicButton = document.getElementById("toggleMusic");
    toggleMusicButton.blur();

    if (isMusicPlaying) {
        // is playing
        isMusicPlaying = false;
        audioPlayer.pause();
        toggleMusicButton.innerHTML = "Play music"
    } else {
        // isn't playing
        isMusicPlaying = true;
        audioPlayer.play();
        toggleMusicButton.innerHTML = "Stop music"
    }
}

// ========================= GAME LOOP ============================

function tick() {

    // Check if Tetronimo is touching ground
    isTouchdown = false;
    fallingTetronimo.moveDown();
    if (checkTetronimo()) {
        // Touchdown
        isTouchdown = true;
        fallingTetronimo.moveUp();

        // Fill the main grid with falling Tetronimo
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                cell = fallingTetronimo.grid(i,j)
                if (cell) {
                    y = fallingTetronimo.y+i;
                    x = fallingTetronimo.x+j;
                    if (y < 0) {
                        gameOver();
                        return true;
                    }
                    mainGrid[y][x] = cell;
                }

                cell = fallingTetronimo.grid(i,j)
            }
        }
        
        // Check if rows are filled and empty them
        rowsEmptied = 0;
        for (let i = 0; i < HEIGHT; i++) {
            isFilled = true;
            for (let j = 0; j < WIDTH; j++) {
                if (mainGrid[i][j] == null) {
                    isFilled = false;
                }
            }
            if (isFilled) {
                mainGrid.splice(i, 1);
                mainGrid.unshift([]);
                for (let j = 0; j < WIDTH; j++) {
                    mainGrid[0][j] = null;
                }
                i -= 1;
                rowsEmptied += 1;
            }
        }
        
        // Scoring
        if (rowsEmptied == 4) {
            score += TETRIS_SCORE;
        } else {
            score += rowsEmptied * ROW_SCORE;
        }
        lines += rowsEmptied;
        score += PIECE_SCORE;
        pieces += 1;

        // Spawn another Tetronimo
        fallingTetronimo.setNewTetronimo();
    }
    
    clearTimeout(tickInterval);
    tickInterval = setTimeout(tick,  Math.max(700-pieces*7, 100));
    draw();
    return isTouchdown;
}

function gameOver() {
    document.getElementById("game_over").style.visibility = "visible";
    clearInterval(tickInterval);
    isGameOver = true;
}

// ========================= DRAWING ============================

function draw() {
    // Set class names of cells on main grid
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (mainGrid[i][j]) {
                docMainGrid[i][j].className = 'cell cell_' + mainGrid[i][j].name;
            } else {
                docMainGrid[i][j].className = 'cell';
            }
        }
    }
    // Set class names of cells on falling Tetronimo
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (fallingTetronimo.grid(i,j)) {
                y = fallingTetronimo.y+i;
                x = fallingTetronimo.x+j;
                if (0 <= x && x < WIDTH && 0 <= y && y < HEIGHT) {
                    docMainGrid[y][x].className = 'falling_cell cell_' + fallingTetronimo.grid(i,j).name;
                }
            }
        }
    }
    // Set class names of cells on hold piece and next pieces
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            // Draw hold piece
            cell = fallingTetronimo.holdGrid(i,j);
            if (cell) {
                docHoldGrid[i][j].className = 'cell_' + cell.name;
            } else {
                docHoldGrid[i][j].className = 'cell';
            }
            // Draw next pieces
            for (let k = 0; k < NEXT_PIECES; k++) {
                cell = fallingTetronimo.nextGrid(k,i,j);
                if (cell) {
                    docNextGrid[k][i][j].className = 'cell_' + cell.name;
                } else {
                    docNextGrid[k][i][j].className = 'cell';
                }
            }
        }
    }
    scoreText.innerHTML = "Score: " + score;
    linesText.innerHTML = "Lines: " + lines;
}

// ========================= MOVEMENT ============================

function rotateRight() {
    fallingTetronimo.rotateRight();
    if (checkTetronimo()) {
        fallingTetronimo.rotateLeft();
    }
    draw();
}

function moveLeft() {
    fallingTetronimo.moveLeft();
    if (checkTetronimo()) {
        fallingTetronimo.moveRight();
    }
    draw();
}

function moveRight() {
    fallingTetronimo.moveRight();
    if (checkTetronimo()) {
        fallingTetronimo.moveLeft();
    }
    draw();
}

function moveDown() {
    fallingTetronimo.moveDown();
    if (checkTetronimo()) {
        fallingTetronimo.moveUp();
    }
    draw();
}

function dropDown() {
    while (!tick()) {}
}

function holdPiece() {
    fallingTetronimo.holdPiece();
    draw();
}

// Used to both pause and unpause
function pause() {
    if (isPaused) {
        tick()
    } else {
        clearInterval(tickInterval);
    }
    isPaused = !isPaused;
}

function checkTetronimo() { 
    // Check if falling Tetronimo is out of the screen or on top of other blocks
    // return 1 out of left screen, 2 if out of right, 3 if out of bottom screen, 4 if touching, 0 otherwise
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (fallingTetronimo.grid(i,j)) {
                y = fallingTetronimo.y+i;
                x = fallingTetronimo.x+j;
                if (x < 0) {
                    // IZVAN LIJEVOG EKRANA
                    return 1;
                } else if (x >= WIDTH) {
                    // IZVAN DESNOG EKRANA
                    return 2;
                } else if (y >= HEIGHT) {
                    // IZVAN DONJEG EKRANA
                    return 3;
                } else if ( y >= 0 && mainGrid[y][x] != null) {
                    // PROVJERITI DODIRUJE LI POD
                    return 4;
                }
            }
        }
    }
    return 0;
}


// ========================= KEY CONTROLLS ============================

function keyPush(evt) {
    // Event triggered on key press
    keyCode = evt.keyCode;
    if (evt.keyCode == 82) { // R - restart
        restart();
    } else if (isGameOver) {
        return;
    } else if (evt.keyCode == 80) { // P - pause / unpause
        pause();
    } else if (isPaused) {
        return;
    }

    switch(evt.keyCode) {
        case 37: // LIJEVO
            moveLeft();
            break;
        case 38: // GORE
            rotateRight();
            break;
        case 39: // DESNO
            moveRight();
            break;
        case 40: // DOLJE
            moveDown();
            break;
        case 32: // SPACE
            dropDown();
            break;
        case 67: // C   
        case 72: // H
            holdPiece();
            break;
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}