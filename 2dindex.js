import {movePiece} from './index.js'

const canvas = document.getElementById("chessboard");
const ctx = canvas.getContext("2d");
const tileSize = canvas.clientWidth / 8;
let selectedPiece = null;

let htmlBoardData 

let _boardState

const DEBUGMODE = false

export async function loadBoardState()
{
    if(DEBUGMODE) {
        htmlBoardData = await fetch('board.txt').then(item=>item.text())
        parseBoard(htmlBoardData)
        drawBoard()
    }
}

export function getBoardState() {
    return _boardState
}

const pieceSymbols = {
    "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
    "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙"
};
const pieceMap = {
    'br': 'r', 'bn': 'n', 'bb': 'b', 'bq': 'q', 'bk': 'k', 'bp': 'p',
    'wr': 'R', 'wn': 'N', 'wb': 'B', 'wq': 'Q', 'wk': 'K', 'wp': 'P'
};

const invPieceMap = invertObject(pieceMap)

function invertObject(obj) {
    const inverted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        inverted[obj[key]] = key;
      }
    }
    return inverted;
  }

export function parseBoard(html) {
    const divs = html.match(/<div class="piece (\w+) square-(\d{2})" uuid="([0-9]+)" style=""><\/div>/g);

    const updatedBoardState = Array(8).fill(null).map(() => Array(8).fill({}))
    
    divs.forEach(div => {
        const [, pieceClass, square, uuid] = div.match(/piece (\w+) square-(\d{2})" uuid="([0-9]+)" /)
        const piece = pieceMap[pieceClass]
        const row = 8 - parseInt(square[1])
        const col = parseInt(square[0]) - 1

        // if(updatedBoardState[row][col] && updatedBoardState[row][col].piece)

        updatedBoardState[row][col] = {piece, uuid}
    })

    let movements = []
    
    if(_boardState != undefined)
    {
        for (let r = 0; r < updatedBoardState.length; r++) {
            const row = updatedBoardState[r]
            if(row!={})
                for (let c = 0; c < updatedBoardState.length; c++) {
                    const col = row[c]
                    if(col.uuid) {
                        let uuid = col.uuid
                        let samePieceInLastSS = findInBoardstateByUuid(_boardState, uuid)
    
                        let compPackA = {r,c}
    
                        let compPackB = {r:samePieceInLastSS.r,c:samePieceInLastSS.c}
    
                        if(compPackA.r != compPackB.r || compPackA.c!= compPackB.c)
                            movements.push({from: compPackB, to: compPackA})
                    }
                }
        }
    }
    
    console.log(`Movements`, movements)
    
    movements.forEach(movement=>{
        movePiece({row: movement.from.r, col: movement.from.c}, {row: movement.to.r, col:movement.to.c})

    })
    
    _boardState = updatedBoardState
}

function findInBoardstateByUuid(boardstateVar, uuid)
{
    let out 
    for (let r = 0; r < boardstateVar.length; r++) {
        const row = boardstateVar[r]
        if(row!={})
            for (let c = 0; c < boardstateVar.length; c++) {
                const col = row[c]

                if(col.uuid == uuid)
                out = {
                    r,c,col
                }
            }
    }
    return out
}


export function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? "#eeeed2" : "#769656";
            ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            let piece = _boardState[row][col].piece;
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
    
    const updatedBoardState = structuredClone(_boardState)
   

    if (selectedPiece) {

        updatedBoardState[selectedPiece.row][selectedPiece.col] = "";
        updatedBoardState[row][col] = selectedPiece.piece;

        let fakeDivs = []
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                //If its a piece
                let bsp = updatedBoardState[r][c]
                if(Object.keys(bsp).length !== 0) {
                    let fakeDiv = `<div class="piece ${invPieceMap[bsp.piece]} square-${c+1}${updatedBoardState.length - (r)}" uuid="${bsp.uuid}" style=""></div>`
                    fakeDivs.push(fakeDiv)
                }
            }
        }
        console.log(fakeDivs)

        window.postMessage(fakeDivs.join('\n'), '*')

        // movePiece({row: selectedPiece.row, col: selectedPiece.col}, {row, col})
        selectedPiece = null;
        // drawBoard();
    } else if (_boardState[row][col]) {
        selectedPiece = { row, col, piece: _boardState[row][col] };
    }
});
