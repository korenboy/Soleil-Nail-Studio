import { Tile, ALL_TYPES, TILE_SPECIALS } from './Tile.js';
import { Matcher } from './Matcher.js';
import { Combo } from './Combo.js';
import { audio } from '../engine/Audio.js';

export class Board {
  constructor(engine) {
    this.engine = engine;
    this.gridSize = 8;
    this.grid = [];
    this.matcher = new Matcher(this);
    this.combo = new Combo(engine);
    
    this.offsetX = 0;
    this.offsetY = 0;
    this.tileSize = 0;
    this.tilePadding = 3;
    
    this.state = 'idle';
    this.selectedTile = null;
    
    // Bind input events
    this.engine.on('inputStart', this.onInputStart.bind(this));
    this.engine.on('inputDrag', this.onInputDrag.bind(this));
  }

  init() {
    this.calculateLayout();
    this.createBoard();
  }

  calculateLayout() {
    const boardWidth = this.engine.width * 0.85;
    this.tileSize = Math.floor(boardWidth / this.gridSize);
    this.offsetX = (this.engine.width - this.tileSize * this.gridSize) / 2;
    this.offsetY = this.engine.height * 0.42;
  }

  createBoard() {
    this.grid = [];
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        let tile;
        do {
          tile = Tile.random(row, col);
        } while (this.wouldCreateMatch(row, col, tile.type));
        
        const pos = this.gridToScreen(row, col);
        tile.setPosition(pos.x, pos.y);
        this.grid[row][col] = tile;
      }
    }
  }

  wouldCreateMatch(row, col, type) {
    if (col >= 2 && this.grid[row][col-1]?.type === type && this.grid[row][col-2]?.type === type) return true;
    if (row >= 2 && this.grid[row-1]?.[col]?.type === type && this.grid[row-2]?.[col]?.type === type) return true;
    return false;
  }

  gridToScreen(row, col) {
    return {
      x: this.offsetX + col * this.tileSize + this.tileSize / 2,
      y: this.offsetY + row * this.tileSize + this.tileSize / 2
    };
  }

  getBoardConfig() {
    return { offsetX: this.offsetX, offsetY: this.offsetY, tileSize: this.tileSize, gridSize: this.gridSize };
  }

  onInputStart(pos) {
    if (this.state !== 'idle') return;
    
    const inputSys = this.engine.systems.find(s => s.screenToGrid);
    if (!inputSys) return;
    
    const gridPos = inputSys.screenToGrid(pos.x, pos.y, this.getBoardConfig());
    if (gridPos) {
      this.selectedTile = this.grid[gridPos.row][gridPos.col];
    } else {
      this.selectedTile = null;
    }
  }

  onInputDrag({ start, current, direction }) {
    if (this.state !== 'idle' || !this.selectedTile) return;
    
    const r = this.selectedTile.row;
    const c = this.selectedTile.col;
    let targetRow = r, targetCol = c;
    
    if (direction === 'up' && r > 0) targetRow--;
    else if (direction === 'down' && r < this.gridSize - 1) targetRow++;
    else if (direction === 'left' && c > 0) targetCol--;
    else if (direction === 'right' && c < this.gridSize - 1) targetCol++;
    else return;

    const targetTile = this.grid[targetRow][targetCol];
    if (targetTile) {
      this.trySwap(this.selectedTile, targetTile);
    }
    this.selectedTile = null;
  }

  async trySwap(tile1, tile2) {
    this.state = 'swapping';
    audio.playSwap();
    
    // Swap in grid
    this.swapTilesInGrid(tile1, tile2);
    
    // Animate
    await this.animateSwap(tile1, tile2);
    
    // Check match
    const { matchedTiles } = this.matcher.findAllMatches();
    
    if (matchedTiles.size > 0 || tile1.special === TILE_SPECIALS.ELEMENTAL || tile2.special === TILE_SPECIALS.ELEMENTAL) {
      // Valid move!
      await this.processMatches();
    } else {
      // Invalid move, swap back
      audio.playSwap();
      this.swapTilesInGrid(tile1, tile2);
      await this.animateSwap(tile1, tile2);
      this.state = 'idle';
    }
  }

  swapTilesInGrid(t1, t2) {
    const r1 = t1.row, c1 = t1.col;
    t1.row = t2.row; t1.col = t2.col;
    t2.row = r1; t2.col = c1;
    this.grid[t1.row][t1.col] = t1;
    this.grid[t2.row][t2.col] = t2;
  }

  async processMatches() {
    this.state = 'matching';
    let hasMatches = true;
    
    while (hasMatches) {
      const { matchedTiles, specialsToCreate } = this.matcher.findAllMatches();
      
      if (matchedTiles.size === 0) {
        hasMatches = false;
        break;
      }
      
      this.combo.increment();
      audio.playMatch();
      
      // Handle special abilities
      for (const tile of matchedTiles) {
        if (tile.special === TILE_SPECIALS.EXPLOSIVE) {
          this.activateSpecialExplosive(tile, matchedTiles);
          audio.playExplosion();
        } else if (tile.special === TILE_SPECIALS.ELEMENTAL) {
          this.activateSpecialElemental(tile.type, matchedTiles);
          audio.playHeroSkill(); // Good enough for big clear
        }
      }
      
      // Animate removal
      await this.animateMatches(matchedTiles, specialsToCreate);
      
      // Apply gravity
      await this.animateGravity();
      
      // Fill empty
      await this.animateFill();
      
      // Small pause for chain reactions
      await new Promise(r => setTimeout(r, 100));
    }
    
    this.state = 'idle';
    this.engine.emit('turnEnd', { combo: this.combo.reset() });
  }

  activateSpecialExplosive(tile, matchedSet) {
    for (let i = 0; i < this.gridSize; i++) {
      if (this.grid[tile.row][i]) matchedSet.add(this.grid[tile.row][i]);
      if (this.grid[i][tile.col]) matchedSet.add(this.grid[i][tile.col]);
    }
    const particleSys = this.engine.systems.find(s => s.emitExplosion);
    if (particleSys) particleSys.emitExplosion(tile.x, tile.y, tile.getColors().main);
  }

  activateSpecialElemental(type, matchedSet) {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] && this.grid[r][c].type === type) {
          matchedSet.add(this.grid[r][c]);
        }
      }
    }
  }

  async animateSwap(t1, t2) {
    const p1 = this.gridToScreen(t1.row, t1.col);
    const p2 = this.gridToScreen(t2.row, t2.col);
    t1.setTarget(p1.x, p1.y);
    t2.setTarget(p2.x, p2.y);
    await this.waitForAnimations();
  }

  async animateMatches(matchedSet, specialsToCreate) {
    // Collect gems/damage logic here or emit event
    const tilesArr = Array.from(matchedSet);
    
    const particleSys = this.engine.systems.find(s => s.emitMatchBurst);
    
    // Shrink animation
    for (let i = 0; i < 10; i++) {
      tilesArr.forEach(t => t.scale = 1 - (i/10));
      await new Promise(r => setTimeout(r, 16)); // ~1 frame
    }
    
    tilesArr.forEach(t => {
      if (particleSys) particleSys.emitMatchBurst(t.x, t.y, t.getColors().main);
      this.grid[t.row][t.col] = null;
    });

    // Create Specials
    specialsToCreate.forEach(s => {
      const tile = new Tile(s.type, s.row, s.col);
      tile.special = s.special;
      const pos = this.gridToScreen(s.row, s.col);
      tile.setPosition(pos.x, pos.y);
      this.grid[s.row][s.col] = tile;
    });
  }

  async animateGravity() {
    let moved = false;
    for (let c = 0; c < this.gridSize; c++) {
      let emptyRows = 0;
      for (let r = this.gridSize - 1; r >= 0; r--) {
        if (!this.grid[r][c]) {
          emptyRows++;
        } else if (emptyRows > 0) {
          const tile = this.grid[r][c];
          this.grid[r + emptyRows][c] = tile;
          this.grid[r][c] = null;
          tile.row = r + emptyRows;
          const target = this.gridToScreen(tile.row, tile.col);
          tile.setTarget(target.x, target.y);
          moved = true;
        }
      }
    }
    if (moved) await this.waitForAnimations();
  }

  async animateFill() {
    let newTiles = [];
    for (let c = 0; c < this.gridSize; c++) {
      let emptyRows = 0;
      for (let r = this.gridSize - 1; r >= 0; r--) {
        if (!this.grid[r][c]) emptyRows++;
      }
      
      for (let r = 0; r < emptyRows; r++) {
        const tile = Tile.random(r, c);
        const target = this.gridToScreen(r, c);
        // Start above board
        tile.setPosition(target.x, target.y - (emptyRows * this.tileSize));
        tile.setTarget(target.x, target.y);
        this.grid[r][c] = tile;
        newTiles.push(tile);
      }
    }
    if (newTiles.length > 0) await this.waitForAnimations();
  }

  async waitForAnimations() {
    return new Promise(resolve => {
      const check = () => {
        let animating = false;
        this.forEachTile(t => { if (t && t.animating) animating = true; });
        if (!animating) resolve();
        else requestAnimationFrame(check);
      };
      check();
    });
  }

  forEachTile(cb) {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        cb(this.grid[r][c], r, c);
      }
    }
  }

  update(dt) {
    this.forEachTile(t => { if (t) t.update(dt); });
    this.combo.update(dt);
  }

  render(ctx) {
    const renderer = this.engine.systems.find(s => s.drawTile);
    if (!renderer) return;

    // Draw board BG
    const bgSize = this.tileSize * this.gridSize;
    renderer.drawRoundedRect(this.offsetX - 5, this.offsetY - 5, bgSize + 10, bgSize + 10, 15, 'rgba(0,0,0,0.4)', {color: 'rgba(255,255,255,0.1)', width: 2});

    this.forEachTile(tile => {
      if (tile) {
        renderer.drawTile(tile.x, tile.y, this.tileSize, tile.type, tile.special, tile.alpha, tile.scale);
        
        // Selection highlight
        if (this.selectedTile === tile) {
          ctx.save();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 10;
          const s = this.tileSize * 0.9;
          ctx.strokeRect(tile.x - s/2, tile.y - s/2, s, s);
          ctx.restore();
        }
      }
    });
  }
}
