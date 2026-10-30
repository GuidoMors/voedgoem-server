/** general VARIABLES**/

var GAME_NAME="Cookaloor";
var quickGameState = {players: [], items: [], dispensers: []};
var targetXnY = {players: []};
var isBusy=true;
var postGameDrawn = false;
var NONE="none";
var cheflayers = ["bodies","faces","hats"];
var cheflayer = ["body","face","hat"];

var cuttingColors = [{type: "chop", color: "yellow"},{type: "clean", color: "white"},{type: "cook", color: "red"}];
var kitchenPictures = [];
var floorPictures = [];
var playerPictures = [];
var itemPictures = [];
var tilePictures = [];
var floorTotalImages=0;
var maskImagesOKCounter=0;
var outlineImagesOKCounter=0;
var itemImagesOKCounter=0;
var floorImagesOKCounter=0;
var kitchenTileTotalImages=0;
var kitchenTileImagesOKCounter=0;
var maskImgs=[];
var outlineImgs=[];
var itemImgs=[];

var submitAnimations=[];

var cookAnimImages = [];
var cookAnimsLoaded = 0;
var cookAnimsToBeLoaded = 0;
var cookAnimIndex = 0;

var chopAnimImages = [];
var chopAnimsLoaded = 0;
var chopAnimsToBeLoaded = 0;
var chopAnimIndex = 0;

var cleanAnimImages = [];
var cleanAnimsLoaded = 0;
var cleanAnimsToBeLoaded = 0;
var cleanAnimIndex = 0;

var submitAnimImages = [];
var submitAnimsLoaded = 0;
var submitAnimsToBeLoaded = 0;

var startImages = [];
var startAnimsLoaded = 0;

var totalDraws = 0;
var FRAMES = 60;
var intervalCounter = 0;

var isFloorDrawn=false;

var allItemsList;
var allToolsList;
var allTilesList;
var gameState;
var gameId;
var gameSettings;
var isPlayer=false;
var isHost=false;
var isBusy=true;
var intermediateGameState;
var quickGameState;
var deviceIsControllerMode = false;