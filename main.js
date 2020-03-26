var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

const MAX_HARVESTER = 5;
const MAX_UPGRADER = 2;
const MAX_BUILDER = 2;

function autoSpawn() {
    let harvesterCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "harvester").length;
    let upgraderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader").length;
    let builderCreepsNumber = _.filter(Game.creeps, (creep) => creep.memory.role === "builder").length;
    if (harvesterCreepsNumber < MAX_HARVESTER) {
       Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], "harvester_" + Game.time, {memory: {role: "harvester"}}); 
    }
    if (upgraderCreepsNumber < MAX_UPGRADER) {
       Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], "upgrader_" + Game.time, {memory: {role: "upgrader"}}); 
    }
    if (builderCreepsNumber < MAX_BUILDER) {
       Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], "builder_" + Game.time, {memory: {role: "builder"}}); 
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


module.exports.loop = function () {
    
    cleanMemory();
    autoSpawn();

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