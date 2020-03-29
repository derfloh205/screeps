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
        var towerSites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (site) => site.structureType === STRUCTURE_TOWER);
        var wallSites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (site) => site.structureType === STRUCTURE_WALL);
        var otherSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        let buildPriority = [towerSites, wallSites, otherSites];
        //console.log("towersites: " + towerSites.length);
        for(let index in buildPriority) { // the buildPriority
            let sites = buildPriority[index];
            //console.log("checkingSite: " + sites.length);
            if(sites.length) {
                if(creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffffff'}, maxRooms: 1});
                }
            }
            break;
        }
    }
};

module.exports = basic_creep_moves;