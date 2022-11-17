/* 	Solver for a given ricochet robots board
	Hector Pelletier
	2022
*/

/*	Get DOM elements
*/

const solveTrigger = document.getElementById("solve");
const answer = document.getElementById("solution");
const displayedBoard = document.getElementById("board"); 
const setupButton = document.getElementById("place-robots");
const goalBotButton = document.getElementById("select-robot");
const contextMenu = document.getElementById("context-menu");
const setupBoardButton = document.getElementById("arrange-board");

/*	Initialize display for board
*/

const displayedBoardCells = []

for (let i = 0; i < 16; ++i) {
	displayedBoardCells.push([])
	for (let j = 0; j < 16; ++j) {
		cell = document.createElement("div");
		cell.id = i * 16 + j;
		displayedBoard.appendChild(cell);
		displayedBoardCells[i].push(cell);
	}
}


const updateCellWallsStyle = (cell, i, j) => {
	cell.classList.remove("north", "south", "east", "west");
	cell.classList.toggle("north", board[i][j] & N);
	cell.classList.toggle("south", board[i][j] & S);
	cell.classList.toggle("east", board[i][j] & E);
	cell.classList.toggle("west", board[i][j] & W);
}

const updateCellRobotsStyle = (cell, i, j) => {
	cell.classList.remove("red", "green", "blue", "yellow", "goal");
	cell.classList.toggle("red", R.x == j && R.y == i);
	cell.classList.toggle("green", G.x == j && G.y == i);
	cell.classList.toggle("blue", B.x == j && B.y == i);
	cell.classList.toggle("yellow", Y.x == j && Y.y == i);
	cell.classList.toggle("goal", GOAL.x == j && GOAL.y == i);
}

const updateCellStyle = (cell, i, j) => {
	updateCellWallsStyle(cell, i, j);
	updateCellRobotsStyle(cell, i, j);
}

/* 	Board representation
*/

const N = 0b0001;
const S = 0b0010;
const E = 0b0100;
const W = 0b1000;
const O = 0;

let board = [
	[N+W,N  ,N  ,N+E,N+W,N  ,N  ,N  ,N  ,N+E,N+W,N  ,N  ,N  ,N  ,N+E,],
	[W  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,S+E,W  ,E+S,],
	[W  ,O  ,O  ,O  ,O  ,S+E,W  ,O  ,O  ,S  ,O  ,O  ,O  ,N  ,O  ,E+N,],
	[W  ,O  ,S  ,O  ,O  ,N  ,O  ,O  ,E  ,N+W,O  ,O  ,O  ,O  ,S  ,E  ,],
	[W+S,O  ,N+E,W  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,E+N,E+W,],
	[W+N,S  ,O  ,O  ,O  ,O  ,E  ,S+W,O  ,O  ,O  ,O  ,O  ,O  ,O  ,E  ,],
	[W+E,W+N,O  ,O  ,O  ,O  ,O  ,S+N,S  ,O  ,O  ,E  ,S+W,O  ,O  ,E  ,],
	[W  ,O  ,O  ,O  ,O  ,O  ,E  ,N+W,N+E,W  ,O  ,O  ,N  ,O  ,O  ,E  ,],
	[W  ,O  ,O  ,O  ,O  ,O  ,E  ,S+W,S+E,W  ,O  ,O  ,O  ,O  ,O  ,E  ,],
	[W  ,O  ,O  ,E  ,W+S,O  ,S  ,N  ,N  ,O  ,O  ,O  ,E  ,S+W,O  ,E  ,],
	[W+S,O  ,O  ,O  ,N  ,E  ,N+W,O  ,O  ,O  ,O  ,O  ,O  ,N  ,O  ,E  ,],
	[W+N,O  ,O  ,O  ,O  ,O  ,O  ,S  ,O  ,S+E,W  ,O  ,O  ,O  ,O  ,E+S,],
	[W  ,S  ,O  ,O  ,O  ,O  ,O  ,N+E,W  ,N  ,O  ,O  ,O  ,O  ,S  ,E+N,],
	[W  ,N+E,W  ,O  ,O  ,O  ,O  ,O  ,O  ,O  ,S  ,O  ,O  ,O  ,N+E,E+W,],
	[W  ,O  ,O  ,S+E,W  ,O  ,O  ,O  ,O  ,E  ,N+W,O  ,O  ,O  ,O  ,E  ,],
	[S+W,S  ,S  ,S+N,S+E,S+W,S  ,S  ,S  ,S  ,S  ,S+E,S+W,S  ,S  ,S+E,],
];

if (sessionStorage.getItem("board")) {
	board = JSON.parse(sessionStorage.getItem("board"));
}


/* 	Initial position of the robots and goal
*/

let R = {x: 0, y: 0,};
let G = {x: 12,y: 5,};
let B = {x: 1, y: 2,};
let Y = {x: 7, y: 4,};
let GOAL = {x: 1, y: 13,};

if (sessionStorage.getItem("pieces")) {
	pieces = JSON.parse(sessionStorage.getItem("pieces"));
	R = pieces.R;
	G = pieces.G;
	B = pieces.B;
	Y = pieces.Y;
	GOAL = pieces.GOAL;
}

/* Aim of the puzzle
*/

let goalBot = "red";

const isSolved = (r, g, b, y) => {
	let bot = {"red":r, "blue":b, "green":g, "yellow":y}[goalBot];
	return bot.x == GOAL.x && bot.y == GOAL.y;
};

/*	Display robots, goals, walls.
*/

for (let i = 0; i < 16; ++i) {
	for (let j = 0; j < 16; ++j) {
		cell = displayedBoardCells[i][j];
		updateCellStyle(cell, i, j);
	}
}

/*	Handling the setup of pieces
*/

const initialPos = {"red": R, "blue": B, "green": G, "yellow": Y,  "orange": GOAL};

let piecesSetupState = "red";

const unsetSetupMode = () => {
	for (let i = 0; i < 16; ++i) {
		for (let j = 0; j < 16; ++j) {
			cell = displayedBoardCells[i][j];
			let newCell = cell.cloneNode(true);
			cell.parentNode.replaceChild(newCell, cell);
			displayedBoardCells[i][j] = newCell;
		}
	}
};

const setSelectFunction = (i, j) => {
	const setupHook = () => {
		bot = initialPos[piecesSetupState];
		let oldX = bot.x;
		let oldY = bot.y;
		bot.x = j;
		bot.y = i;
		updateCellRobotsStyle(displayedBoardCells[oldY][oldX], oldY, oldX);
		updateCellRobotsStyle(displayedBoardCells[i][j], i, j);
		
		switch(piecesSetupState) {
			case "red":
				piecesSetupState = "green";
				break;
			case "green":
				piecesSetupState = "blue";
				break;
			case "blue":
				piecesSetupState = "yellow";
				break;
			case "yellow":
				piecesSetupState = "orange";
				break;
			case "orange":
				unsetSetupMode();
				sessionStorage.setItem("pieces", JSON.stringify({R: R, G: G, B: B, Y: Y, GOAL: GOAL,}));
				break;
		}
	};
	
	return setupHook;
};

const setSetupMode = () => {
	piecesSetupState = "red";
	for (let i = 0; i < 16; ++i) {
		for (let j = 0; j < 16; ++j) {
			cell = displayedBoardCells[i][j];
			cell.addEventListener("click", setSelectFunction(i, j));
		}
	}
};

setupButton.addEventListener("click", setSetupMode);

/*	Handling the selection of the goal bot
*/

const selectBotFun = (color) => {
	const selectBotHook = () => {
		goalBot = color;
		contextMenu.innerHTML = '';
	};
	return selectBotHook;
};

const selectBotHook = () => {
	for (botColor of ["red", "green", "blue", "yellow"]) {
		let buttonColor = document.createElement("button");
		buttonColor.textContent = botColor;
		buttonColor.addEventListener("click", selectBotFun(botColor));
		contextMenu.appendChild(buttonColor);
	}
};

goalBotButton.addEventListener("click", selectBotHook);

/*	Setting up the board.
*/

let boardSetupState = false;
let selected = null;

const getWallSetupFun = (i, j) => {
	const setupCellFun = () => {
		
		if (selected) {
			displayedBoardCells[selected.i][selected.j].classList.toggle("selected");
		}
		
		selected = {i: i, j: j};
		displayedBoardCells[i][j].classList.toggle("selected");
		
		contextMenu.innerHTML = '';
		
		const up = document.createElement("button");
		up.textContent = "upper wall";
		const toggleUpperWall = () => {
			if (i > 0) {
				board[i][j] ^= N;
				board[i-1][j] ^= S;
				updateCellWallsStyle(displayedBoardCells[i][j], i, j);
				updateCellWallsStyle(displayedBoardCells[i-1][j], i-1, j);
			}
			sessionStorage.setItem("board", JSON.stringify(board));
		};
		up.addEventListener("click", toggleUpperWall);
		
		const down = document.createElement("button");
		down.textContent = "bottom wall";
		const toggleBottomWall = () => {
			if (i < 15) {
				board[i][j] ^= S;
				board[i+1][j] ^= N;
				updateCellWallsStyle(displayedBoardCells[i][j], i, j);
				updateCellWallsStyle(displayedBoardCells[i+1][j], i+1, j);
			}
			sessionStorage.setItem("board", JSON.stringify(board));
		};
		down.addEventListener("click", toggleBottomWall);
		
		const right = document.createElement("button");
		right.textContent = "right wall";
		const toggleRightWall = () => {
			if (j < 15) {
				board[i][j] ^= E;
				board[i][j+1] ^= W;
				updateCellWallsStyle(displayedBoardCells[i][j], i, j);
				updateCellWallsStyle(displayedBoardCells[i][j+1], i, j+1);
			}
			sessionStorage.setItem("board", JSON.stringify(board));
		};
		right.addEventListener("click", toggleRightWall);
		
		const left = document.createElement("button");
		left.textContent = "left wall";
		const toggleLeftWall = () => {
			if (j > 0) {
				board[i][j] ^= W;
				board[i][j-1] ^= E;
				updateCellWallsStyle(displayedBoardCells[i][j], i, j);
				updateCellWallsStyle(displayedBoardCells[i][j-1], i, j-1);
			}
			sessionStorage.setItem("board", JSON.stringify(board));
		};
		left.addEventListener("click", toggleLeftWall);
		
		contextMenu.appendChild(up);
		contextMenu.appendChild(down);
		contextMenu.appendChild(left);
		contextMenu.appendChild(right);
	};
	return setupCellFun;
};

const setupBoardHook = () => {
	if (boardSetupState) {
		for (let i = 0; i < 16; ++i) {
			for (let j = 0; j < 16; ++j) {
				cell = displayedBoardCells[i][j];
				let newCell = cell.cloneNode(true);
				cell.parentNode.replaceChild(newCell, cell);
				displayedBoardCells[i][j] = newCell;
			}
		}
		contextMenu.innerHTML = '';
		boardSetupState = false;
	} else {
		for (let i = 0; i < 16; ++i) {
			for (let j = 0; j < 16; ++j) {
				cell = displayedBoardCells[i][j];
				cell.addEventListener("click", getWallSetupFun(i,j));
			}
		}
		boardSetupState = true;
	}
};

setupBoardButton.addEventListener("click", setupBoardHook);

/*	Moves and blocking walls
*/

const moveFromPos = (p, displacement, b1, b2, b3) => {
	while (! (board[p.y][p.x] & displacement.block)) {
		p.x += displacement.ix;
		p.y += displacement.iy;
		if ( (p.x == b1.x && p.y == b1.y)
			|| (p.x == b2.x && p.y == b2.y)
			|| (p.x == b3.x && p.y == b3.y)
		) {
			p.x -= displacement.ix;
			p.y -= displacement.iy;
			break;
		}
	}
	return {x: p.x, y: p.y};
}

const gameStateWith = (color, displacement, moves, r, g, b, y) => {
	let nr = {x: r.x, y: r.y};
	let ng = {x: g.x, y: g.y};
	let nb = {x: b.x, y: b.y};
	let ny = {x: y.x, y: y.y};
	switch (color) {
		case "red":
			nr = moveFromPos(nr, displacement, ng, nb, ny);
			break;
		case "green":
			ng = moveFromPos(ng, displacement, nr, nb, ny);
			break;
		case "blue":
			nb = moveFromPos(nb, displacement, nr, ng, ny);
			break;
		case "yellow":
			ny = moveFromPos(ny, displacement, nr, ng, nb);
			break;
	}
	return {moves: moves.concat(color, displacement.name), r: nr, g: ng, b: nb, y: ny};
}

const intFromPos = (r, g, b, y) => {
	let code = r.x;
	code = code * 100 + r.y;
	code = code * 100 + g.x;
	code = code * 100 + g.y;
	code = code * 100 + b.x;
	code = code * 100 + b.y;
	code = code * 100 + y.x;
	code = code * 100 + y.y;
	return code;
};

/*	How the solver works:
		- Depop the next position.
		- If the position is solved:
			- end and display
		- If the position is already seen:
			- break
		- If the position was never seen:
			- For each possible move
				- Add the new position with correct move list to the queue
			- Add the current position to the already seen set
*/

const colors = ["red", "green", "blue", "yellow"];
const displacements = [
		{name: "up", ix: 0, iy: -1, block: N},
		{name: "down", ix: 0, iy: 1, block: S},
		{name: "right", ix: 1, iy: 0, block: E},
		{name: "left", ix: -1, iy: 0, block: W},
	  ];

const solve = () => {
	/*	Data structure used for queuing the moves
	At the moment, this is done using an over simple implementation.
	*/
	const queue = [{moves: [], r: R, g: G, b: B, y: Y}];
	
	/*	Data structure used for the search pruning
	*/
	const seenPositions = new Set();
	
	seenPositions.add(intFromPos(R, G, B, Y));
	do {
		let {moves, r, g, b, y} = queue.shift();
		if (isSolved(r, g, b, y)) {
			return moves;
		} else {
			for (const color of colors) {
				for (const displacement of displacements) {
					let forwardState = gameStateWith(color, displacement, moves, r, g, b, y);
					let forwardCode = intFromPos(forwardState.r, forwardState.g, forwardState.b, forwardState.y)
					if (! seenPositions.has(forwardCode)) {
						seenPositions.add(forwardCode);
						queue.push(forwardState);
					}
				}
			}
		}
	} while (queue.length && queue[0].moves.length < 32);
	return [];
}

const formatSolve = (moves) => {
	if (! moves.length) {
		return `<h2>No found solution</h2>`;
	}
	
	solveString = `<h2>The optimal solution takes ${moves.length / 2} moves</h2><p>`;
	for (let i = 0; i < moves.length; ++i) {
		solveString += `<font style="background-color:${moves[i]}">`;
		++i;
		switch (moves[i]) {
			case "up":
				solveString += "ᐃ";
				break;
			case "down":
				solveString += "ᐁ";
				break;
			case "right":
				solveString += "ᐅ";
				break;
			case "left":
				solveString += "ᐊ";
				break;
		} 
		solveString += "</font>, ";
	}
	solveString += "</p>";
	return solveString;
}

const solveAction = () => {
	const start = Date.now();
	answer.innerHTML = formatSolve(solve());
	console.log(Date.now() - start);
}

solveTrigger.addEventListener("click", solveAction);


