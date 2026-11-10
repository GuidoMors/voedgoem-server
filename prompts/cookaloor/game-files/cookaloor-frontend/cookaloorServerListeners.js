/*Script for communicating with the server*/

socket.on(GAME_NAME+"_receiveGameState", function(newGameState, newGameId){
	doOnReceiveGameState(newGameState, newGameId);
});

socket.on(GAME_NAME+"_receiveGameSettings", function(newGameSettings){
	doOnReceiveGameSettings(newGameSettings);
});

socket.on(GAME_NAME+"_receiveIntermediateGameState", function(newIntermediateGameState){
	doOnReceiveIntermediateGameState(newIntermediateGameState);
});


socket.on(GAME_NAME+"_receiveQuickGameState", function(newQuickGameState){	
	doOnReceiveQuickGameState(newQuickGameState);
});

socket.on(GAME_NAME+"_plateSubmitted", function(deltaScore, userId, x,y){	
	submitAnimations.push({score:deltaScore, x:x,y:y, userId:userId, timer:0});
});

socket.on(GAME_NAME+"_receiveDispensers", function(reducedDispensers){	
	quickGameState.dispensers = [];
	for (var i = 0; i < reducedDispensers.length; i++){
		quickGameState.dispensers[i] = {
			x: reducedDispensers[i][0],
			y: reducedDispensers[i][1],
			tile: reducedDispensers[i][2],
			charges: reducedDispensers[i][3],
			secondsSinceLastCharged: reducedDispensers[i][4],
			overCharge: reducedDispensers[i][5],
			rate: reducedDispensers[i][6]
		}
	}
});

//first Ingredients, then Tools, lastly Tiles

socket.on(GAME_NAME+"_receiveIngredients", function(newAllItemsList){
	allItemsList=newAllItemsList;
	
	if (allToolsList != undefined  && allTilesList != undefined){
		initializeGamestate();
		isBusy = false;
		postGameDrawn = false;
		
	} else {
		socket.emit(GAME_NAME+"_requestTools"+gameId, socket.id);
	}

});

socket.on(GAME_NAME+"_receiveTools", function(newAllToolsList){

	allToolsList=newAllToolsList;
	if (allTilesList != undefined){
		initializeGamestate();
		
		isBusy = false;
		postGameDrawn = false;
		
	} else {
		socket.emit(GAME_NAME+"_requestTiles"+gameId, socket.id);
	}

});

socket.on(GAME_NAME+"_receiveTiles", function(newAllTilesList){
	allTilesList=newAllTilesList;
	initializeGamestate();

	isBusy = false;
	postGameDrawn = false;
});

socket.on(GAME_NAME+"_receiveMeAsController", function(isController){
	deviceIsControllerMode = isController;
	if(gameState.isRunning){
		showControllerMode(isController);
	}
});
	


