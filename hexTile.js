function hexTile(height, materialIndex, parentTile, parentTileSide) {
	this.id = hexTile.prototype.idCounter++;
	this.neighbors = [];
	this.materialIndex = materialIndex;
	this.height = height;
	this.sideHeight = [height, height, height, height, height, height];
	this.cornerHeight = [null, null, null, null, null, null];
	this.position = new THREE.Vector3(0, 0, 0);
	this.cornerPoints = [];
	this.sidePoints = [];
	for(var i = 0; i < 6; i++){
		this.cornerPoints.push(new THREE.Vector3());
		this.sidePoints.push(new THREE.Vector3());
	}
	this.minMarkupHeight = height;
	this.cornersCalculated = false;
	this.mesh = null;

	this.gameEntity = null;
	this.gameEntityMesh = null;
	
	this.splitHex = false;
	this.splitHexMaterialIndex = materialIndex;
	this.splitHexSide = 0;
	this.splitHexSize = 1;
	
	this.wall = false;
	this.wallMaterialIndex = materialIndex;
	this.wallSide = 0;
	this.wallHeight = 10;
	this.wallRelativeHeight = true;
	this.wallTaper = 0;
	
	this.pillar = false;
	this.pillarMaterialIndex = materialIndex;
	this.pillarSide = 0;
	this.pillarHeight = 10;
	this.pillarRelativeHeight = true;
	this.pillarSize = 3;
	this.pillarTaper = 0;

	if(parentTile !== undefined){
		this.addNeighbor(parentTile, parentTileSide);
		this.findNeighbors(this, [], 0, 0);
	}
	hexTile.prototype.tiles.push(this);
}

hexTile.prototype.idCounter = 0;
hexTile.prototype.tiles = [];
hexTile.prototype.toSide = Math.round(Math.cos(Math.PI/6)*1000000)/1000000;
hexTile.prototype.neighborOffset = [{}, {}, {}, {}, {}, {}];
hexTile.prototype.neighborOffset[0].x = 0;
hexTile.prototype.neighborOffset[1].x = 1.5;
hexTile.prototype.neighborOffset[2].x = 1.5;
hexTile.prototype.neighborOffset[3].x = -1 * hexTile.prototype.neighborOffset[0].x;
hexTile.prototype.neighborOffset[4].x = -1 * hexTile.prototype.neighborOffset[1].x;
hexTile.prototype.neighborOffset[5].x = -1 * hexTile.prototype.neighborOffset[2].x;
hexTile.prototype.neighborOffset[0].y = 2 * hexTile.prototype.toSide;
hexTile.prototype.neighborOffset[1].y = hexTile.prototype.toSide;
hexTile.prototype.neighborOffset[2].y = -1 * hexTile.prototype.toSide;
hexTile.prototype.neighborOffset[3].y = -1 * hexTile.prototype.neighborOffset[0].y;
hexTile.prototype.neighborOffset[4].y = -1 * hexTile.prototype.neighborOffset[1].y;
hexTile.prototype.neighborOffset[5].y = -1 * hexTile.prototype.neighborOffset[2].y;


hexTile.prototype.getTileById = function(id){
	for(var i in hexTile.prototype.tiles){
		if(hexTile.prototype.tiles[i].id == id) return hexTile.prototype.tiles[i];
	}
	return null;
}

hexTile.prototype.getTileByMesh = function(mesh){
	for(var i in hexTile.prototype.tiles){
		if(hexTile.prototype.tiles[i].mesh === mesh) return hexTile.prototype.tiles[i];
	}
	return null;
}

hexTile.prototype.getTileByPosition = function(position, radius){
	var distance = 0;
	var closestDistance = 999999999;
	var closestTile = null;
	
	for(var i in hexTile.prototype.tiles){
		if(Math.abs(hexTile.prototype.tiles[i].position.x - position.x) < radius && 
			Math.abs(hexTile.prototype.tiles[i].position.y - position.y) < radius){
			distance = Math.sqrt((Math.abs(hexTile.prototype.tiles[i].position.x - position.x))^2 +
					(Math.abs(hexTile.prototype.tiles[i].position.y - position.y))^2);
			if(distance < closestDistance){
				closestDistance = distance;
				closestTile = hexTile.prototype.tiles[i];
			}
		}
	}

	return closestTile;
}

hexTile.prototype.destroy = function(){
	hexTile.prototype.tiles.splice(hexTile.prototype.tiles.indexOf(this), 1);
	for(var i = 0; i < 6; i++){
		if(this.neighbors[i] != null) this.neighbors[i].neighbors[(i+3)%6] = null;
	}
}

hexTile.prototype.setMaterial = function(materialIndex){
	this.materialIndex = materialIndex;
}

hexTile.prototype.setWallMaterial = function(materialIndex){
	this.wallMaterialIndex = materialIndex;
}

hexTile.prototype.setPillarMaterial = function(materialIndex){
	this.pillarMaterialIndex = materialIndex;
}

hexTile.prototype.setSplitHexMaterial = function(materialIndex){
	this.splitHexMaterialIndex = materialIndex;
}

hexTile.prototype.findNeighbors = function(startTile, tilesToSkip, xFromOrigin, yFromOrigin){
	//recurse all tiles keeping track of relative x,y offset to find neighbors
	if(-2 < xFromOrigin < 2 && -2 < yFromOrigin < 2){
		if(Math.abs(xFromOrigin - hexTile.prototype.neighborOffset[5].x) < 0.000001){
			if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[5].y) < 0.000001){
				startTile.addNeighbor(this, 5);
			}else if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[4].y) < 0.000001){
				startTile.addNeighbor(this, 4);
			}
		}else if(Math.abs(xFromOrigin - hexTile.prototype.neighborOffset[0].x) < 0.000001){
			if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[0].y) < 0.000001){
				startTile.addNeighbor(this, 0);
			}else if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[3].y) < 0.000001){
				startTile.addNeighbor(this, 3);
			}
		}else if(Math.abs(xFromOrigin - hexTile.prototype.neighborOffset[1].x) < 0.000001){
			if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[1].y) < 0.000001){
				startTile.addNeighbor(this, 1);
			}else if(Math.abs(yFromOrigin - hexTile.prototype.neighborOffset[2].y) < 0.000001){
				startTile.addNeighbor(this, 2);
			}
		}
	}

	tilesToSkip[this.id] = true;
	for(var i = 0; i < 6; i++){
		if(this.neighbors[i] != null && tilesToSkip[this.neighbors[i].id] != true){
			this.neighbors[i].findNeighbors(startTile, tilesToSkip, xFromOrigin + hexTile.prototype.neighborOffset[i].x, yFromOrigin + hexTile.prototype.neighborOffset[i].y);
			//all tiles are connected so only one start is needed from startTile
			//additional starts would already have been endpoints of the first start
			if(this === startTile) break;
		}
	}
}

hexTile.prototype.addNeighbor = function(neighborTile, side){
	this.neighbors[side] = neighborTile;
	neighborTile.neighbors[(side+3)%6] = this;
	this.sideHeight[side] = neighborTile.sideHeight[(side+3)%6] = (this.height + neighborTile.height)/2;
}

hexTile.prototype.calculateHeights = function(calculateAllTiles){
	if(calculateAllTiles){
		for(var i in hexTile.prototype.tiles){
			hexTile.prototype.tiles[i].calculateSideHeights();
		}
		for(var i in hexTile.prototype.tiles){
			hexTile.prototype.tiles[i].calculateCornerHeights();
		}
	}else{
		this.clearCornerHeights(1);
		this.calculateSideHeights();
		this.calculateCornerHeights();
		for(var i in this.neighbors){
			this.neighbors[i].calculateSideHeights();
			this.neighbors[i].calculateCornerHeights();
		}
	}
}

hexTile.prototype.calculateSideHeights = function(){
	for(var i = 0; i < 6; i++){
		if(this.neighbors[i] != null){
			this.sideHeight[i] = (this.height + this.neighbors[i].height)/2;
		}else{
			this.sideHeight[i] = this.height;
		}
	}
}

hexTile.prototype.calculateCornerHeights = function(limit){
	for(var i = 0; i < 6; i++){
		if(this.cornerHeight[i] == null || this.cornerHeight[i] === undefined){
			if(this.neighbors[i] != null){
				this.cornerHeight[i] = (this.sideHeight[i] +
							this.sideHeight[(i+1)%6] +
							this.neighbors[i].sideHeight[(i+2)%6]) / 3;
				this.neighbors[i].cornerHeight[(i+2)%6] = this.cornerHeight[i];
				if(this.neighbors[(i+1)%6] != null) this.neighbors[(i+1)%6].cornerHeight[(i+4)%6] = this.cornerHeight[i];
			}else if(this.neighbors[(i+1)%6] != null){
				this.cornerHeight[i] = (this.sideHeight[i] +
							this.sideHeight[(i+1)%6] +
							this.neighbors[(i+1)%6].sideHeight[(i+4)%6]) / 3;
				this.neighbors[(i+1)%6].cornerHeight[(i+4)%6] = this.cornerHeight[i];
				//don't need to check if neighbor to the left of this corner exists. never would have gotten here if it did...
			}else{
				this.cornerHeight[i] = (this.sideHeight[i] + this.sideHeight[(i+1)%6]) / 2;
			}
		}
	}
}

hexTile.prototype.clearCornerHeights = function(limit){
	for(var i = 0; i < 6; i++){
		this.cornerHeight[i] = null;
	}
	this.cornersCalculated = false;

	if(limit != 1){
		for(var i = 0; i < 6; i++){
			if(this.neighbors[i] != null && this.neighbors[i].cornersCalculated == true){
				this.neighbors[i].clearCornerHeights(limit - 1);
			}
		}
	}
}

hexTile.prototype.anyPathToTile = function(target, tilesToAvoid, moveLimit){
	var foundPath = null;
	var anyPath = null;
	if(moveLimit == 0) return null;
	tilesToAvoid[this.id] = 1;
	for(var i in this.neighbors){
		if(this.neighbors[i] === target || this === target){
			return [target];
		}else if(this.neighbors[i] != null && tilesToAvoid[this.neighbors[i].id] === undefined){
			foundPath = this.neighbors[i].anyPathToTile(target, tilesToAvoid, moveLimit - 1);
			if(foundPath != null) return [this].concat(foundPath);
		}
	}
	return null;
}

hexTile.prototype.toggleSplitHex = function(){ return this.splitHex = !(this.splitHex);}

hexTile.prototype.rotateSplitHex = function(){ this.splitHexSide = (this.splitHexSide + 1)%6;}

hexTile.prototype.changeSizeSplitHex = function(){ this.splitHexSize = (this.splitHexSize + 1)%3;}

hexTile.prototype.toggleWall = function(){ return this.wall = !(this.wall);}

hexTile.prototype.rotateWall = function(){ this.wallSide = (this.wallSide + 1)%3;}

hexTile.prototype.toggleWallRelativeHeight = function(){ this.wallRelativeHeight = !(this.wallRelativeHeight);}

hexTile.prototype.setWallHeight = function(height){ this.wallHeight = height;}

hexTile.prototype.changeWallTaper = function(){ this.wallTaper = (this.wallTaper + 0.2)%1;}

hexTile.prototype.togglePillar = function(){ return this.pillar = !(this.pillar);}

hexTile.prototype.rotatePillar = function(){ this.pillarSide = (this.pillarSide + 1)%6;}

hexTile.prototype.togglePillarRelativeHeight = function(){ this.pillarRelativeHeight = !(this.pillarRelativeHeight);}

hexTile.prototype.setPillarHeight = function(height){ this.pillarHeight = height;}

hexTile.prototype.changeSizePillar = function(){ this.pillarSize = (this.pillarSize + 1)%4;}

hexTile.prototype.changePillarTaper = function(){ this.pillarTaper = (this.pillarTaper + 0.2)%1;}

hexTile.prototype.getExportTileMin = function(tilesToSkip){
	var exportTile = [];
	var optionals = {};
	var includeOptionals = false;

	exportTile[0] = this.id;
	exportTile[1] = null; //Parent ID, added by caller.
	exportTile[2] = null; //Parent side, added by caller.
	exportTile[3] = Math.round(this.height);

	if(this.materialIndex != 0){
		optionals.m = parseInt(this.materialIndex);
		includeOptionals = true;
	}
	if(this.gameEntity != null){
		optionals.g = parseInt(this.gameEntity);
		includeOptionals = true;
	}
	if(this.splitHex){
		optionals.s = [];
		optionals.s[0] = parseInt(this.splitHexMaterialIndex);
		optionals.s[1] = this.splitHexSide;
		optionals.s[2] = this.splitHexSize;
		includeOptionals = true;
	}

	if(this.wall){
		optionals.w = [];
		optionals.w[0] = parseInt(this.wallMaterialIndex);
		optionals.w[1] = this.wallSide;
		optionals.w[2] = Math.round(this.wallHeight);
		optionals.w[3] = this.wallRelativeHeight ? 1 : 0;
		optionals.w[4] = Math.round(10*this.wallTaper)/10;
		includeOptionals = true;
	}

	if(this.pillar){
		optionals.p = [];
		optionals.p[0] = parseInt(this.pillarMaterialIndex);
		optionals.p[1] = this.pillarSide;
		optionals.p[2] = Math.round(this.pillarHeight);
		optionals.p[3] = this.pillarRelativeHeight ? 1 : 0;
		optionals.p[4] = this.pillarSize;
		optionals.p[5] = Math.round(10*this.pillarTaper)/10;
		includeOptionals = true;
	}

	if(includeOptionals) exportTile[4] = optionals;
	return exportTile;
}

hexTile.prototype.setFromImport = function(importTile){
	this.height = importTile[3];
	if(importTile[4] !== undefined){
		var optionals = importTile[4];
		
		this.materialIndex = optionals.m || 0;
		if(optionals.g !== undefined) this.gameEntity = optionals.g;

		if(optionals.s !== undefined){
			this.splitHex = true;
			this.splitHexMaterialIndex = optionals.s[0];
			this.splitHexSide = optionals.s[1];
			this.splitHexSize = optionals.s[2];
		}
		if(optionals.w !== undefined){
			this.wall = true;
			this.wallMaterialIndex = optionals.w[0];
			this.wallSide = optionals.w[1];
			this.wallHeight = optionals.w[2];
			this.wallRelativeHeight = optionals.w[3];
			this.wallTaper = optionals.w[4];
		}
		if(optionals.p !== undefined){
			this.pillar = true;
			this.pillarMaterialIndex = optionals.p[0];
			this.pillarSide = optionals.p[1];
			this.pillarHeight = optionals.p[2];
			this.pillarRelativeHeight = optionals.p[3];
			this.pillarSize = optionals.p[4];
			this.pillarTaper = optionals.p[5];
		}
	}
}

hexTile.prototype.getLowestCornerHeight = function(){
	var lowest = this.cornerHeight[0];
	for(var i = 1; i < 6; i++){
		lowest = Math.min(lowest, this.cornerHeight[i]);
	}
	return lowest;
}

hexTile.prototype.getHighestCornerHeight = function(){
	var highest = this.cornerHeight[0];
	for(var i = 1; i < 6; i++){
		highest = Math.max(highest, this.cornerHeight[i]);
	}
	return highest;
}



