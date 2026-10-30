/*Script for general client-Side functions*/

// updates the coordinates of all image objects in the canvas, or if the game is not running draws the lobby
function refreshObjects(){
	
	adjustWrapperStyling();

	if(gameState.isRunning){
		if(allFloorImagesLoaded() && allMaskImagesLoaded() && allOutlineImagesLoaded() && quickGameState!= undefined && allTilesList != undefined && allToolsList != undefined){
			if(!isFloorDrawn){
			drawFloorImages();
			isFloorDrawn=true;
			}
			
			clearCanvas();
			for (var i = 0; i < gameState.map.grid.length; i++) {
				drawKitchen(i);
				drawItems(i);
				drawDispenserCharges(i);
				drawPlayers(i, "body");
				if(i>0){
					drawPlayers(i-1, "toponly");
				}
			}
			drawSubmitAnimations();
			drawRecipesLog();
			incrementIndexes();
		}
		if (intermediateGameState != undefined){
			if ( intermediateGameState.gameTimer == -1) {
				drawPostGame();
			} else if (intermediateGameState.gameTimer < 5) {
				drawStartAnimation();
			} else if (intermediateGameState.gameTimer-5<3){
				clearOverlayCanvas();
			}
		}
	}
	else{
		drawGameLobby();
	}
}

function adjustWrapperStyling(){

	var me = null;
	for (var i=0; i< gameState.players.length;i++){
		var player = quickGameState.players[gameState.players[i].userId];
		if (player != null && player.userId == userId) {
			me = player;
			i = gameState.players.length;
		}
	}

	var wrapper = document.getElementById("canvasWrapper");
	
	var viewportWidth = window.visualViewport.width;
	var viewportHeight = window.visualViewport.height;
	var mapwidth = gameSettings.tileSizeW*gameState.map.grid[0].length;

	if ( viewportHeight > 800 && viewportWidth > 1200){
		//we device with is nromal. 

		if (typeof me == 'undefined' || me == null) {
			//render the total map like an observer
			wrapper.style.width = window.visualViewport.width*0.797;
			wrapper.style.height = window.visualViewport.height;
			wrapper.style.left = 0;
			wrapper.style.top = 0;
			return;
		} 

		//move the map slightly along with the player
		newWrapperWidth = viewportHeight*(16/9);
		wrapper.style.width = newWrapperWidth;
		wrapper.style.height = viewportHeight;
		
		var playerdistanceratio = (me.x/mapwidth);
		
		var xoffset = (viewportWidth/2)-(newWrapperWidth*playerdistanceratio);
		wrapper.style.left = xoffset/1.45;
		wrapper.style.top = 0;

		return;
	} 
	
	if (me == null) {
		// we are an observer on a small device
		// try to spectate the first player in the gameState, otherwise render entire map
		
		if (gameState != null && gameState.players.length > 0){
			me = quickGameState.players[gameState.players[0].userId];
		}
		if (me == null) {
			wrapper.style.width = window.visualViewport.width;
			wrapper.style.height = window.visualViewport.height;
			wrapper.style.left = 0;
			wrapper.style.top = 0;
			return;
		}
	} 
	
	if ( viewportHeight < 800){
		// the device has a very small height, we zoom in on our guy and render the canvas moving in both x and y
		newWrapperWidth = viewportHeight*(16/9)*1.5;
		newWrapperHeight = viewportHeight*1.5;
		wrapper.style.width = newWrapperWidth;
		wrapper.style.height = newWrapperHeight;
			
		var mapwidth = gameSettings.tileSizeW*gameState.map.grid[0].length;
		var playerdistanceratio = (me.x/mapwidth);
		var xoffset = (viewportWidth/2)-(newWrapperWidth*playerdistanceratio);
		wrapper.style.left = xoffset;

		var mapheight = gameSettings.tileSizeH*gameState.map.grid.length;
		var playerdistanceratio = (me.y/mapheight);
		var yoffset = -(viewportHeight/2)+(newWrapperHeight*playerdistanceratio);
		wrapper.style.top = -yoffset;

	} else {
		//the device is most likely a mobile phone. It has a tall height but a small width. we render the canvas with full heigh and moving x
		newWrapperWidth = viewportHeight*(16/9);
		wrapper.style.width = newWrapperWidth;
		wrapper.style.height = viewportHeight;
			
		var mapwidth = gameSettings.tileSizeW*gameState.map.grid[0].length;
		var playerdistanceratio = (me.x/mapwidth);
		
		var xoffset = (viewportWidth/2)-(newWrapperWidth*playerdistanceratio);
		wrapper.style.left = xoffset;
		wrapper.style.top = 0;

	}


}

function preventTouchMove(e) {
    e.preventDefault();
}

function setMap(id){

	socket.emit(GAME_NAME+"_setMap"+gameId, id);
	
}

function getItemObjectById(itemId){
	var item=Object.values(allItemsList)[itemId];
	return item;
	
}

function getRowFromYCoordinate(y) {
	return parseInt(y/gameSettings.tileSizeH); 
}

function moveQuickGameStateToTarget(){
	if (totalDraws > 0) {
		for (var id in quickGameState.players){
			var qgPlayer = quickGameState.players[id];
			var xnyPlayer = targetXnY.players[id];
			var xDif = (xnyPlayer.x - qgPlayer.x)/totalDraws;
			var yDif = (xnyPlayer.y - qgPlayer.y)/totalDraws;
			quickGameState.players[id].x = quickGameState.players[id].x + xDif;
			quickGameState.players[id].y = quickGameState.players[id].y + yDif;
		}
	}
}


function isRenderingForMobile() {
    return window.matchMedia("(max-width: 1200px)").matches;
}

function toggleControllerOption(){
	deviceIsControllerMode = !deviceIsControllerMode;
	if(gameState.isRunning){
		showControllerMode(deviceIsControllerMode);
	}
	socket.emit(GAME_NAME+"_setMeAsControllerMode"+gameId, socket.id, userId, deviceIsControllerMode);
}

function getMyTeam(){
	return getUserIdTeam(getUserId());
  }
  

  function getUserIdTeam(checkUserId){
	for(var i=0;i<gameState.players.length;i++){
		if(gameState.players[i].userId == checkUserId){
		return gameState.players[i].team;
		}
	}
	return 0;
}
