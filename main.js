var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

const MAX_EXTENSIONS = 5;

const MAX_HARVESTER = 2;
const MAX_UPGRADER = 2;
const MAX_BUILDER = 2;

const MAX_CREEP_MULTIPLY = 5;

function showSpawnMessage(text) {
    Game.spawns["Spawn1"].room.visual.text(text, Game.spawns["Spawn1"].pos.x, Game.spawns["Spawn1"].pos.y - 2, {size:'0.5', align: 'left', opacity: 0.8, 'backgroundColor': '#A3E4D7', color:'black'});
}

function getMaxAvailableCreep() {
    let lastWorkingConfig = [];
    
    for(let i = 0; i < MAX_CREEP_MULTIPLY; i++) {
        // dryrun spawnCreep and take highest possible
        let tryConfig = lastWorkingConfig.slice(0);
        tryConfig.push(WORK);
        tryConfig.push(CARRY);
        tryConfig.push(MOVE);
        
        if (Game.spawns["Spawn1"].spawnCreep(tryConfig, "dummy", {dryRun: true}) !== OK) {
            console.log("not enough energy for " + tryConfig.length + " bodyparts");
            break;
        }
        // push the possible config up
        lastWorkingConfig = tryConfig.slice(0);
    }
    console.log("body parts: " + lastWorkingConfig.length);
    showSpawnMessage("🛠️ spawning creep with " + lastWorkingConfig.length + " body parts 🛠️");
    return lastWorkingConfig;
}

function autoSpawn() {
    let harvesterCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "harvester").length;
    let upgraderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader").length;
    let builderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "builder").length;
    if (harvesterCreepsNumber < MAX_HARVESTER) {
        console.log("spawn Harvester");
       Game.spawns["Spawn1"].spawnCreep(getMaxAvailableCreep(), "harvester_" + Game.time, {memory: {role: "harvester"}}); 
    }
    if (upgraderCreepsNumber < MAX_UPGRADER) {
       Game.spawns["Spawn1"].spawnCreep(getMaxAvailableCreep(), "upgrader_" + Game.time, {memory: {role: "upgrader"}}); 
    }
    if (builderCreepsNumber < MAX_BUILDER) {
       Game.spawns["Spawn1"].spawnCreep(getMaxAvailableCreep(), "builder_" + Game.time, {memory: {role: "builder"}}); 
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

function autoExtension() {
    var numExtensions = _.filter(Game.structures, (structure) => structure.structureType === STRUCTURE_EXTENSION).length;
    // try to build extension around the spawn 
    if(numExtensions < MAX_EXTENSIONS) {
        let spawn_pos_x = Game.spawns["Spawn1"].pos.x;
        let spawn_pos_y = Game.spawns["Spawn1"].pos.y;
        let roomName = Game.spawns["Spawn1"].room.name;
        
        for(let rel_x of [-1, 0, +1]) {
            for(let rel_y of [-1, 0, +1]) {
                if(rel_x === 0 && rel_y === 0) {
                    continue;
                }
                //console.log("build at " + (spawn_pos_x + rel_x) + "/" + (spawn_pos_x + rel_y) + " room: " + roomName);
                let build_pos = new RoomPosition(spawn_pos_x + rel_x, spawn_pos_y + rel_y, roomName);
                build_pos.createConstructionSite(STRUCTURE_EXTENSION, "extension_" + Game.time);
            }
        }
    }
}


module.exports.loop = function () {
    
    cleanMemory();
    autoSpawn();
    autoExtension();
    Game.spawns["Spawn1"].room.visual.clear();

    var tower = Game.getObjectById('a658142523073561a948107a');
    if(tower) {
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