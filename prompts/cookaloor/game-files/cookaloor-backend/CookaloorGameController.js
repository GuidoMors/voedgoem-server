(function(exports) { 

var CharacterHandler=require("./../common/CharacterHandler.js");
var CommonGameController=require("./../common/CommonGameController.js");
var Movement2DGrid=require("./../common/Movement2DGrid.js");
var ItemInteraction2DGrid=require("./../common/ItemInteraction2DGrid.js");
var MapHandler2DGrid=require("./../common/MapHandler2DGrid.js");
var Tools = require('./../../static/common/tools.js');	
var CookaloorResourceManager= require("./CookaloorResourceManager.js");
var CharacterLoader2DGrid=require("./../common/CharacterLoader2DGrid.js");
var fs = require("fs");

var GAME_NAME="Cookaloor";
var NONE="none";


/*
Idea: Overcooked-Clone with teams where you can block each other.

-players in teams
-ingredients (salad, tomato, bread,...)
-current_combinations (salad on bread,...)
-recipes (wanted combinations
-ingredients have a state (raw->cooked->burned; whole->chopped)
-"cookingstations" where you can cook stuff (put it in the container; come back and pick up later)
-"cookingstations" where you can chop (use it; you keep item in inventory/hands)
-every player may hold 1 ingredient OR a combination. place ingredient on other ingredient or on a combination will combine it)
-combinations only legal/count if they start on a plate. else ingr dont combine either.
-plates have to be washed 
-finished recipes have to be handed in somewhere => place to drop off a filled plate; evaluate if recipe was proper.
-players block each other (Collision)



*/

var TILESIZEWIDTH = 64;
var TILESIZEHEIGHT = 64;


class CookaloorGameController extends CommonGameController{
//constructor(gameType, gameId, host, gameName, io, server,  isQuickGame) {  
	constructor(gameId, host, gameName, io, server) {  
		super(GAME_NAME, gameId, host, gameName, io, server,  true);
		
		var hatColor = [10,100,255];
		var faceColor = [150,75,10];
		var bodyColor = [15,200,0];
		var defaultCustomCharacter = {body: CharacterLoader2DGrid.customBodies[0].name, 
						hat: CharacterLoader2DGrid.customHats[0].name, 
						face: CharacterLoader2DGrid.customFaces[0].name, 
						hatColor:hatColor, faceColor:faceColor, bodyColor:bodyColor, 
						hasHatMask: false, hasFaceMask: false, hasBodyMask: false};
		var customizationOptions={customHats:CharacterLoader2DGrid.customHats,customFaces:CharacterLoader2DGrid.customFaces,customBodies:CharacterLoader2DGrid.customBodies};
		this.characterHandler=new CharacterHandler(this,io, gameId, defaultCustomCharacter, customizationOptions);
		this.movementHandler=new Movement2DGrid(this,io, gameId, 18, "team");
		this.itemHandler=new ItemInteraction2DGrid(this,io,gameId, 40, false);
		this.mapHandler=new MapHandler2DGrid(this, io,gameId, TILESIZEWIDTH,TILESIZEHEIGHT);		
		
		this.gameState={
			players:[], 
			isRunning:false,
			host:this.gameHost,
			gameId:this.gameId,
			gameType:this.gameType,
			gameName:this.gameName,
			gameTimer: 0,
			difficulty: 1,
			currentGamePhase:0,
			map:{id:0, name:"", grid:[[]]}
		};
		this.intermediateGameState={
			gameTimer:0,
			isPaused:false,
		};

		this.controllerModeList=[],

		this.gameSettings = {
			playerDisplayWidth: 70, 
			playerDisplayHeight: 120,
			playerCollisionWidth: 30,
			playerCollisionHeight: 30, 
			updateTimer: 14, //25, 10 //5,50 or 18,15
			tileSizeW: TILESIZEWIDTH, tileSizeH: TILESIZEHEIGHT,
			ingredientSizeW: 40, ingredientSizeH: 42,
			toolSizeW: 54, toolSizeH: 54,
			startingRecipes: 2, //redefined in startGame();
			difficultyTimeInterval: 240, //240=4mins
			recipeExpireInterval: 120, //120=2mins
			maxDifficulty: 6,
			playerHandsHeightModifier: 30,
			negativeScoreRecipeExpired: 50,
			negativeScoreRecipeFailed: 25,
			map: "groupbananza",
			kitchenList: [],
			//GAME MODES
			//0 = game ends when timer runs out. team with highest score wins
			//1 = lives: everyone starts with X lives. everytime a recipe expires, a life is lost. last team standing wins
			//2 = game ends when the first team reached a certain score
			//GAMEMODEVALUE if gameMode 0: amount seconds. gameMode=2? amount lives to start with. gameMode 3? targetScore
			gameMode:1,
			gameModeValue: 4
		};
		
		this.makeKitchenList();
		this.lastUpdateTime = (new Date()).getTime();
		this.freshVariables();		
	}	
	
	
	//should be called each time you want a fresh game
	freshVariables(){
		this.gameState.isRunning= false;
		this.getMyGameRoom().isRunning= false;
		this.gameState.difficulty = 1;
		this.gameState.currentGamePhase = 0;
		for (var i=0;i<this.gameState.players.length;i++){
			this.gameState.players[i].movement = {left: false, right: false, up: false, down: false};
		}		
		this.gameState.dispensers=[];			
		this.intermediateGameState={ recipes:[], gameTimer:0, score:{isWon: false}};
	}

	
	defineServerListenersFor(socket){
		socket.on(this.gameType+"_startGame"+this.gameId, () => this.startGame() );
		socket.on(this.gameType+"_finishGame"+this.gameId, () => this.finishGame() );
		socket.on(this.gameType+"_requestGameState"+this.gameId, socketId => this.giveGameStateToSocket(socketId) );
		socket.on(this.gameType+"_requestIntermediateGameState"+this.gameId, socketId => this.refreshIntermediateGameInfo(socketId) );
		socket.on(this.gameType+"_requestGameSettings"+this.gameId, socketId => this.giveGameSettingsToSocket(socketId) );
		socket.on(this.gameType+"_attemptPauseAction"+this.gameId, userId => this.attemptPauseAction(socket, userId));
		socket.on(this.gameType+"_requestIngredients"+this.gameId, socketId => this.giveIngredientsToSocket(socketId) );
		socket.on(this.gameType+"_requestTools"+this.gameId, socketId => this.giveToolsToSocket(socketId) );
		socket.on(this.gameType+"_requestTiles"+this.gameId, socketId => this.giveTilesToSocket(socketId) );
		socket.on(this.gameType+"_setMap"+this.gameId, mapId => this.setMap(mapId));
		socket.on(this.gameType+"_setMeAsControllerMode"+this.gameId, (socketId, playerId, isController) => this.refreshPlayerAsControllerMode(socketId, playerId, isController));
	}
	
	deleteListeners(){
		this.io.removeAllListeners([this.gameType+"_startGame"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_finishGame"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_requestGameState"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_requestIntermediateGameState"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_requestGameSettings"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_attemptPauseAction"+this.gameId]);
		this.io.removeAllListeners([GAME_NAME+"_requestIngredients"]);
		this.io.removeAllListeners([GAME_NAME+"_requestTiles"]);
		this.io.removeAllListeners([GAME_NAME+"_requestTools"]);
		this.io.removeAllListeners([this.gameType+"_setMap"+this.gameId]);
		this.io.removeAllListeners([this.gameType+"_setMeAsController"+this.gameId]);
	}	
	
	deleteYourself(){
		this.stopGame();
		super.deleteYourself();
	}
	
	doOnIntermediateTimer(){
		this.checkWinConditions();
		this.checkDifficultyPhase();
		this.itemHandler.updateDispensers();
		this.countdownRecipeTimers();
	}
	
	doOnRunTimer(){
		var currentTime = (new Date()).getTime();
		var timeDifference = currentTime - this.lastUpdateTime;		
		this.lastUpdateTime = (new Date()).getTime();	
		
		if(this.intermediateGameState.gameTimer >= 5){		
			var stepSizeModifier=timeDifference / (1000/this.gameSettings.updateTimer);
			this.movementHandler.movePlayers(stepSizeModifier);	
		}		
		
	}

	setMap(id){
		this.gameSettings.map = id;
		this.giveGameStates();
	}

	refreshPlayerAsControllerMode(socketId, playerId, isController){

		if(isController == null ){
			if (this.controllerModeList.hasOwnProperty(playerId)) {
				isController = this.controllerModeList[playerId];
			} else {
				isController = false;
			}
		} else {
			this.controllerModeList[playerId] = isController;
		}
		
		this.io.to(socketId).emit(GAME_NAME+"_receiveMeAsController", isController);	
	}
	
	refreshQuickGameInfo(){	
		var reducedQuickGameState = [];
		reducedQuickGameState[0] = [];
		for (var i = 0; i < this.gameState.players.length; i++){		
			var player = this.gameState.players[i];		
			if (player != null) {
				var x = Math.floor(player.x);
				var y = Math.floor(player.y);
				reducedQuickGameState[0][i] = 
				[
					x,
					y,
					player.userId, 
					[player.direction.up, player.direction.down, player.direction.left, player.direction.right],
					[player.hands.items, player.hands.tool, player.hands.progress, player.hands.progressType],
				];
			} else {
				reducedQuickGameState[0][i] = -1;
			}
		}
		reducedQuickGameState[1] = [];
		for (var i = 0; i < this.gameState.items.length; i++){
			var item = this.gameState.items[i];
			reducedQuickGameState[1][i] = 
			[
				item.x,
				item.y,
				item.items,
				item.tool,
				item.progress,
				item.progressType
			];
		}	
		this.io.to(this.gameId).emit(GAME_NAME+"_receiveQuickGameState",reducedQuickGameState);
	}
	
	
	checkFoodSubmission(userId, itemStack,x,y){
		var toolId=itemStack.tool;	
		var tool=Object.values(CookaloorResourceManager.tools)[toolId];
		var toolName=NONE;
		if(tool!=undefined){
			toolName=tool.name;
		}
		if(toolName=="plate"){
			var isOk=false;
			for(var i=0;i<this.intermediateGameState.recipes.length && !isOk;i++){
				var currentRecipe=this.intermediateGameState.recipes[i];
				if(currentRecipe.team==this.getTeamOfPlayer(userId)){
					var isOk=this.checkItemsAgainstRecipe(itemStack.items, currentRecipe.recipe);
				}
			}
			this.itemHandler.removeItemFromGround(itemStack);
			if(isOk){
				this.recipeCompleted(currentRecipe, userId,x,y);
			}
			else{
				this.recipeFailed(userId,x,y);
			}
			this.itemHandler.spawnItemAtNextDispenser("dirty_plate");
		}
	}
	
	
	checkItemsAgainstRecipe(items, recipe){
		if(items.length != recipe.ingredients.length){
			return false;
		}
		for(var i=0;i<recipe.ingredients.length;i++){
			if(recipe.ingredients[i]!= items[i]){
				return false;
			}
		}
		return true;
	}
	
	
	initPlayerList(){
		for(var i=0;i<this.gameState.players.length;i++){
			var currentPlayer=this.gameState.players[i];
			currentPlayer.direction={up: false, down: true, left: false, right: false};

			currentPlayer.hands={items:[],tool:NONE,progress:0,progressType:""};
		}
	}

	initIntermediateGameState(){
		this.generateRandomStartingRecipes();
	}

	
	addRandomRecipeForTeam(teamNr){
		var randomRecipe=Tools.getRandomEntryFromList(this.getAllowedRecipesForDifficulty());
		var recipe={recipe: randomRecipe, team:teamNr, timer: this.gameSettings.recipeExpireInterval};
		this.intermediateGameState.recipes.push(recipe);
	}
	
	getAllowedRecipesForDifficulty(){
		var list=[];
		for(var i=0;i<CookaloorResourceManager.recipes.length;i++){
			var currentRecipe=CookaloorResourceManager.recipes[i];
			if(this.isAllowedDifficultyForRecipe(currentRecipe.difficulty)){
				list.push(currentRecipe);
			}
		}
		return list;		
		
	}
	
	isAllowedDifficultyForRecipe(difficulty){
		return (difficulty==this.gameState.difficulty || (difficulty+1) ==this.gameState.difficulty);
	}
	
	generateRandomStartingRecipes(){
		this.intermediateGameState.recipes=[];
		for(var i=0;i<this.gameSettings.startingRecipes;i++){
			for(var j=1;j<this.playerHandler.teams;j++){
				this.addRandomRecipeForTeam(j);
			}
		}
	}


	giveIngredientsToSocket(socketId){
		this.io.to(socketId).emit(GAME_NAME+"_receiveIngredients",CookaloorResourceManager.ingredients);	
	}

	giveToolsToSocket(socketId){
		this.io.to(socketId).emit(GAME_NAME+"_receiveTools",CookaloorResourceManager.tools);	
	}
	giveTilesToSocket(socketId){
		this.io.to(socketId).emit(GAME_NAME+"_receiveTiles",this.getTiles());	
	}

	refreshDispenserInfo(){
		var reducedDispensers = [];
		for (var i = 0; i < this.gameState.dispensers.length; i++){
			var dispenser = this.gameState.dispensers[i];
			reducedDispensers[i] = 
			[
				dispenser.x,
				dispenser.y,
				dispenser.tile,
				dispenser.charges,
				dispenser.secondsSinceLastCharged,
				dispenser.overCharge,
				dispenser.rate
			];
		}
		this.io.to(this.gameId).emit(GAME_NAME+"_receiveDispensers",reducedDispensers);
	}

	countdownRecipeTimers(){
		for(var i=0;i<this.intermediateGameState.recipes.length;i++){
			var currentRecipe=this.intermediateGameState.recipes[i];
			currentRecipe.timer--;
			if(currentRecipe.timer <=0){
				this.recipeExpired(currentRecipe);
			}	
		}	
	}
	
	recipeExpired(currentRecipe){
		for(var i=0;i<this.intermediateGameState.recipes.length;i++){
			if(this.intermediateGameState.recipes[i]==currentRecipe){
				this.intermediateGameState.recipes.splice(i,1);
			}
		}
		this.intermediateGameState.score[currentRecipe.team].score=this.intermediateGameState.score[currentRecipe.team].score - this.gameSettings.negativeScoreRecipeExpired;
		this.intermediateGameState.score[currentRecipe.team].lives--;
		this.intermediateGameState.score[currentRecipe.team].recipesExpired++;
		this.addRandomRecipeForTeam(currentRecipe.team);
		this.checkWinConditions();
	}
	
	recipeFailed(userId,x,y){
		this.intermediateGameState.score[this.getTeamOfPlayer(userId)].score=this.intermediateGameState.score[this.getTeamOfPlayer(userId)].score - this.gameSettings.negativeScoreRecipeFailed;
		this.intermediateGameState.score[this.getTeamOfPlayer(userId)].recipesFailed++;
		this.io.to(this.gameId).emit(GAME_NAME+"_plateSubmitted", (-1)*this.gameSettings.negativeScoreRecipeFailed, userId, x,y);
		this.checkWinConditions();	
	}
	
	recipeCompleted(currentRecipe, userId,x,y){
		for(var i=0;i<this.intermediateGameState.recipes.length;i++){
			if(this.intermediateGameState.recipes[i]==currentRecipe){
				this.intermediateGameState.recipes.splice(i,1);
			}
		}
		var scoreMultiplier = (1+0.5*(currentRecipe.timer/this.gameSettings.recipeExpireInterval)); //50% of the percentage of time remaining is a multiplier for the score you gain for a submit
		var plusScore = Math.floor((currentRecipe.recipe.points)*scoreMultiplier)
		this.intermediateGameState.score[currentRecipe.team].score=this.intermediateGameState.score[currentRecipe.team].score + plusScore;
		this.intermediateGameState.score[currentRecipe.team].recipesComplete++;
		this.addRandomRecipeForTeam(this.getOtherTeamNumberForNewRecipe(currentRecipe.team));
		this.io.to(this.gameId).emit(GAME_NAME+"_plateSubmitted", plusScore, userId, x,y);
		this.checkWinConditions();
	}	
	
	checkWinConditions(){
		if(this.gameSettings.gameMode==0 && this.intermediateGameState.gameTimer >= this.gameSettings.gameModeValue){
			var resultTeamScore=this.getTeamAndHighestScore();
			this.server.pushLogMessage("Time is up! Team {0} with the highest score of {1} has won.",[resultTeamScore.team, resultTeamScore.score],  false, false,this.gameId);
			this.endGame(resultTeamScore.team,true);
		}		
		if(this.gameSettings.gameMode==1){
			for(var i=1;i< this.gameSettings.teams;i++){
				if(this.intermediateGameState.score[i].lives <=0){
					this.server.pushLogMessage("Team {0} has lost all their lives!",[i],  false, false,this.gameId);
					var teamsStillAlive=[];
					for (var j=1;j<this.playerHandler.teams;j++){
						if(this.intermediateGameState.score[j].lives>0){
							teamsStillAlive.push(j);
						}
					}
					if(teamsStillAlive.length<=0){
						this.endGame(i,false);
					}
					else if(teamsStillAlive.length==1){
						this.endGame(teamsStillAlive[0],true);
					}
				}
			}	
		}
		if(this.gameSettings.gameMode==2){
			for(var i=1;i< this.playerHandler.teams;i++){
				if(this.intermediateGameState.score[i].score >=this.gameSettings.gameModeValue){
					this.server.pushLogMessage("Team {0} has reached the score!! Score reached: {1}, score required: {2}",[i,this.intermediateGameState.score[i].score,this.gameSettings.gameModeValue],  false, false,this.gameId);
					this.endGame(i,true);
				}
			}
		}	
		
	}
	
	endGame(team, isWon){
		this.refreshIntermediateGameInfo();
		this.refreshQuickGameInfo();
		this.intermediateGameState.score.winner=team;
		this.intermediateGameState.score.isWon=isWon;

		if (this.playerHandler.teams == 2){
			var newHighscore = true;
			var winnerscore = this.intermediateGameState.score[team].score;
			for (var i = 0; i < CookaloorResourceManager.highscores.length; i++){
				if (
					this.gameSettings.map == CookaloorResourceManager.highscores[i].map &&
					CookaloorResourceManager.highscores[i].highscore >= winnerscore
					){
						newHighscore = false;
				}
			}
			if (newHighscore){
				var topplayers = [];
				for (var i = 0; i < this.gameState.players.length; i++){
					topplayers.push(this.server.getUserNameByUserId(this.gameState.players[i].userId));
				}
				CookaloorResourceManager.saveHighscoreForMap(winnerscore, this.gameSettings.map, topplayers);
			}
		}
		this.stopGame();
		if(isWon){
			this.server.pushLogMessage("Game has ended. Lots of hungry mouths have been served... Winner of the evening: Team {0} with a score of {1}!",[team,this.intermediateGameState.score[team].score,this.gameSettings.gameModeValue],  false, false,this.gameId);		
		}
		else{
			this.server.pushLogMessage("Game has ended. I guess some people will starve now... Team {0} has reached a score of {1}. Next time better.. :-)",[team,this.intermediateGameState.score[team].score,this.gameSettings.gameModeValue],  false, false,this.gameId);		
		}
		
	}
	
	getTeamAndHighestScore(){
		var result={team: 1, score:0};
		for(var i=1; i <this.gameSettings.teams;i++){
			if(this.intermediateGameState.score[i].score >= result.score){
				result.score=this.intermediateGameState.score[i].score;
				result.team=i;
			}		
		}
		return result;
	}
	
	
	getOtherTeamNumberForNewRecipe(myTeam){
		var teamWithLeastRecipes=0;
		var leastRecipes=99;
		
		for(var i=1;i<this.playerHandler.teams;i++){
			var teamRecipeList=this.getRecipesOfTeam(i);
			var currentLength=teamRecipeList.length;
			if(currentLength<leastRecipes && i!=myTeam){
				teamWithLeastRecipes=i;
				leastRecipes=currentLength;
			}
		}
		if(teamWithLeastRecipes==0){
			return myTeam;
		}
		return teamWithLeastRecipes;
		
	}
	
	getRecipesOfTeam(teamNr){
		var teamRecipeList=[];
		for(var i=0; i < this.intermediateGameState.recipes.length;i++){
			if(this.intermediateGameState.recipes[i].team==teamNr){
				teamRecipeList.push(this.intermediateGameState.recipes[i]);
			}
		}
		return teamRecipeList;
	}


	
	checkDifficultyPhase(){
		if(this.gameState.difficulty < this.gameSettings.maxDifficulty){
			var currentCalcedDifficulty=1+Math.floor(this.intermediateGameState.gameTimer / this.gameSettings.difficultyTimeInterval);
			if(this.gameState.difficulty!=currentCalcedDifficulty){
				this.gameState.difficulty=currentCalcedDifficulty;	
			}
		}	
	}



	getItemTransitions(){
		return CookaloorResourceManager.transitions;
	}
	getTools(){
		return CookaloorResourceManager.tools;
	}
	
	getTiles(){
		return CookaloorResourceManager.tiles;
	}
	getIngredients(){
		return CookaloorResourceManager.ingredients;
	}
	

	//makes a list of information that the client can see in the browser to pick maps with
	makeKitchenList(){
		var kitchenList = [];
		for(var kitchenname in CookaloorResourceManager.kitchens){
			var kitchenHighscore = 0;
			var kitchenHighscorePlayers = [];
			for(var i = 0; i < CookaloorResourceManager.highscores.length; i++){
				if (CookaloorResourceManager.highscores[i].map == kitchenname) {
					kitchenHighscore = CookaloorResourceManager.highscores[i].highscore;
					kitchenHighscorePlayers = CookaloorResourceManager.highscores[i].highscoreplayers;
				}
			}
			kitchenList.push({
				name: CookaloorResourceManager.kitchens[kitchenname].name, 
				teamsize: CookaloorResourceManager.kitchens[kitchenname].teamsize, 
				id: kitchenname,
				highscore: kitchenHighscore,
				topplayers: kitchenHighscorePlayers
			});
		}
		this.gameSettings.kitchenList = kitchenList;
	}
	


	
	handleComponentSignal(event){
		if(event.source==this.playerHandler){
			if(event.type=="leavePlayer"){
				//this.quickGameState.players[event.target] = null;
			}
			if(event.type=="changeTeamAmount"){
				if (this.playerHandler.teams == 1) {
					this.gameSettings.map = "groupbananza";
				} else {
					this.gameSettings.map = "classico";
				}
			}
			if (!this.gameState.isRunning) {
				this.giveGameStates();
			}
		}
		
		if(event.source==this.movementHandler){
			if(event.type=="playerMoved"){
				var userId=event.target;
				var myCookingTimer=this.itemHandler.getProcessingTimerOfPlayer(userId);
				if(myCookingTimer!= undefined && myCookingTimer.tile.progressType=="manual"){
					this.itemHandler.stopProcessingTimer(myCookingTimer);	
				}
			}	
		}
		

		if(event.source==this.itemHandler){
			if(event.type=="playerDropItemStack"){
				var stackInFrontOfPlayer=event.target.stackInFrontOfPlayer;
				if (stackInFrontOfPlayer != null){
					var userId=event.target.userId;
				
					var tileInFront=event.target.tileInFront;
					var toolFromPlayer=event.target.toolFromPlayer;
					var playerHadIngredients = event.target.playerHadIngredients;
					var coords=this.mapHandler.getGridCoordsAt(stackInFrontOfPlayer.x,stackInFrontOfPlayer.y);
					if(tileInFront.action=="submit"){
						this.checkFoodSubmission(userId, stackInFrontOfPlayer,coords.x,coords.y); 
					} 	
				}
		
			}
			
			if(event.type=="playerPickUpItemStack"){

			}		
			if(event.type=="dispenserUsed" || event.type=="dispenserCharge"){
				this.refreshDispenserInfo();
			}	
			
		}
	}


	
	getTeamOfPlayer(userId){
		return this.playerHandler.getTeamOfPlayer(userId);
	}
		
	attemptPauseAction(socket, userId){
		if(this.gameHost==userId){
			if(!this.intermediateGameState.isPaused){
				this.intermediateGameState.isPaused=true;
				this.stopGameTimer();	
				this.refreshIntermediateGameInfo();		
			}	
			else{
				this.intermediateGameState.isPaused=false;
				this.startGameTimer();	
			}	
		}
	}

	startGame(){
		this.doOnStartGame();
		this.lastUpdateTime = (new Date()).getTime();
		this.gameState.isRunning=true;
		this.getMyGameRoom().isRunning=true;
		this.initiateGameTimer();
		this.giveGameStates();		
		this.refreshIntermediateGameInfo();
		this.refreshQuickGameInfo();	
	}
	
	doOnStartGame(){
		this.gameSettings.startingRecipes = Math.min(4, 1 + (this.gameState.players.length/((this.playerHandler.teams-1)*2)));
		this.initPlayerList();
		this.initIntermediateGameState();
		this.loadKitchenGrid(this.gameSettings.map);	
		for(var i=1;i<this.playerHandler.teams;i++){
			this.intermediateGameState.score[i]={team: i, score:0, recipesExpired:0, recipesComplete:0, recipesFailed: 0, lives: this.gameSettings.gameModeValue};
		}	
		for(var i=0;i<this.gameState.players.length;i++){
			this.gameState.players[i].movement={up: false, down: false, left: false, right: false};
			this.gameState.players[i].w=this.gameSettings.playerDisplayWidth;
			this.gameState.players[i].h=this.gameSettings.playerDisplayHeight;
			this.gameState.players[i].colW=this.gameSettings.playerCollisionWidth;
			this.gameState.players[i].colH=this.gameSettings.playerCollisionHeight;
		}	
		this.refreshDispenserInfo();	
	}
	
	//actually deletes the game and makes it go back to lobby
	finishGame(){
		this.freshVariables();
		this.giveGameStates();
		this.giveGameSettings();
	}	
	
	//stops the current game and displays the end of game screen
	stopGame(){
		this.stopGameTimer();
		this.intermediateGameState.gameTimer = -1;
		this.gameState.gameTimer = -1;
	}
	
	
	giveGameStates(){
		this.io.to(this.gameId).emit(this.gameType+"_receiveGameState",this.gameState, this.gameId);	
	}

	giveGameStateToSocket(socketId){
		this.io.to(socketId).emit(this.gameType+"_receiveGameState",this.gameState, this.gameId);	
	}

	giveGameSettingsToSocket(socketId){
		this.gameSettings.teams=this.playerHandler.teams;
		this.io.to(socketId).emit(this.gameType+"_receiveGameSettings",this.gameSettings);	
	}

	giveGameSettings(){
		this.makeKitchenList();
		this.io.to(this.gameId).emit(this.gameType+"_receiveGameSettings",this.gameSettings);		
	}

	refreshIntermediateGameInfo(){
		this.io.to(this.gameId).emit(this.gameType+"_receiveIntermediateGameState",this.intermediateGameState);	
	}
	
	
	loadKitchenGrid(kitchenName){
		this.gameState.map={};
		this.gameState.map.name=kitchenName;
		this.gameState.map.grid=CookaloorResourceManager.kitchens[kitchenName].grid;
		this.gameState.items=JSON.parse(JSON.stringify(CookaloorResourceManager.kitchens[kitchenName].items));
		
		for (var i = 0; i < this.gameState.items.length; i ++) {
			var x = this.gameState.items[i].x * this.mapHandler.tileSizeW + this.mapHandler.tileSizeW/2;
			var y = this.gameState.items[i].y * this.mapHandler.tileSizeH + this.mapHandler.tileSizeH/2;
			if (this.mapHandler.getTileAtPoint(x,y).isBlocking) {
				y = y - this.mapHandler.tileSizeH/3;
			} 
			this.gameState.items[i].x = Math.floor(x);
			this.gameState.items[i].y = Math.floor(y);
		}
		
		this.gameState.dispensers=[];
		for(var y=0; y < this.gameState.map.grid.length;y++){
			for(var x=0; x<this.gameState.map.grid[y].length;x++){
				var tileId=this.gameState.map.grid[y][x];
				var currentTile=Object.values(this.getTiles())[tileId];
				if(currentTile.action=="dispenser"){
					var dispenserObject={x: x ,y:y , tile: tileId, charges: currentTile.charges, secondsSinceLastCharged: 0,overCharge:0, rate: currentTile.dispenserRate};
					this.gameState.dispensers.push(dispenserObject);		
				}
			}
		}	
		for(var j=0;j<CookaloorResourceManager.kitchens[kitchenName].startingPositions.length;j++){	
			var currentPos=CookaloorResourceManager.kitchens[kitchenName].startingPositions[j];
			if (currentPos.userId != undefined){
				currentPos.userId = undefined;
			}
		}
		for(var i=0;i< this.gameState.players.length;i++){
			var currentPlayer=this.gameState.players[i];
			for(var j=0;j<CookaloorResourceManager.kitchens[kitchenName].startingPositions.length;j++){	
				var currentPos=CookaloorResourceManager.kitchens[kitchenName].startingPositions[j];
				if(currentPos.userId == undefined && (currentPos.team==currentPlayer.team || this.playerHandler.teams == 1)){
					var pos=this.mapHandler.getStartingPosForPlayerAtCoords(currentPos.x,currentPos.y);				
					currentPlayer.x=pos.x;
					currentPlayer.y=pos.y;
					currentPos.userId=currentPlayer.userId;
					j = 1000;
				}
			}
		}	
	}
	

	startGameTimer(){
	
		this.gameTimeTimer=setInterval(() => {
			this.intermediateGameState.gameTimer++;
			this.gameState.gameTimer++;
			this.doOnIntermediateTimer();
			this.refreshIntermediateGameInfo();
		},1000);
		
		this.runTimer=setInterval(() => {
			if(this.gameState.isRunning && this.intermediateGameState.gameTimer >= 5){
				this.doOnRunTimer();
				this.refreshQuickGameInfo();
				
			} else {
				this.lastUpdateTime = (new Date()).getTime();	
			}
		}, (1000/this.gameSettings.updateTimer) );	
		
	}
	
	initiateGameTimer(){
		this.intermediateGameState.gameTimer=0;
		this.startGameTimer();		
	}
	
	stopGameTimer(){
		clearInterval(this.runTimer);	
		clearInterval(this.gameTimeTimer);
	}


/**
STATIC PART
**/

	static initialize(){
		CookaloorResourceManager.initialize();
		CharacterLoader2DGrid.initialize();
	}

}

module.exports = CookaloorGameController;
     
})(typeof exports === 'undefined'?  
            window: exports); 