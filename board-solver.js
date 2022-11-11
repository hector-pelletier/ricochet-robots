/* 	Solver for a given ricochet robots board
	Hector Pelletier
	2022
*/

/*	Search principle:
	We use a tree search, breath-first.
	Some pruning is done using a hash set.
	(Later) Once a solution is found the other possibilities are looked at,
	to optimize the number of robots used.
	(Later) More can be pruned ? If a solution has been found in n moves, can there be a shorter one ?
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

/* 	Board representation
*/

const N = 0b0001;
const S = 0b0010;
const E = 0b0100;
const W = 0b1000;
const O = 0;

const board = [
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

/*	How the board should be displayed
*/

for (let i = 0; i < 16; ++i) {
	for (let j = 0; j < 16; ++j) {
		cell = displayedBoardCells[i][j];
		walls = board[i][j];
		cell.style.borderTopWidth = (walls & N) ? "medium" : "thin";
		cell.style.borderLeftWidth = (walls & W) ? "medium" : "thin";
		cell.style.borderRightWidth = (walls & E) ? "medium" : "thin";
		cell.style.borderBottomWidth = (walls & S) ? "medium" : "thin";
	}
}

/* 	Initial position of the robots
*/

const R = {x: 0, y: 0,};
const G = {x: 12,y: 5,};
const B = {x: 1, y: 2,};
const Y = {x: 7, y: 4,};

/*	Goal of the puzzle
*/

const GOAL = {x: 1, y: 13,};

const isSolved = (r, g, b, y) => {
	let bot = {"red":r, "blue":b, "green":g, "yellow":y}[goalBot];
	return bot.x == GOAL.x && bot.y == GOAL.y;
};

/*	Display robots and goal
*/

displayedBoardCells[R.y][R.x].classList.toggle("red");
displayedBoardCells[G.y][G.x].classList.toggle("green");
displayedBoardCells[B.y][B.x].classList.toggle("blue");
displayedBoardCells[Y.y][Y.x].classList.toggle("yellow");
displayedBoardCells[GOAL.y][GOAL.x].style.backgroundColor = "orange";

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

const setSelectFunction = (X, Y) => {
	const setupHook = () => {
		bot = initialPos[piecesSetupState];
		displayedBoardCells[bot.y][bot.x].style.backgroundColor = "#eeeee4";
		bot.x = X;
		bot.y = Y;
		displayedBoardCells[bot.y][bot.x].style.backgroundColor = piecesSetupState;
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
			cell.addEventListener("click", setSelectFunction(j, i));
		}
	}
};

setupButton.addEventListener("click", setSetupMode);

/*	Handling the selection of the goal bot
*/

let goalBot = "red";

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

const getWallSetupFun = (i, j) => {
	const setupCellFun = () => {
		contextMenu.innerHTML = '';
		
		const up = document.createElement("button");
		up.textContent = "upper wall";
		const toggleUpperWall = () => {
			if (i > 0) {
				board[i][j] ^= N;
				board[i-1][j] ^= S;
				displayedBoardCells[i][j].style.borderTop = (board[i][j] & N) ? "solid" : "none";
				displayedBoardCells[i-1][j].style.borderBottom = (board[i][j] & N) ? "solid" : "none";
			}
		};
		up.addEventListener("click", toggleUpperWall);
		
		const down = document.createElement("button");
		down.textContent = "bottom wall";
		const toggleBottomWall = () => {
			if (i < 15) {
				board[i][j] ^= S;
				board[i+1][j] ^= N;
				displayedBoardCells[i][j].style.borderBottom = (board[i][j] & S) ? "solid" : "none";
				displayedBoardCells[i+1][j].style.borderTop = (board[i][j] & S) ? "solid" : "none";
			}
		};
		down.addEventListener("click", toggleBottomWall);
		
		const right = document.createElement("button");
		right.textContent = "right wall";
		const toggleRightWall = () => {
			if (j < 15) {
				board[i][j] ^= E;
				board[i][j+1] ^= W;
				displayedBoardCells[i][j].style.borderRight = (board[i][j] & E) ? "solid" : "none";
				displayedBoardCells[i][j+1].style.borderLeft = (board[i][j] & E) ? "solid" : "none";
			}
		};
		right.addEventListener("click", toggleRightWall);
		
		const left = document.createElement("button");
		left.textContent = "left wall";
		const toggleLeftWall = () => {
			if (j > 0) {
				board[i][j] ^= W;
				board[i][j-1] ^= E;
				displayedBoardCells[i][j].style.borderLeft = (board[i][j] & W) ? "solid" : "none";
				displayedBoardCells[i][j-1].style.borderRight = (board[i][j] & W) ? "solid" : "none";
			}
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

/*	Data structure used for the search pruning
*/

const seenPositions = new Set();
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

/*	Data structure used for queuing the moves
	At the moment, this is done using an over simple implementation.
*/

const queue = [{moves: [], r: R, g: G, b: B, y: Y}];

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

const solve = () => {
	do {
		let {moves, r, g, b, y} = queue.shift();
		let code = intFromPos(r, g, b, y);
		
		if (seenPositions.has(code)) {
			continue;
		} else {
			seenPositions.add(code);
			if (isSolved(r, g, b, y)) {
				return moves;
			} else {
				colors = ["red", "green", "blue", "yellow"];
				displacements = [
					{name: "up", ix: 0, iy: -1, block: N},
					{name: "down", ix: 0, iy: 1, block: S},
					{name: "right", ix: 1, iy: 0, block: E},
					{name: "left", ix: -1, iy: 0, block: W},
				];
				for (const color of colors) {
					for (const displacement of displacements) {
						queue.push(gameStateWith(color, displacement, moves, r, g, b, y));
					}
				}
			}
		}

	} while (queue.length);
}

const formatSolve = (moves) => {
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
	answer.innerHTML = formatSolve(solve());
}

solveTrigger.addEventListener("click", solveAction);


