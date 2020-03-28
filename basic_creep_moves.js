/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('basic_creep_moves');
 * mod.thing == 'a thing'; // true
 */

let basic_creep_moves = {
    harvestNearestSource: function(creep) {
         var closestSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if(closestSource && creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
    },
    buildOldestStructure: function(creep) {
        var targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
    }
};

module.exports = basic_creep_moves;