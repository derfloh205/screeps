let basicMoves = require('basic_creep_moves');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

	    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
	        basicMoves.buildOldestStructure(creep);
	    }
	    else {
	        basicMoves.harvestNearestSource(creep);
	    }
	}
};

module.exports = roleBuilder;