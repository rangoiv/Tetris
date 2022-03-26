/*
  GUIDELINES NOT FOLLOWED:
  https://tetris.fandom.com/wiki/Tetris_Guideline

  Tetris game
  by Rangoiv
*/

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
    }

    grid(i,j) {
        if (this.tetronimo.rotation[this.rot][i*4+j] == '1') {
            return new Cell(this.tetronimo.name);
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
    setNewTetronimo() {
        // Using 7-bag Random Generator for new tetrominoes
        if (this.bag.length > 0) {
            this.tetronimo = this.bag.pop();
        } else {
            this.bag = []
            for (let i = 0; i < TETRONIMOS.length; i++) {
                this.bag[i] = Object.assign({}, TETRONIMOS[i]);
            }
            shuffleArray(this.bag);
            this.tetronimo = this.bag.pop();
        }
        
        this.x =  Math.floor(WIDTH/2)-2;
        this.y = -3;
        this.rot = 0;
    }
}

/* CONSTANTS */

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

/* VARIABLES */

var mainGrid = [];
var tickInterval;
var documentGrid=[];
var score = 0;
var lines = 0;
var pieces = 0;
var fallingTetronimo = new FallingTetronimo();

var audioPlayer = new Audio('Korobienki.mp3');

var xDown = null;
var yDown = null;

var scoreText;
var linesText;

var music = false;

window.onload = load;

function load() {
    documentGridElement = document.getElementById("grid");
    scoreText = document.getElementById("score");
    linesText = document.getElementById("lines");

    // Create new cells in html document
    for (let i = 0; i < HEIGHT; i++) {
        documentGrid[i]=[];
        for (let j = 0; j < WIDTH; j++) {
            var cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = ''+i+':'+j;
            documentGridElement.appendChild(cell);
            documentGrid[i][j] = document.getElementById(''+i+':'+j);
        }
    }

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
    
    fallingTetronimo.setNewTetronimo();

    document.getElementById("game_over").style.visibility = "hidden";

    document.addEventListener("keydown", keyPush);
    document.addEventListener('touchstart', handleTouchStart, false);        
    document.addEventListener('touchend', handleTouchMove, false);
    document.addEventListener('touch', handleTouch, false);
    
    tick()
}

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

    if (music) {
        // is playing
        music = false;
        audioPlayer.pause();
        toggleMusicButton.innerHTML = "Play music"
    } else {
        // isn't playing
        music = true;
        audioPlayer.play();
        toggleMusicButton.innerHTML = "Stop music"
    }
}

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
    tickInterval = setTimeout(tick,  Math.max(700-pieces*10, 100));
    draw();
    return isTouchdown;
}

function gameOver() {
    document.getElementById("game_over").style.visibility = "visible";
    clearInterval(tickInterval);
    document.removeEventListener("keydown", keyPush);
}

function draw() {
    // Set class names of cells on main grid
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (mainGrid[i][j]) {
                documentGrid[i][j].className = 'cell cell_' + mainGrid[i][j].name;
            } else {
                documentGrid[i][j].className = 'cell';
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
                    documentGrid[y][x].className = 'falling_cell cell_' + fallingTetronimo.grid(i,j).name;
                }
            }
        }
    }
    scoreText.innerHTML = "Score: " + score;
    linesText.innerHTML = "Lines: " + lines;
}

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

function keyPush(evt) {
    // Event triggered on key press
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
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function handleTouch(evt) {
    rotateRight();
}

function getTouches(evt) {
  return evt.touches ||             // browser API
         evt.originalEvent.touches; // jQuery
}                                                     
                                                                         
function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
};                                                
                                                                         
function handleTouchMove(evt) {
    if ( ! xDown || ! yDown ) {
        return;
    }

    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
                                                                         
    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
            moveRight();
            /* right swipe */ 
        } else {
            moveLeft();
            /* left swipe */
        }
    } else {
        if ( yDiff > 0 ) {
            dropDown();
            /* down swipe */ 
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;                                             
};