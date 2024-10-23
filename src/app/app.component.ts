import { Component, OnInit } from '@angular/core';
import { WynikDto } from './wynikdto';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent  implements OnInit{
  subject = new FormControl(0);
  delay = new FormControl(1000);
  configuration = new FormControl(0);
  sizeOptions:any = [
    {id: 0, label: "10x10", size: 10}, 
    {id: 1, label: "15x15", size: 15}, 
    {id: 2, label: "20x20", size: 20}, 
  ];
  delayOptions: number[] = [1, 10, 100, 1000, 10000];
  players: string[] = ["RED", "BLU"];
  tiles1: number[][] = []; //red
  tiles2: number[][] = []; //blu
  states: any = ['', '💣', '⬛', '💥']
  color: string[] = ['rgba(255, 0, 0, 0.05)', 'rgba(0, 0, 255, 0.05)']
  selectedSize: number = 0;
  selectedDelay: number = 1000;
  shots1: Set<string> = new Set();
  shots2: Set<string> = new Set();
  isStarted: boolean = false;
  shipsSet: boolean = false;
  shipConfigurations: any[] = [
    {id: 0, values:[4, 3, 2, 2, 1, 1, 1]},
    {id: 1, values:[1, 1, 1]},
    {id: 2, values:[4, 3, 3, 2, 2, 2, 1, 1, 1, 1]},
  ];
  shipsToPlace: number[] = [];
  playerShots: number[] = [0, 0]; 
  isGameOver: boolean = false;
  constructor(){
  }

  ngOnInit(): void {
    
    this.subject.valueChanges.subscribe((res: any)=>{
      let selected = this.sizeOptions.at(res);
      this.selectedSize = selected.size;
      this.resetGame();
    })
    this.delay.valueChanges.subscribe((res2: any)=>{
      this.selectedDelay = res2;
    })
    this.configuration.valueChanges.subscribe((res3: any) => {
      this.shipsToPlace = []; 
      const selectedConfig = this.shipConfigurations.find(x=>x.id == res3);
      if (selectedConfig) {
        this.shipsToPlace = selectedConfig.values;
      }
      this.resetGame();
    });
    this.subject.patchValue(0);
    this.configuration.patchValue(0);
    
  }
  setItem(playerIndex: number, rowIndex: number, colIndex: number) {
    //reczne sprawdzenie
    if (playerIndex === 0) {
      this.tiles1[rowIndex][colIndex] = this.tiles1[rowIndex][colIndex]+1;
    } else {
      this.tiles2[rowIndex][colIndex] = this.tiles2[rowIndex][colIndex]+1;
    }
  }
  getColumnLetter(index: number): string {
    return String.fromCharCode(65 + index); 
  }
  createEmptyTilesArray(size: number): number[][] {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }
  generateTiles() {
    this.tiles1 = this.createEmptyTilesArray(this.selectedSize);
    this.tiles2 = this.createEmptyTilesArray(this.selectedSize);
  }

  start() {
    let size = this.selectedSize;
    let delay = this.selectedDelay;
    this.isStarted = !this.isStarted;
  
    if (this.isStarted) {
      this.startShootingLoop(delay);
    }
  }
  setShips() {
    this.placeShipsOnBoard(this.tiles1, this.shipsToPlace);
    this.placeShipsOnBoard(this.tiles2, this.shipsToPlace);
    this.shipsSet = true;
}

shoot(playerIndex: number) {
  let size = this.selectedSize;
  let rowIndex: number;
  let colIndex: number;
  let shotKey: string;
  let availableShots = size * size - (playerIndex === 0 ? this.shots1.size : this.shots2.size);

  // czy sa wolne pola
  if (availableShots <= 0) {
    this.isStarted = false;
    return;
  }

  do {
    rowIndex = Math.floor(Math.random() * size);
    colIndex = Math.floor(Math.random() * size);
    shotKey = `${rowIndex}:${colIndex}`; // Create a unique key for the shot
  } while (
    (playerIndex === 0 && this.shots1.has(shotKey)) || // Check if shot already taken for player 1
    (playerIndex === 1 && this.shots2.has(shotKey))    // Check if shot already taken for player 2
  );

  if (playerIndex === 0) {
    this.shots1.add(shotKey);
    if (this.tiles2[rowIndex][colIndex] === 2) {
      this.tiles2[rowIndex][colIndex] = 3;
      console.log(`[1] HIT ${rowIndex}:${this.getColumnLetter(colIndex)}`);
    } else {
      this.tiles2[rowIndex][colIndex] = 1; 
      console.log(`[1] MISS ${rowIndex}:${this.getColumnLetter(colIndex)}`);
    }
  } else {
    this.shots2.add(shotKey);
    if (this.tiles1[rowIndex][colIndex] === 2) { 
      this.tiles1[rowIndex][colIndex] = 3;
      console.log(`[2] HIT ${rowIndex}:${this.getColumnLetter(colIndex)}`);
    } else {
      this.tiles1[rowIndex][colIndex] = 1;
      console.log(`[2] MISS ${rowIndex}:${this.getColumnLetter(colIndex)}`);
    }
  }
}


  private startShootingLoop(delay: number) {
    const shootPlayers = (playerIndex: number) => {
      if (!this.isStarted) return;
      this.shoot(playerIndex);
      setTimeout(() => {
        shootPlayers(playerIndex === 0 ? 1 : 0);
      }, delay);
    };
    shootPlayers(0);
  }

  placeShipsOnBoard(tiles: number[][], ships: number[]) {
    ships.forEach(shipLength => {
        let placed = false;

        while (!placed) {
            const isVertical = Math.random() < 0.5; // Randomly decide orientation (vertical or horizontal)
            const rowIndex = Math.floor(Math.random() * (isVertical ? this.selectedSize - shipLength + 1 : this.selectedSize));
            const colIndex = Math.floor(Math.random() * (isVertical ? this.selectedSize : this.selectedSize - shipLength + 1));

            if (this.canPlaceShip(tiles, rowIndex, colIndex, shipLength, isVertical)) {
                for (let i = 0; i < shipLength; i++) {
                    tiles[isVertical ? rowIndex + i : rowIndex][isVertical ? colIndex : colIndex + i] = 2; // Mark the tile as occupied by a ship
                }
                placed = true;
            }
        }
    });
  }

  canPlaceShip(tiles: number[][], rowIndex: number, colIndex: number, shipLength: number, isVertical: boolean): boolean {
    for (let i = 0; i < shipLength; i++) {
        const row = isVertical ? rowIndex + i : rowIndex;
        const col = isVertical ? colIndex : colIndex + i;

        if (row >= this.selectedSize || col >= this.selectedSize || tiles[row][col] === 2) {
            return false; // Cannot place the ship
        }
    }

    // wszytkie mozliwe kombinacje kierunkow zeby statki sie nie stykały
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (let i = 0; i < shipLength; i++) {
        const row = isVertical ? rowIndex + i : rowIndex;
        const col = isVertical ? colIndex : colIndex + i;

        for (const [dx, dy] of directions) {
            const adjRow = row + dx;
            const adjCol = col + dy;
            if (adjRow >= 0 && adjRow < this.selectedSize && adjCol >= 0 && adjCol < this.selectedSize) {
                if (tiles[adjRow][adjCol] === 2) {
                    return false;
                }
            }
        }
    }

      return true; 
  }
  resetGame(){
    this.shipsSet = false;
    this.isStarted = false;
    this.generateTiles();
    this.shots1 = new Set();
    this.shots2 = new Set();
  }
}
