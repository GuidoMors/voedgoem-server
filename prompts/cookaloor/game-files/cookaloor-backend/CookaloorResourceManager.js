(function(exports) { 

var fs = require("fs");
var path= require("path");
var Tools = require('./../../static/common/tools.js');	

var GAME_NAME="Cookaloor";
var NONE="none";


var INGREDIENTS_FILE_NAME="game/"+GAME_NAME+"/resources/ingredients.json";
var TILES_FILE_NAME="game/"+GAME_NAME+"/resources/tiles.json";
var TRANSITIONS_FILE_NAME="game/"+GAME_NAME+"/resources/transitions.json";
var KITCHENS_FILE_NAME="game/"+GAME_NAME+"/resources/kitchens.json";
var TOOLS_FILE_NAME="game/"+GAME_NAME+"/resources/tools.json";
var RECIPES_FILE_NAME="game/"+GAME_NAME+"/resources/recipes.json";
var HIGHSCORES_FILE_NAME="game/"+GAME_NAME+"/resources/highscores.json";

var kitchenHashes = [
	["XXX", "table1"],
	["XpX", "table1"],
	["111", "floorred"],
	["222", "floorblue"],
	["333", "flooryellow"],
	["fur", "furnace1"],
	["cut", "cuttingboard1"],
	["sub", "submitcounter1"],
	["trs", "trash1"],
	["sil", "sink_left_1"],
	["sir", "sink_right_1"],
	["sit", "sink_top_1"],
	["sib", "sink_bottom_1"],
	["pld", "platedispenser1"],
	["pod", "potatodispenser"],
	["chd", "cheesedispenser"],
	["cad", "cabbagedispenser"],
	["bud", "bundispenser"],
	["med", "meatdispenser"],
	["cud", "cucumberdispenser"],
	["tod", "tomatodispenser"],
	["sad", "sausagedispenser"]
];



class CookaloorResourceManager{


	constructor() { 
	}	
	

/**
STATIC PART
**/

	
	static tiles={};
	static ingredients={};
	static transitions=[];
	static kitchens={};
	static tools={};
	static recipes=[];
	static highscores=[];

	static initialize(){
		
		CookaloorResourceManager.initHighscores();	
		CookaloorResourceManager.initTiles();
		CookaloorResourceManager.initIngredients();
		CookaloorResourceManager.initTransitions();
		CookaloorResourceManager.initTools();
		CookaloorResourceManager.initKitchens();
		CookaloorResourceManager.initRecipes();
	}

	static initHighscores(){
		var highscoresFile=fs.readFileSync(HIGHSCORES_FILE_NAME);
		CookaloorResourceManager.highscores=JSON.parse(highscoresFile);
	}

	//players should be a list of userId's of the players
	static saveHighscoreForMap(newhighscore, kitchenmap, topplayers){

		for (var i = 0; i <= CookaloorResourceManager.highscores.length; i++){
			if (i == CookaloorResourceManager.highscores.length){
				CookaloorResourceManager.highscores.push(
					{
						map: kitchenmap,
						highscore: newhighscore,
						highscoreplayers: topplayers
					}
				);
				i = i + 9999;
			} else {
				if (CookaloorResourceManager.highscores[i].map == kitchenmap){
					CookaloorResourceManager.highscores[i].highscore = newhighscore;
					CookaloorResourceManager.highscores[i].highscoreplayers = topplayers;
				}
			}
		}

		fs.writeFile(HIGHSCORES_FILE_NAME, JSON.stringify(CookaloorResourceManager.highscores,null, '\t'), function (err) {
			if (err) return console.log("saveHighscoreForMap error: "+err);
		});
	}

	
	
	static initTools(){
		var toolsFile=fs.readFileSync(TOOLS_FILE_NAME);
		CookaloorResourceManager.tools=JSON.parse(toolsFile);
				
		for(var i=0;i<Object.keys(CookaloorResourceManager.tools).length;i++){
			var currentToolName= Object.keys(CookaloorResourceManager.tools)[i];
			CookaloorResourceManager.tools[currentToolName].id=i;
		}	

	}	
	static initRecipes(){
		var recipesFile=fs.readFileSync(RECIPES_FILE_NAME);
		CookaloorResourceManager.recipes=JSON.parse(recipesFile);
		for(var i=0;i<CookaloorResourceManager.recipes.length;i++){
			for(var j=0;j<CookaloorResourceManager.recipes[i].ingredients.length;j++){
				CookaloorResourceManager.recipes[i].ingredients[j]=CookaloorResourceManager.ingredients[CookaloorResourceManager.recipes[i].ingredients[j]].id;
			}
		}
		
		
	}
	static initIngredients(){
		var ingredientsFile=fs.readFileSync(INGREDIENTS_FILE_NAME);
		CookaloorResourceManager.ingredients=JSON.parse(ingredientsFile);
		for(var i=0;i<Object.keys(CookaloorResourceManager.ingredients).length;i++){
			var currentIngredientName= Object.keys(CookaloorResourceManager.ingredients)[i];
			CookaloorResourceManager.ingredients[currentIngredientName].id=i;
		}
	}
	
	static initTransitions(){
		var transitionsFile=fs.readFileSync(TRANSITIONS_FILE_NAME);
		CookaloorResourceManager.transitions=JSON.parse(transitionsFile);		
	}
	
	static initTiles(){
		var tilesFile=fs.readFileSync(TILES_FILE_NAME);
		CookaloorResourceManager.tiles=JSON.parse(tilesFile);
		for(var i=0;i<Object.keys(CookaloorResourceManager.tiles).length;i++){
			var currentTileName= Object.keys(CookaloorResourceManager.tiles)[i];
			CookaloorResourceManager.tiles[currentTileName].id=i;
		}
		var noTile={name: NONE, id:"0", img: "", isBlocking:true, action:NONE, dispenserItem: ""};
		CookaloorResourceManager.tiles[noTile.name]=noTile;
		
	}

	static initKitchens(){
		var kitchenFile=fs.readFileSync(KITCHENS_FILE_NAME);
		CookaloorResourceManager.kitchens=JSON.parse(kitchenFile);
		for(var kitchenname in CookaloorResourceManager.kitchens){

			CookaloorResourceManager.kitchens[kitchenname].startingPositions = [];
			for (var n=0;n<10;n++){
				for(var y=0;y<CookaloorResourceManager.kitchens[kitchenname].grid.length;y++){
					for(var x=0;x<CookaloorResourceManager.kitchens[kitchenname].grid[y].length;x++){
						if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x] == " " +n+ " "){
							CookaloorResourceManager.kitchens[kitchenname].startingPositions.push({x: x, y: y, team:1});
						}
						if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x] == " " +String.fromCharCode(97+n)+ " "){
							CookaloorResourceManager.kitchens[kitchenname].startingPositions.push({x: x, y: y, team:2});
						}
					}
				}
			}

			CookaloorResourceManager.kitchens[kitchenname].items = [];
			for(var y=0;y<CookaloorResourceManager.kitchens[kitchenname].grid.length;y++){
				for(var x=0;x<CookaloorResourceManager.kitchens[kitchenname].grid[y].length;x++){

					if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x] == "fur"){
						CookaloorResourceManager.kitchens[kitchenname].items.push({x: x, y: y, items:[], progress: 0, progressType: "", tool: CookaloorResourceManager.tools["pan"].id});
					}
					if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x] == "XpX"){
						CookaloorResourceManager.kitchens[kitchenname].items.push({x: x, y: y, items:[], progress: 0, progressType: "", tool: CookaloorResourceManager.tools["plate"].id});
					}
				}
			}

			for(var y=0;y<CookaloorResourceManager.kitchens[kitchenname].grid.length;y++){
				for(var x=0;x<CookaloorResourceManager.kitchens[kitchenname].grid[y].length;x++){
					for (var i=0;i<kitchenHashes.length;i++){
						if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x] == kitchenHashes[i][0]){
							CookaloorResourceManager.kitchens[kitchenname].grid[y][x]=kitchenHashes[i][1];
						}
						if (CookaloorResourceManager.kitchens[kitchenname].grid[y][x].charAt(0) == " " && CookaloorResourceManager.kitchens[kitchenname].grid[y][x].charAt(2) == " "){
							CookaloorResourceManager.kitchens[kitchenname].grid[y][x]="floor1";
						}
					}
				}
			}
			
			CookaloorResourceManager.translateStringArrayIntoTileArray(CookaloorResourceManager.kitchens[kitchenname].grid);
			
			for(var y=0;y<CookaloorResourceManager.kitchens[kitchenname].grid.length;y++){
				for(var x=0;x<CookaloorResourceManager.kitchens[kitchenname].grid[y].length;x++){
					CookaloorResourceManager.kitchens[kitchenname].grid[y][x]=CookaloorResourceManager.tiles[CookaloorResourceManager.kitchens[kitchenname].grid[y][x].name].id;
				}
			}
		}
		
	}
	
	static translateStringArrayIntoItemArray(items){
		for(var i=0; i < items.length;i++){
				for(var j=0; j < items[i].items.length;j++){
					var itemName=items[i].items[j];
					items[i].items[j]=CookaloorResourceManager.ingredients[itemName];
					
					if(items[i].items[j]==undefined){
						items[i].items.splice(j,1);
					}
				}
				if(items[i].items.length<=0 && items[i].tool==NONE){
					items.splice(i,1);
				}
				
			items[i].tool=CookaloorResourceManager.tools[items[i].tool];
			if(items[i].tool==undefined){
				items[i].tool=NONE;
			}
		}
		
	}

	static translateStringArrayIntoTileArray(grid){
		for(var y=0; y < grid.length;y++){
				for(var x=0; x<grid[y].length;x++){
					grid[y][x]=CookaloorResourceManager.tiles[grid[y][x]];
				}
		}
	}		
}


module.exports = CookaloorResourceManager;
     
})(typeof exports === 'undefined'?  
            window: exports); 