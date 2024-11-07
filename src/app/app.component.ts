import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  subject = new FormControl(0);
  smartShips = new FormControl(false);
  delay = new FormControl(1000);
  configuration = new FormControl(0);
  sizeOptions: any = [
    { id: 0, size: 10 },
    { id: 1, size: 15 },
    { id: 2, size: 20 },
    { id: 3, size: 30 },
    { id: 4, size: 40 },
    { id: 5, size: 50 },
    { id: 6, size: 100 },
  ];
  delayOptions: number[] = [1, 10, 100, 1000, 10000];
  players: string[] = ["RED", "BLU"]; //mozna zrobic formularz pod to i sobie dopisywac
  tiles1: number[][] = []; // red
  tiles2: number[][] = []; // blu
  states: any = ['', '💣', '⬛', '💥'];
  color: string[] = ['rgba(255, 0, 0, 0.05)', 'rgba(0, 0, 255, 0.05)'];
  selectedSize: number = 0;
  selectedDelay: number = 1000;
  shots1: Set<string> = new Set();
  shots2: Set<string> = new Set();
  queue1: { row: number, col: number }[] = [];
  queue2: { row: number, col: number }[] = [];
  lastHitDirection0: 'vertical' | 'horizontal' | null = null;
  lastHitDirection1: 'vertical' | 'horizontal' | null = null;
  isStarted: boolean = false;
  shipsSet: boolean = false;
  shipConfigurations: any[] = [];
  shipsToPlace: number[] = [];
  playerShots: number[] = [0, 0]; // Ardo statystyk
  playerHits: number[] = [0, 0];
  isGameOver: boolean = false;
  startTime: number | null = null;
  gameLogs: string = "Wygrany;Procent trafien 1;Procent trafien2;Nietrafione statki;Czas gry(s);Plansza;Opoznienie;Konfiguracja statkow;\n";
  constructor() {}

  ngOnInit(): void {
    this.subject.valueChanges.subscribe((res: any) => {
      let selected = this.sizeOptions.at(res);
      this.selectedSize = selected.size;
      this.generateShipConfigurations(this.selectedSize);
      this.resetGame();
    });
    this.delay.valueChanges.subscribe((res2: any) => {
      this.selectedDelay = res2;
    });
    this.configuration.valueChanges.subscribe((res3: any) => {
      this.shipsToPlace = [];
      const selectedConfig = this.shipConfigurations.find(x => x.id == res3);
      if (selectedConfig) {
        this.shipsToPlace = selectedConfig.values;
      }
      this.resetGame();
    });
    this.subject.patchValue(0);
    this.smartShips.patchValue(false);
  }

  setItem(playerIndex: number, rowIndex: number, colIndex: number) {
    if (playerIndex === 0) {
      this.tiles1[rowIndex][colIndex] = this.tiles1[rowIndex][colIndex] + 1;
    } else {
      this.tiles2[rowIndex][colIndex] = this.tiles2[rowIndex][colIndex] + 1;
    }
  }

  getColumnLetter(index: number): string {
    let columnLetter = '';
    while (index >= 0) {
      columnLetter = String.fromCharCode((index % 26) + 65) + columnLetter;
      index = Math.floor(index / 26) - 1;
    }
    return columnLetter;
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
      this.startTime = Date.now();
      this.startShootingLoop(delay);
    } else {
      this.startTime = null;
    }
  }

  setShips() {
    const selectedConfig = this.shipConfigurations.find(x => x.id == this.configuration.value);
    if (selectedConfig) {
      this.shipsToPlace = selectedConfig.values;
    }
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

    // Check if there are free fields available
    if (availableShots <= 0) {
      this.isStarted = false;
      return;
    }
    const hasPlayer1Ships = this.tiles1.some(row => row.includes(2)); // check statkow
    const hasPlayer2Ships = this.tiles2.some(row => row.includes(2));

    // Check game over conditions
    if (!hasPlayer1Ships) {
      this.isGameEnded(2);
      return;
    }
    if (!hasPlayer2Ships) {
      this.isGameEnded(1); //
      return;
    }

    do {
      rowIndex = Math.floor(Math.random() * size);
      colIndex = Math.floor(Math.random() * size);
      shotKey = `${rowIndex}:${colIndex}`;
    } while (
      (playerIndex === 0 && this.shots1.has(shotKey)) ||
      (playerIndex === 1 && this.shots2.has(shotKey))
    );

    // Count the shot for the current player
    this.playerShots[playerIndex]++;

    if (playerIndex === 0) {
      this.shots1.add(shotKey);
      if (this.tiles2[rowIndex][colIndex] === 2) {
        this.tiles2[rowIndex][colIndex] = 3;
        this.playerHits[0]++;
        console.log(`[1] HIT ${rowIndex}:${this.getColumnLetter(colIndex)}`);
      } else {
        this.tiles2[rowIndex][colIndex] = 1;
        console.log(`[1] MISS ${rowIndex}:${this.getColumnLetter(colIndex)}`);
      }
    } else {
      this.shots2.add(shotKey);
      if (this.tiles1[rowIndex][colIndex] === 2) {
        this.tiles1[rowIndex][colIndex] = 3;
        this.playerHits[1]++;
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
      this.smartShips.value == false ? this.shoot(playerIndex) : this.shootSmart(playerIndex);
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
        const isVertical = Math.random() < 0.5; // kierunek
        const rowIndex = Math.floor(Math.random() * (isVertical ? this.selectedSize - shipLength + 1 : this.selectedSize));
        const colIndex = Math.floor(Math.random() * (isVertical ? this.selectedSize : this.selectedSize - shipLength + 1));

        if (this.canPlaceShip(tiles, rowIndex, colIndex, shipLength, isVertical)) {
          for (let i = 0; i < shipLength; i++) {
            tiles[isVertical ? rowIndex + i : rowIndex][isVertical ? colIndex : colIndex + i] = 2; //set ship 
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

    // all directions
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

  isGameEnded(winningPlayer: number) {
    this.isStarted = false;
    this.isGameOver = true;

    const endTime = Date.now();
    const durationInSeconds = (endTime - (this.startTime ?? endTime)) / 1000;

    console.log(`Gra zakończona! Wygrał gracz ${this.players[winningPlayer - 1]}!`);
    console.log(`Czas gry: ${durationInSeconds.toFixed(2)} sekund.`);
    
    const hitPercentage1 = this.playerShots[0] > 0 ? (this.playerHits[0] / this.playerShots[0]) * 100 : 0;
    const hitPercentage2 = this.playerShots[1] > 0 ? (this.playerHits[1] / this.playerShots[1]) * 100 : 0;
    const remainingShips = winningPlayer === 1 ? this.tiles1.flat().filter(tile => tile === 2).length : this.tiles2.flat().filter(tile => tile === 2).length;

    console.log(`Gracz 1 wykonał ${this.playerShots[0]} strzałów, z czego ${this.playerHits[0]} były celne (${hitPercentage1.toFixed(4)}%).`);
    console.log(`Gracz 2 wykonał ${this.playerShots[1]} strzałów, z czego ${this.playerHits[1]} były celne (${hitPercentage2.toFixed(4)}%).`);
    console.log(`Gratulacje! Gracz ${this.players[winningPlayer - 1]} ma ${remainingShips} statków pozostałych.`);
    let endGameString = `${winningPlayer};${hitPercentage1.toFixed(4)};${hitPercentage2.toFixed(4)};${remainingShips};${durationInSeconds.toFixed(2)};${this.selectedSize};${this.selectedDelay};[${this.shipsToPlace}];\n`;
    this.gameLogs += endGameString;
  }

  resetGame() {
    this.shipsSet = false;
    this.isStarted = false;
    this.startTime = null;
    this.generateTiles();
    this.shots1 = new Set();
    this.shots2 = new Set();
    this.isGameOver = false;
  }

  downloadFile() {
    const blob = new Blob([this.gameLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10);
    const timeString = now.toTimeString().slice(0, 5).replace(':', '-');
    const filename = `${dateString}_${timeString}_SHIPS.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // free memory
  }

  generateShipConfigurations(size: number) {
    this.shipConfigurations = [];
    let configs = [];
    
    if (size <= 10) {
      configs = [
        { id: 0, values: [3, 2, 2, 1, 1, 1] }, 
        { id: 1, values: [2, 2, 1, 1, 1, 1] },
        { id: 2, values: [3, 3, 2, 1, 1, 1, 1] },
        { id: 3, values: [2, 2, 2, 2, 1, 1, 1] },
        { id: 4, values: [8] }, 
      ];
    } else if (size <= 20) {
      configs = [
        { id: 0, values: [4, 3, 3, 2, 2, 1, 1, 1, 1] },
        { id: 1, values: [3, 3, 3, 2, 2, 1, 1, 1, 1] },
        { id: 2, values: [4, 4, 3, 3, 2, 2, 1, 1, 1, 1] },
        { id: 3, values: [3, 3, 3, 2, 2, 2, 1, 1, 1, 1] }
      ];
    } else if (size <= 30) {
      configs = [
        { id: 0, values: [5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1] },
        { id: 1, values: [4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1] },
        { id: 2, values: [5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1] },
        { id: 3, values: [5, 4, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1] }
      ];
    } else if (size <= 50) {
      configs = [
        { id: 0, values: [6, 5, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1] },
        { id: 1, values: [6, 5, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1] },
        { id: 2, values: [7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1] },
        { id: 3, values: [6, 6, 5, 5, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 1] }
      ];
    } else {
      configs = [
        { id: 0, values: [8, 7, 7, 6, 6, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1] },
        { id: 1, values: [9, 8, 7, 6, 6, 5, 5, 4, 3, 3, 3, 2, 2, 1, 1, 1, 1] },
        { id: 2, values: [8, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 1, 1] },
        { id: 3, values: [9, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1] }
      ];
    }
    
    this.shipConfigurations = configs;
  }
  shootSmart(playerIndex: number) {
    let size = this.selectedSize;
    let rowIndex: number;
    let colIndex: number;
    let shotKey: string = '';
    let availableShots = size * size - (playerIndex === 0 ? this.shots1.size : this.shots2.size);
  
    if (availableShots <= 0) {
      this.isStarted = false;
      return;
    }
  
    const hasPlayer1Ships = this.tiles1.some(row => row.includes(2)); // check statkow
    const hasPlayer2Ships = this.tiles2.some(row => row.includes(2));
  
    // Check game over conditions
    if (!hasPlayer1Ships) {
      this.isGameEnded(2);
      return;
    }
    if (!hasPlayer2Ships) {
      this.isGameEnded(1); 
      return;
    }

    if (playerIndex === 0 && this.queue1.length > 0) {
      const nextShot = this.queue1.shift();
      rowIndex = nextShot?.row ?? 0;
      colIndex = nextShot?.col ?? 0;
    } else if (playerIndex === 1 && this.queue2.length > 0) {
      const nextShot = this.queue2.shift();
      rowIndex = nextShot?.row ?? 0;
      colIndex = nextShot?.col ?? 0;
    } else {
      do {
        rowIndex = Math.floor(Math.random() * size);
        colIndex = Math.floor(Math.random() * size);
        shotKey = `${rowIndex}:${colIndex}`; 
      } while (
        (playerIndex === 0 && this.shots1.has(shotKey)) ||
        (playerIndex === 1 && this.shots2.has(shotKey))
      );
    }

    this.playerShots[playerIndex]++;
  
    if (playerIndex === 0) {
      this.shots1.add(shotKey);
      if (this.tiles2[rowIndex][colIndex] === 2) {
        this.tiles2[rowIndex][colIndex] = 3;
        this.playerHits[0]++;
        console.log(`[1] HIT ${rowIndex}:${this.getColumnLetter(colIndex)}`);
        this.queueAdjacentCells(0, rowIndex, colIndex);
      } else {
        this.tiles2[rowIndex][colIndex] = 1;
        console.log(`[1] MISS ${rowIndex}:${this.getColumnLetter(colIndex)}`);
      }
    } else {
      this.shots2.add(shotKey);
      if (this.tiles1[rowIndex][colIndex] === 2) {
        this.tiles1[rowIndex][colIndex] = 3;
        this.playerHits[1]++;
        console.log(`[2] HIT ${rowIndex}:${this.getColumnLetter(colIndex)}`);
        this.queueAdjacentCells(1, rowIndex, colIndex);
      } else {
        this.tiles1[rowIndex][colIndex] = 1;
        console.log(`[2] MISS ${rowIndex}:${this.getColumnLetter(colIndex)}`);
      }
    }
  }
  
  queueAdjacentCells(playerIndex: number, rowIndex: number, colIndex: number) {
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 },  // right
    ];
  
    const tiles = playerIndex === 0 ? this.tiles2 : this.tiles1;
  
    directions.forEach(({ row, col }) => {
      const newRow = rowIndex + row;
      const newCol = colIndex + col;
  
      if (newRow >= 0 && newRow < this.selectedSize && newCol >= 0 && newCol < this.selectedSize) {
        if (tiles[newRow][newCol] !== 1 && tiles[newRow][newCol] !== 3) {
          if (playerIndex === 0) {
            this.queue1.push({ row: newRow, col: newCol });
          } else {
            this.queue2.push({ row: newRow, col: newCol });
          }
        }
      }
    });
  }
  

  determineNextShots(playerIndex: number, lastHit: { row: number, col: number }, direction: 'vertical' | 'horizontal') {
    const { row, col } = lastHit;
    const directions = direction === 'vertical' ? [
      { row: row - 1, col }, // up
      { row: row + 1, col }, // down
    ] : [
      { row, col: col - 1 }, // left
      { row, col: col + 1 }, // right
    ];
    directions.forEach(({ row, col }) => {
      if (row >= 0 && row < this.selectedSize && col >= 0 && col < this.selectedSize) {
        const shotKey = `${row}:${col}`;
        if ((playerIndex === 0 && !this.shots1.has(shotKey)) || (playerIndex === 1 && !this.shots2.has(shotKey))) {
          if (playerIndex === 0) {
            this.queue1.push({ row, col });
          } else {
            this.queue2.push({ row, col });
          }
        }
      }
    });
  } 
  

}
