var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

const TERRAIN_PLAIN = "plain";
const TERRAIN_SWAMP = "swamp";
const TERRAIN_WALL = "wall";

const ROOM_WIDTH = 50;
const ROOM_HEIGHT = 50;

const EXTENSION_FIELD_X = 5;
const EXTENSION_FIELD_Y = 5;

const MAX_HARVESTER = 5;
const MAX_UPGRADER = 5;
const MAX_BUILDER = 5;

const MAX_CREEP_MULTIPLY = 5;

function showSpawnMessage(text) {
    Game.spawns["Spawn1"].room.visual.text(text, Game.spawns["Spawn1"].pos.x, Game.spawns["Spawn1"].pos.y - 2, {size:'0.5', align: 'left', opacity: 0.8, 'backgroundColor': '#A3E4D7', color:'black'});
}

function getMaxAvailableCreep(spawn) {
    let lastWorkingConfig = [];
    
    for(let i = 0; i < MAX_CREEP_MULTIPLY; i++) {
        // dryrun spawnCreep and take highest possible
        let tryConfig = lastWorkingConfig.slice(0);
        tryConfig.push(WORK);
        tryConfig.push(CARRY);
        tryConfig.push(MOVE);
        
        if (Game.spawns["Spawn1"].spawnCreep(tryConfig, "dummy", {dryRun: true}) !== OK) {
            //console.log("not enough energy for " + tryConfig.length + " bodyparts");
            break;
        }
        // push the possible config up
        lastWorkingConfig = tryConfig.slice(0);
    }
    //console.log("body parts: " + lastWorkingConfig.length);
    if(lastWorkingConfig.length > 0) {
        showSpawnMessage("🛠️ spawning creep with " + lastWorkingConfig.length + " body parts 🛠️");
    }
    return lastWorkingConfig;
}

function autoSpawnCreeps(spawn) {
    let harvesterCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "harvester").length;
    let upgraderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader").length;
    let builderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "builder").length;
    if (harvesterCreepsNumber < MAX_HARVESTER) {
       spawn.spawnCreep(getMaxAvailableCreep(spawn), "harvester_" + Game.time, {memory: {role: "harvester"}}); 
    }
    if (upgraderCreepsNumber < MAX_UPGRADER) {
       spawn.spawnCreep(getMaxAvailableCreep(spawn), "upgrader_" + Game.time, {memory: {role: "upgrader"}}); 
    }
    if (builderCreepsNumber < MAX_BUILDER) {
       spawn.spawnCreep(getMaxAvailableCreep(spawn), "builder_" + Game.time, {memory: {role: "builder"}}); 
    }
}

function parseExit(terrainList, type) {
    let findStart = true;
    let currentExit = {};
    let exitList = [];
    let endOffsetX = 0;
    let endOffsetY = 0;
    console.log("parsing exit for " + type);
    if(type === "top" || type === "bottom") {
        endOffsetX = 1;
    } else if (type === "left" || type === "right") {
        endOffsetY = 1;
    }
     
    for (let index in terrainList){
        let tile = terrainList[index];
        let lastTile = false;
        if(type === "top" || type === "bottom") {
            lastTile = tile.x === 49;
        } else if (type === "left" || type === "right") {
            lastTile = tile.y === 49;
        }
        
        if(tile.terrain === TERRAIN_PLAIN && findStart) { // "plain" -> plain
            console.log("found start: " + tile.x + "/" + tile.y);
            currentExit.start = {x: tile.x, y: tile.y};
            findStart = false;
        } else if(!findStart && (tile.terrain === TERRAIN_WALL || (tile.terrain === TERRAIN_PLAIN && lastTile))) {
            console.log("found end: " + tile.x + "/" + tile.y);
            currentExit.end = {x: tile.x - endOffsetX, y: tile.y - endOffsetY};
            findStart = true;
            if(type === "top" || type === "bottom") {
                currentExit.size = currentExit.end.x - currentExit.start.x + 1;
            } else if (type === "left" || type === "right") {
                currentExit.size = currentExit.end.y - currentExit.start.y + 1;
            }
            
            currentExit.type = type;
            exitList.push(currentExit);
            currentExit = {};
        }
    }
    return exitList;
}

function parseExitsForRoom(roomName) {
    //console.log("roomName: " + roomName);
    if(!Game.rooms[roomName].memory["exits_set"]) {
        Game.rooms[roomName].memory["exits_set"] = false;
    }
    let exits_set = Game.spawns["Spawn1"].room.memory["exits_set"];
    // identify exits by start and end coord (one time)
    if(!exits_set) {
        let exitList =  {
            top: [],
            left: [],
            bottom: [],
            right: []
        };
        // find all exit fields
        let terrainTop = Game.rooms[roomName].lookForAtArea(LOOK_TERRAIN, 0, 0, 0, 49, true);
        let terrainLeft = Game.rooms[roomName].lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 0, true);
        let terrainBottom = Game.rooms[roomName].lookForAtArea(LOOK_TERRAIN, 49, 0, 49, 49, true);
        let terrainRight = Game.rooms[roomName].lookForAtArea(LOOK_TERRAIN, 0, 49, 49, 49, true);
        exitList.top = parseExit(terrainTop, "top");
        exitList.left = parseExit(terrainLeft, "left");
        exitList.right = parseExit(terrainRight, "right");
        exitList.bottom = parseExit(terrainBottom, "bottom");
        
        Game.rooms[roomName].memory["exits_set"] = true;
        Game.rooms[roomName].memory["exit_list"] = exitList;
    }
}

function cleanMemory(){
    // creeps
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            //console.log('Clearing non-existing creep memory:', name);
        }
    }
}

function autoBuild(spawn) {
    var numExtensions = _.filter(Game.structures, (structure) => structure.structureType === STRUCTURE_EXTENSION).length;
    // try to build extension around the spawn 
    // in a square around the spawn and each second pos
   
    let spawn_pos_x = spawn.pos.x;
    let spawn_pos_y = spawn.pos.y;
    let roomName = spawn.room.name;
    let startPos = new RoomPosition(spawn_pos_x - EXTENSION_FIELD_X, spawn_pos_y - EXTENSION_FIELD_Y, roomName);
    let offset = 0;

    for(let build_x = 0; build_x < (EXTENSION_FIELD_X*2) + 1; build_x += 1) {
        for(let build_y = 0; build_y < (EXTENSION_FIELD_Y*2) + 1; build_y += 2) {
            let buildPos = new RoomPosition(startPos.x + build_x, startPos.y + build_y + offset, roomName);
            //console.log("buildPos: " + buildPos.x + "/" + buildPos.y);
            buildPos.createConstructionSite(STRUCTURE_EXTENSION, "extension_" + Game.time);
        }
        if(offset === 0) {
            offset = 1;
        } else {
            offset = 0;
        }
    }
}

function parseAllExits(spawn) {
    parseExitsForRoom(spawn.room.name);
}

function autoDefendExits(spawn) {
    let exitType = "top";
    let exitList = spawn.room.memory.exit_list;
    
    for(let index in exitList.top) {
        let currentExitInfo = exitList.top[index];
        // build walls except middle part 
        let middleX = (currentExitInfo.size % 2 === 0 ? currentExitInfo.size / 2 : (currentExitInfo.size + 1) / 2) + currentExitInfo.start.x - 1;
        let middleY = (currentExitInfo.start.y) + 2;
        
        // hardcoded fences left and right
        spawn.room.getPositionAt(currentExitInfo.start.x - 2, currentExitInfo.end.y + 1).createConstructionSite(STRUCTURE_WALL, "wall_" + Game.time);
        spawn.room.getPositionAt(currentExitInfo.start.x - 2, currentExitInfo.end.y + 2).createConstructionSite(STRUCTURE_WALL, "wall_" + Game.time);
        
        spawn.room.getPositionAt(currentExitInfo.end.x + 2, currentExitInfo.end.y + 1).createConstructionSite(STRUCTURE_WALL, "wall_" + Game.time);
        spawn.room.getPositionAt(currentExitInfo.end.x + 2, currentExitInfo.end.y + 2).createConstructionSite(STRUCTURE_WALL, "wall_" + Game.time);
        
        // towers
        //console.log("tower at " + (middleX - 1) + "/" + (middleY+1));
        //console.log("tower at " + (middleX + 1) + "/" + (middleY+1));
        spawn.room.getPositionAt(middleX - 1, middleY + 1).createConstructionSite(STRUCTURE_TOWER, "tower_" + Game.time);
        spawn.room.getPositionAt(middleX + 1, middleX + 1).createConstructionSite(STRUCTURE_TOWER, "tower_" + Game.time);
        
        // +1 to left and right to cover diagonal moving
        for(let curr_x = currentExitInfo.start.x - 2; curr_x < currentExitInfo.end.x + 3; curr_x++) {
            if(curr_x === middleX) {
                continue;
            }
            let buildPos = spawn.room.getPositionAt(curr_x, middleY);
            //console.log("create wall at " + buildPos.x + "/" + buildPos.y);
            buildPos.createConstructionSite(STRUCTURE_WALL, "wall_" + Game.time);
        }
    }
}


module.exports.loop = function () {
    
    let spawn = Game.spawns["Spawn1"];
    cleanMemory();
    autoSpawnCreeps(spawn);
    autoBuild(spawn);
    parseAllExits(spawn);
    autoDefendExits(spawn);
    //Game.spawns["Spawn1"].room.visual.clear();

    let towers = _.filter(Game.structures, (structure) => structure.type === STRUCTURE_TOWER);
    for(let name in towers) {
        let tower = towers[name]
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}