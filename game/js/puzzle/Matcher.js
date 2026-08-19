import { TILE_SPECIALS } from './Tile.js';

export class Matcher {
  constructor(board) {
    this.board = board;
  }

  findAllMatches() {
    const rawMatches = [];
    
    // Horizontal scan
    for (let row = 0; row < this.board.gridSize; row++) {
      let matchStart = 0;
      for (let col = 1; col <= this.board.gridSize; col++) {
        const current = col < this.board.gridSize ? this.board.grid[row][col] : null;
        const prev = this.board.grid[row][col - 1];
        
        if (!current || !prev || current.type !== prev.type) {
          const length = col - matchStart;
          if (length >= 3) {
            const tiles = [];
            for (let c = matchStart; c < col; c++) {
              tiles.push(this.board.grid[row][c]);
            }
            rawMatches.push({ tiles, length, type: prev.type, direction: 'h' });
          }
          matchStart = col;
        }
      }
    }
    
    // Vertical scan
    for (let col = 0; col < this.board.gridSize; col++) {
      let matchStart = 0;
      for (let row = 1; row <= this.board.gridSize; row++) {
        const current = row < this.board.gridSize ? this.board.grid[row][col] : null;
        const prev = this.board.grid[row - 1][col];
        
        if (!current || !prev || current.type !== prev.type) {
          const length = row - matchStart;
          if (length >= 3) {
            const tiles = [];
            for (let r = matchStart; r < row; r++) {
              tiles.push(this.board.grid[r][col]);
            }
            rawMatches.push({ tiles, length, type: prev.type, direction: 'v' });
          }
          matchStart = row;
        }
      }
    }
    
    return this.consolidateMatches(rawMatches);
  }

  consolidateMatches(matches) {
    const matchedTiles = new Set();
    const specialsToCreate = [];

    // Map each tile to the matches it belongs to
    const tileToMatches = new Map();

    for (const match of matches) {
      for (const tile of match.tiles) {
        matchedTiles.add(tile);
        if (!tileToMatches.has(tile)) {
          tileToMatches.set(tile, []);
        }
        tileToMatches.get(tile).push(match);
      }
    }

    // Process for specials
    for (const match of matches) {
      if (match.length >= 5) {
        // Create Elemental
        const centerTile = match.tiles[Math.floor(match.length / 2)];
        specialsToCreate.push({ row: centerTile.row, col: centerTile.col, type: match.type, special: TILE_SPECIALS.ELEMENTAL });
      } else if (match.length === 4) {
        // Create Explosive
        const centerTile = match.tiles[Math.floor(match.length / 2)];
        specialsToCreate.push({ row: centerTile.row, col: centerTile.col, type: match.type, special: TILE_SPECIALS.EXPLOSIVE });
      }
    }

    // Handle intersections (T or L shapes)
    tileToMatches.forEach((matchList, tile) => {
      if (matchList.length > 1) { // Tile is in multiple matches (intersection)
        // If not already covered by a >=5 or 4 match logic
        const hasLargeMatch = matchList.some(m => m.length >= 4);
        if (!hasLargeMatch) {
          specialsToCreate.push({ row: tile.row, col: tile.col, type: tile.type, special: TILE_SPECIALS.EXPLOSIVE });
        }
      }
    });

    return { matchedTiles, specialsToCreate };
  }
}
