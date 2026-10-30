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