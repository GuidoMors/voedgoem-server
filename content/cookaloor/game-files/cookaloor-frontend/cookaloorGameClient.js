/*Script for handling server listeners and directing the game logic*/

doOnLoad();

//on load we set up an interval that will redraw
function doOnLoad(){

	setTimeout(function(){
		if (gameState == null){
			repeatRequestGameState();
		} 
	},  100);

	setInterval(function(){

		if ((gameState != null && gameState.isRunning) || intervalCounter == 0){
			if (startImages.length == 0){
				initStartAnimation();
			} else if (submitAnimImages.length == 0) {
				initializeAnimationImages();
			} else if (allTilesList != undefined && tilePictures.length == 0){
				initTileImages();
			} else if (allItemsList != undefined && allToolsList != undefined && itemImgs.length == 0){
				initItemImages();
			}
		}

		if (gameState != null && intermediateGameState != null && !isBusy && gameState.isRunning) {
			if (totalDraws > 0){
				moveQuickGameStateToTarget();
				totalDraws--;
			}
			if (!deviceIsControllerMode || !isRenderingForMobile()){
				isBusy=true;
				refreshObjects();
				isBusy=false;
			}

			document.body.style.transform = 'none';
			document.body.style.transformOrigin = '0 0'; 
			document.body.style.zoom = '100%';
		}

		intervalCounter = (intervalCounter + 1) % (FRAMES*5);

	}

	,  1000/FRAMES);
}

function repeatRequestGameState(){
	socket.emit(GAME_NAME+"_requestGameState"+gameId, socket.id);
	socket.emit(GAME_NAME+"_setMeAsControllerMode"+gameId, socket.id, userId, null);

	setTimeout(function(){
		if (gameState == null){
			repeatRequestGameState();
		} 
	},  500);
}

/** draws the entire gamestate, including all image objects for kitchen, players and items if the game is running
if the game is not runnning draws the lobby **/
function initializeGamestate(){
	
	if(gameState.isRunning){
		initKitchenImages();
		initPlayerImages();
		removeLobby();

		if (deviceIsControllerMode && isRenderingForMobile()){
			showControllerMode(true);
		} else {
			showControllerMode(false);
		}

		activateSideTab();

		initTouchEvents("pc");
		initClickEvents("pc");

		initTouchEvents("controller");
		initClickEvents("controller");

		if ( !intermediateGameState ) {
			socket.emit(GAME_NAME+"_requestIntermediateGameState"+gameId, socket.id);
		}
	} else {
		drawGameLobby();
		showControllerMode(false);
	}

}

function doOnReceiveGameSettings(newGameSettings){
	gameSettings=newGameSettings;
	if (allItemsList != undefined && allToolsList != undefined && allTilesList != undefined){
		initializeGamestate();
		isBusy = false;
		postGameDrawn = false;
		
	} else {
		socket.emit(GAME_NAME+"_requestIngredients"+gameId, socket.id);
	}

	if (gameState != null && gameState.isRunning ) {
		disableScroll();
	} else {
		enableScroll();
	}

}

function doOnReceiveGameState(newGameState, newGameId){
	gameId = newGameId;
	gameState=newGameState;
	isPlayer=isMePlayer();
	isHost=isMeHost();
	socket.emit(GAME_NAME+"_requestGameSettings"+gameId, socket.id);
	socket.emit(GAME_NAME+"_requestIntermediateGameState"+gameId, socket.id);
}

//we from time to time receive an IntermediateGameState. We only redraw things that change once every so often on Intermediate Change
function doOnReceiveIntermediateGameState(newIntermediateGameState){
	intermediateGameState=newIntermediateGameState;
	if (gameState != null && gameState.isRunning ) {
		if (!isBusy && allTilesList != undefined){
			drawRecipesLog();
			drawGameVisibility(true);
		}
		if ( intermediateGameState.gameTimer == -1) {
			drawPostGame();
		}
	} else {
		//drawDarkness();
	}
}

//quickGameStates are send many times per second.
function doOnReceiveQuickGameState(reducedQuickGameState){
	initMouseMoveEvent();

	if(intermediateGameState != undefined){
		quickGameState.players = {};
		for (var i = 0; i < reducedQuickGameState[0].length; i++){
			if (reducedQuickGameState[0][i] != -1) {
				var newUserId = reducedQuickGameState[0][i][2];

				if (targetXnY.players.length == 0 || intermediateGameState.gameTimer < 3) {
					var playerX = reducedQuickGameState[0][i][0];
					var playerY = reducedQuickGameState[0][i][1];
				} else {
					var playerX = targetXnY.players[newUserId].x;
					var playerY = targetXnY.players[newUserId].y;
				}
				quickGameState.players[newUserId] = {
					x: playerX,
					y: playerY,
					userId: newUserId,
					direction: {
						up: reducedQuickGameState[0][i][3][0],
						down: reducedQuickGameState[0][i][3][1],
						left: reducedQuickGameState[0][i][3][2],
						right: reducedQuickGameState[0][i][3][3],
					},
					hands: {
						items: reducedQuickGameState[0][i][4][0],
						tool: reducedQuickGameState[0][i][4][1],
						progress: reducedQuickGameState[0][i][4][2],
						progressType: reducedQuickGameState[0][i][4][3]
					}
				}

			}
		}

		targetXnY.players = {};
		for (var i = 0; i < reducedQuickGameState[0].length; i++){
			if (reducedQuickGameState[0][i] != -1) {
				var newUserId = reducedQuickGameState[0][i][2];
				targetXnY.players[newUserId] = {
					x: reducedQuickGameState[0][i][0],
					y: reducedQuickGameState[0][i][1],
				};
			}
		}


		quickGameState.items = [];
		for (var i = 0; i < reducedQuickGameState[1].length; i++){
			quickGameState.items[i] = {
				x: reducedQuickGameState[1][i][0],
				y: reducedQuickGameState[1][i][1],
				items: reducedQuickGameState[1][i][2],
				tool: reducedQuickGameState[1][i][3],
				progress: reducedQuickGameState[1][i][4],
				progressType: reducedQuickGameState[1][i][5],
			}
		}

		if (gameSettings != null){
			totalDraws = Math.floor(FRAMES/gameSettings.updateTimer);
		} else {
			totalDraws = 1;
		}
	}

}