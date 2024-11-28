import Phaser from "phaser";
import { spawnMonsters } from './spawnMonsters';
import { PlayerState } from './playerState.js';
import { spawnFire, spawnPonds, spawnMazeAndObjects, spawnTrees, spawnbush } from './spawnObjects';
import {calculateSpawnProbability} from './spawnMonsters';

export function spawnRoll(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, allEntities) {
    const spawnProbability = calculateSpawnProbability();

    const randomFloat = Phaser.Math.FloatBetween(0, 1);

    if (randomFloat < spawnProbability) {
       spawnMonsters(centerX, centerY, scene, tileWidth, tilesBuffer, monsters, allEntities);
    }

    const fireProbability = .5 * (1 + PlayerState.fireBonus / 100);
    const randomFireFloat = Phaser.Math.FloatBetween(0, 1);
    if (randomFireFloat < fireProbability) {

        spawnFire(scene, tilesBuffer, tileWidth);

    }



    const treeProbability = 0.99;
    const randomTreeFloat = Phaser.Math.FloatBetween(0, 1);
    if (randomTreeFloat < treeProbability) {
        const randomNumberOfTrees = Phaser.Math.Between(1, 10);
        for (let i = 0; i < randomNumberOfTrees; i++) {
           spawnTrees(scene, tilesBuffer, tileWidth);
        }
    }


    const pondProbability = 0.60;
    const randomPondFloat = Phaser.Math.FloatBetween(0, 1);
    if (randomPondFloat < pondProbability) {
        const randomNumberOfPonds = Phaser.Math.Between(1, 2);

        for (let i = 0; i < randomNumberOfPonds; i++) {

        spawnPonds(scene, tilesBuffer, tileWidth);
        }
    }

    const bushProbability = 0.80;
    const randombushFloat = Phaser.Math.FloatBetween(0, 1);
    if (randombushFloat < bushProbability) {
        const randomNumberOfbushs = Phaser.Math.Between(1, 3);

        for (let i = 0; i < randomNumberOfbushs; i++) {

           spawnbush(scene, tilesBuffer, tileWidth);
        }
    }
}
