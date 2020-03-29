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
        // prefer towers and walls
        var towerSites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (site) => site.type === STRUCTURE_TOWER);
        var wallSites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (site) => site.type === STRUCTURE_WALL);
        var otherSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        for(let sites of [towerSites, wallSites, otherSites]) { // the buildPriority
            console.log("checkingSite: " + sites.length);
            if(sites.length) {
                if(creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            break;
        }
    }
};

module.exports = basic_creep_moves;