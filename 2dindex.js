import {movePiece} from './index.js'

const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");
const tileSize = canvas.clientWidth / 8;
let selectedPiece = null;

let htmlBoardData 

let _boardState

export async function loadBoardState()
{
    htmlBoardData = await fetch('/board.txt').then(item=>item.text())
    _boardState = parseBoard(htmlBoardData)
    drawBoard()
}

export function getBoardState() {
    return _boardState
}
export function setBoardState(s) {
    _boardState = s
}

const pieceSymbols = {
    "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
    "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙"
};


function parseBoard(html) {
    const boardState = Array(8).fill(null).map(() => Array(8).fill(""));
    const pieceMap = {
        'br': 'r', 'bn': 'n', 'bb': 'b', 'bq': 'q', 'bk': 'k', 'bp': 'p',
        'wr': 'R', 'wn': 'N', 'wb': 'B', 'wq': 'Q', 'wk': 'K', 'wp': 'P'
    };
    
    const divs = html.match(/<div class="piece (\w+) square-(\d{2})" style=""><\/div>/g);
    if (!divs) return boardState;
    
    divs.forEach(div => {
        const [, pieceClass, square] = div.match(/piece (\w+) square-(\d{2})/);
        const piece = pieceMap[pieceClass];
        const row = 8 - parseInt(square[1]);
        const col = parseInt(square[0]) - 1;
        boardState[row][col] = piece;
    });
    
    return boardState;
}


function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? "#eeeed2" : "#769656";
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            let piece = _boardState[row][col];
            if (piece) {
                ctx.fillStyle = "black";
                ctx.font = "36px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(pieceSymbols[piece], col * tileSize + tileSize / 2, row * tileSize + tileSize / 2);
            }
        }
    }
}

canvas.addEventListener("click", (event) => {
    let col = Math.floor(event.offsetX / tileSize);
    let row = Math.floor(event.offsetY / tileSize);
    
    if (selectedPiece) {
        movePiece({row: selectedPiece.row, col: selectedPiece.col}, {row, col})
        _boardState[selectedPiece.row][selectedPiece.col] = "";
        _boardState[row][col] = selectedPiece.piece;
        selectedPiece = null;
        drawBoard();
    } else if (_boardState[row][col]) {
        selectedPiece = { row, col, piece: _boardState[row][col] };
    }
});
