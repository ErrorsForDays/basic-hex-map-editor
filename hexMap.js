function hexMap(scene, tileRadius, materials) {
	this.centerHex = {};
	this.centerHexMarkerMesh = null;

	this.bounds = {lower: {x: 0, y:0}, upper: {x: 0, y:0}};

	this.materials = materials;
	this.defaultMaterialIndex = 0;
	this.tileRadius = tileRadius;
	this.halfTileRadius = this.tileRadius/2;
	this.toSide = this.tileRadius * hexTile.prototype.toSide;

	this.scene = scene;
	this.addTiles = [];
	this.editMarkupMesh = null;
	this.editMarkupLineMaterial = new THREE.LineBasicMaterial({color: 0x202020, linewidth: 5});
	this.changeHeightHandleMesh = null;
	this.changeHeightHandleMesh = this.getChangeHeightHandleMesh();
	
	this.tileOffset = [{}, {}, {}, {}, {}, {}];
	this.objectsToLoad = [];
	this.loadedObjects = [];
	for(var i = 0; i < 6; i++){
		this.tileOffset[i].x = this.tileRadius * hexTile.prototype.neighborOffset[i].x;
		this.tileOffset[i].y = this.tileRadius * hexTile.prototype.neighborOffset[i].y;
	}
}

hexMap.prototype.getChangeHeightHandleMesh = function(){
	if(this.changeHeightHandleMesh != null) return this.changeHeightHandleMesh;
	var geometry = new THREE.CylinderGeometry(0, this.tileRadius/4, this.tileRadius/4, 6, 1, false);
	var mesh = new THREE.Mesh(geometry);
	mesh.position.y += this.tileRadius/4;
	geometry = new THREE.CylinderGeometry(this.tileRadius/10, this.tileRadius/10, this.tileRadius/4, 6, 1, true);
	THREE.GeometryUtils.merge(geometry, mesh);
	mesh = new THREE.Mesh(geometry);
	mesh.position.y += this.tileRadius/4;
	geometry = new THREE.CylinderGeometry(this.tileRadius/4, 0, this.tileRadius/4, 6, 1, false);
	THREE.GeometryUtils.merge(geometry, mesh);
	mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
	mesh.rotation.x = Math.PI/2;
	return mesh;
}

hexMap.prototype.loadBlankMap = function(){
	this.centerHex = new hexTile(0, this.defaultMaterialIndex);
	this.centerHex.calculateHeights(true);
}

hexMap.prototype.getCenterHexMarkerMesh = function(){
	if(this.centerHexMarkerMesh == null){
		var geometry = new THREE.CylinderGeometry(this.tileRadius/6, 0, this.tileRadius, 6, 1, false);
		geometry.computeCentroids();
		geometry.computeFaceNormals();
		this.centerHexMarkerMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0xff0000, emissive: 0x880000, opacity: 0.6, transparent: true}));
		this.centerHexMarkerMesh.rotation.x = Math.PI/2;
	}
	return this.centerHexMarkerMesh;
}

hexMap.prototype.showEditMarkup = function(tile){
	this.updateEditMarkup(tile);
	this.scene.add(this.changeHeightHandleMesh);
	if(tile === this.centerHex){
		this.centerHexMarkerMesh.scale.y = 0.2;
		this.centerHexMarkerMesh.position.z = tile.minMarkupHeight + this.tileRadius/5;
	}else{
		this.centerHexMarkerMesh.scale.y = 1;
		this.centerHexMarkerMesh.position.z = this.centerHex.minMarkupHeight + this.tileRadius/2;
	}
}

hexMap.prototype.updateEditMarkup = function(tile){
	this.changeHeightHandleMesh.position.x = tile.mesh.position.x;
	this.changeHeightHandleMesh.position.y = tile.mesh.position.y;
	this.changeHeightHandleMesh.position.z = tile.minMarkupHeight + 25;
	if(tile === this.centerHex) this.getCenterHexMarkerMesh().position.z = tile.minMarkupHeight + this.tileRadius/5;
	
	for(var i = 0; i < 6; i++){
		this.addTiles[i].position.z = tile.mesh.position.z - 3;
	}
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(this.halfTileRadius, this.toSide, tile.cornerHeight[0] - tile.height));
	geometry.vertices.push(new THREE.Vector3(this.tileRadius, 0, tile.cornerHeight[1] - tile.height));
	geometry.vertices.push(new THREE.Vector3(this.halfTileRadius, -1*this.toSide, tile.cornerHeight[2] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.halfTileRadius, -1*this.toSide, tile.cornerHeight[3] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.tileRadius, 0, tile.cornerHeight[4] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.halfTileRadius, this.toSide, tile.cornerHeight[5] - tile.height));
	geometry.vertices.push(new THREE.Vector3(this.halfTileRadius, this.toSide, tile.cornerHeight[0] - tile.height));
	this.scene.remove(this.editMarkupMesh);
	this.editMarkupMesh = new THREE.Line(geometry, this.editMarkupLineMaterial);
	this.editMarkupMesh.position = tile.mesh.position.clone();
	this.editMarkupMesh.position.z += 5;
	this.scene.add(this.editMarkupMesh);
}

hexMap.prototype.hideEditMarkup = function(){
	this.scene.remove(this.changeHeightHandleMesh);
	this.scene.remove(this.editMarkupMesh);
	this.centerHexMarkerMesh.scale.z = 1;
	this.centerHexMarkerMesh.position.z = this.centerHex.mesh.position.z + this.tileRadius/2;
}

hexMap.prototype.showAddTiles = function(tile){
	var group = null;
	var mesh = null;
	var textMesh = null;
	var geometry = new THREE.CylinderGeometry(this.tileRadius - 3, this.tileRadius, 10, 6, 1, false);
	var textGeometry = new THREE.TextGeometry("NEW", { size: this.tileRadius/2 - 2, height: 4, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" });
	var material = new THREE.MeshLambertMaterial({color: 0xffffff});
	var textMaterial = new THREE.MeshLambertMaterial({color: 0xcc3333});

	for(var i = 0; i < 6; i++){
		if(this.addTiles[i] == null){
			mesh = new THREE.Mesh(geometry, material);
			mesh.rotation.x = Math.PI/2;
			mesh.rotation.y = Math.PI/6;
			textMesh = new THREE.Mesh(textGeometry, textMaterial);
			textMesh.position.x -= this.tileRadius*2/3;
			textMesh.position.y -= this.tileRadius/4;
			textMesh.position.z += 6;
			group = new THREE.Object3D();
			group.add(mesh);
			group.add(textMesh);
			group.rotation.z = -i * Math.PI/3;
			this.addTiles[i] = group;
		}
		this.scene.remove(this.addTiles[i]);
		if(tile.neighbors[i] == null){
			this.addTiles[i].position.x = tile.mesh.position.x + this.tileOffset[i].x;
			this.addTiles[i].position.y = tile.mesh.position.y + this.tileOffset[i].y;
			this.addTiles[i].position.z = tile.mesh.position.z - 3;
			this.scene.add(this.addTiles[i]);
		}
	}
}

hexMap.prototype.hideAddTiles = function(){
	for(var i = 0; i < 6; i++){
		this.scene.remove(this.addTiles[i]);
	}
}

hexMap.prototype.showMap = function(){
	this.showTile(this.centerHex, 0, 0, 0);
	this.setCenterHex(this.centerHex);
}

hexMap.prototype.showTile = function(tile, x, y, z){
	
	var wallSideHeight = 0; var wallOppositeSideHeight = 0; var pillarHeight = 0;
	var insidesAreUp = false;
	var geometry = new THREE.Geometry();

	geometry.vertices.push(new THREE.Vector3(0, 0, 0));
	//Create the corners clockwise starting at 1 o'clock
	geometry.vertices.push(new THREE.Vector3(this.halfTileRadius, this.toSide, tile.cornerHeight[0] - tile.height));
	geometry.vertices.push(new THREE.Vector3(this.tileRadius, 0, tile.cornerHeight[1] - tile.height));
	geometry.vertices.push(new THREE.Vector3(this.halfTileRadius, -1*this.toSide, tile.cornerHeight[2] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.halfTileRadius, -1*this.toSide, tile.cornerHeight[3] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.tileRadius, 0, tile.cornerHeight[4] - tile.height));
	geometry.vertices.push(new THREE.Vector3(-1*this.halfTileRadius, this.toSide, tile.cornerHeight[5] - tile.height));
	
	if(tile.pillar){
		if(tile.pillarRelativeHeight){
			pillarHeight = tile.pillarHeight;
		}else{
			pillarHeight = tile.pillarHeight - tile.height;
		}
		
		tile.minMarkupHeight = tile.height + pillarHeight;

		geometry.vertices.push(new THREE.Vector3(0, 0, pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 2)%6 + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 2)%6 + 1].y,
							pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 3)%6 + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 3)%6 + 1].y,
							pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 1)%6 + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 1)%6 + 1].y,
							pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 4)%6 + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 4)%6 + 1].y,
							pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[tile.pillarSide + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[tile.pillarSide + 1].y,
							pillarHeight));
		geometry.vertices.push(new THREE.Vector3((1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 5)%6 + 1].x,
							(1-tile.pillarTaper) * geometry.vertices[(tile.pillarSide + 5)%6 + 1].y,
							pillarHeight));
		
		geometry.faces.push(new THREE.Face3(0, 1, 6));
		geometry.faces.push(new THREE.Face3(0, 2, 1));
		geometry.faces.push(new THREE.Face3(0, 3, 2));
		geometry.faces.push(new THREE.Face3(0, 4, 3));
		geometry.faces.push(new THREE.Face3(0, 5, 4));
		geometry.faces.push(new THREE.Face3(0, 6, 5));
			
		switch(tile.pillarSize){
			case 3: geometry.faces.push(new THREE.Face3(7, 9, 8));
				geometry.faces.push(new THREE.Face4(8, 9, (tile.pillarSide + 3)%6 + 1, (tile.pillarSide + 2)%6 + 1));
				insidesAreUp = true;
			case 2:	geometry.faces.push(new THREE.Face3(7, 8, 10));
				geometry.faces.push(new THREE.Face4(10, 8, (tile.pillarSide + 2)%6 + 1, (tile.pillarSide + 1)%6 + 1));
				geometry.faces.push(new THREE.Face3(7, 11, 9));
				geometry.faces.push(new THREE.Face4(9, 11, (tile.pillarSide + 4)%6 + 1, (tile.pillarSide + 3)%6 + 1));
				if(!insidesAreUp){
					geometry.faces.push(new THREE.Face4(7, 0, (tile.pillarSide + 2)%6 + 1, 8));
					geometry.faces.push(new THREE.Face4(0, 7, 9, (tile.pillarSide + 3)%6 + 1));
					insidesAreUp = true;
				}
			case 1:	geometry.faces.push(new THREE.Face3(7, 10, 12));
				geometry.faces.push(new THREE.Face4(12, 10, (tile.pillarSide + 1)%6 + 1, tile.pillarSide + 1));
				geometry.faces.push(new THREE.Face3(7, 13, 11));
				geometry.faces.push(new THREE.Face4(11, 13, (tile.pillarSide + 5)%6 + 1, (tile.pillarSide + 4)%6 + 1));
				if(!insidesAreUp){
					geometry.faces.push(new THREE.Face4(7, 0, (tile.pillarSide + 1)%6 + 1, 10));
					geometry.faces.push(new THREE.Face4(0, 7, 11, (tile.pillarSide + 4)%6 + 1));
					insidesAreUp = true;
				}
			case 0:	geometry.faces.push(new THREE.Face3(7, 12, 13));
				geometry.faces.push(new THREE.Face4(13, 12, tile.pillarSide + 1, (tile.pillarSide + 5)%6 + 1));
				if(!insidesAreUp){
					geometry.faces.push(new THREE.Face4(7, 0, tile.pillarSide + 1, 12));
					geometry.faces.push(new THREE.Face4(0, 7, 13, (tile.pillarSide + 5)%6 + 1));
				}
		}

	}else if(tile.wall){
		if(tile.wallRelativeHeight){
			wallSideHeight = Math.max(tile.cornerHeight[(tile.wallSide + 5)%6],
						tile.cornerHeight[tile.wallSide])
					+ tile.wallHeight - tile.height;
			wallOppositeSideHeight = Math.max(tile.cornerHeight[(tile.wallSide + 2)%6],
						tile.cornerHeight[(tile.wallSide + 3)%6])
					+ tile.wallHeight - tile.height;
		}else{
			wallSideHeight = Math.max(tile.wallHeight,
						Math.max(tile.cornerHeight[(tile.wallSide + 5)%6],
							tile.cornerHeight[tile.wallSide]))
					- tile.height;
			wallOppositeSideHeight = Math.max(tile.wallHeight,
							Math.max(tile.cornerHeight[(tile.wallSide + 2)%6],
								tile.cornerHeight[(tile.wallSide + 3)%6]))
						- tile.height;
		}
		tile.minMarkupHeight = tile.height + (wallSideHeight + wallOppositeSideHeight)/2;

		geometry.vertices.push(new THREE.Vector3(0.625 * geometry.vertices[tile.wallSide + 2].x,
							0.625 * geometry.vertices[tile.wallSide + 2].y,
							(tile.cornerHeight[tile.wallSide + 1] - tile.height)/2));
		geometry.vertices.push(new THREE.Vector3(0.625 * geometry.vertices[(tile.wallSide + 4)%6 + 1].x,
							0.625 * geometry.vertices[(tile.wallSide + 4)%6 + 1].y,
							(tile.cornerHeight[(tile.wallSide + 4)%6] - tile.height)/2));
		geometry.vertices.push(new THREE.Vector3(0.5 * geometry.vertices[tile.wallSide + 2].x,
							0.5 * geometry.vertices[tile.wallSide + 2].y,
							Math.min((wallSideHeight + wallOppositeSideHeight)/2 - 5, geometry.vertices[7].z + 5)));
		geometry.vertices.push(new THREE.Vector3(0.5 * geometry.vertices[(tile.wallSide + 4)%6 + 1].x,
							0.5 * geometry.vertices[(tile.wallSide + 4)%6 + 1].y,
							Math.min((wallSideHeight + wallOppositeSideHeight)/2 - 5, geometry.vertices[8].z + 5)));
		
		geometry.vertices.push(new THREE.Vector3((1-tile.wallTaper) * geometry.vertices[tile.wallSide + 1].x,
							(1-tile.wallTaper) * geometry.vertices[tile.wallSide + 1].y,
							wallSideHeight));

		geometry.vertices.push(new THREE.Vector3((1-tile.wallTaper) * geometry.vertices[tile.wallSide + 3].x,
							(1-tile.wallTaper) * geometry.vertices[tile.wallSide + 3].y,
							wallOppositeSideHeight));

		geometry.vertices.push(new THREE.Vector3((1-tile.wallTaper) * geometry.vertices[tile.wallSide + 4].x,
							(1-tile.wallTaper) * geometry.vertices[tile.wallSide + 4].y,
							wallOppositeSideHeight));

		geometry.vertices.push(new THREE.Vector3((1-tile.wallTaper) * geometry.vertices[(tile.wallSide + 5)%6 + 1].x,
							(1-tile.wallTaper) * geometry.vertices[(tile.wallSide + 5)%6 + 1].y,
							wallSideHeight));

		//first and fourth face are placeholders to calculate split hex terrain materials
		geometry.faces.push(new THREE.Face3(7, tile.wallSide + 2, tile.wallSide + 1));
		geometry.faces.push(new THREE.Face3(7, tile.wallSide + 2, tile.wallSide + 1));
		geometry.faces.push(new THREE.Face3(7, tile.wallSide + 3, tile.wallSide + 2));
		geometry.faces.push(new THREE.Face3(8, (tile.wallSide + 4)%6 + 1, (tile.wallSide + 3)%6 + 1));
		geometry.faces.push(new THREE.Face3(8, (tile.wallSide + 4)%6 + 1, (tile.wallSide + 3)%6 + 1));
		geometry.faces.push(new THREE.Face3(8, (tile.wallSide + 5)%6 + 1, (tile.wallSide + 4)%6 + 1));

		geometry.faces.push(new THREE.Face3(9, 7, tile.wallSide + 1));
		geometry.faces.push(new THREE.Face3(7, 9, tile.wallSide + 3));
		geometry.faces.push(new THREE.Face3(10, 8, (tile.wallSide + 3)%6 + 1));
		geometry.faces.push(new THREE.Face3(8, 10, (tile.wallSide + 5)%6 + 1));

		geometry.faces.push(new THREE.Face3(9, tile.wallSide + 1, 11));
		geometry.faces.push(new THREE.Face3(9, 11, 12));
		geometry.faces.push(new THREE.Face3(9, 12, tile.wallSide + 3));

		geometry.faces.push(new THREE.Face3(10, (tile.wallSide + 3)%6 + 1, 13));
		geometry.faces.push(new THREE.Face3(10, 13, 14));
		geometry.faces.push(new THREE.Face3(10, 14, (tile.wallSide + 5)%6 + 1));

		geometry.faces.push(new THREE.Face4(14, 13, 12, 11));

		if(tile.wallTaper > 0 || tile.neighbors[tile.wallSide] == null || (tile.neighbors[tile.wallSide] != null && !(tile.neighbors[tile.wallSide].wall && tile.neighbors[tile.wallSide].wallTaper == 0 && tile.wallSide == tile.neighbors[tile.wallSide].wallSide && tile.wallRelativeHeight == tile.neighbors[tile.wallSide].wallRelativeHeight && tile.wallHeight == tile.neighbors[tile.wallSide].wallHeight))) geometry.faces.push(new THREE.Face4(tile.wallSide + 1, (tile.wallSide + 5)%6 + 1, 14, 11));
		if(tile.wallTaper > 0 || tile.neighbors[tile.wallSide + 3] == null || (tile.neighbors[tile.wallSide + 3] != null && !(tile.neighbors[tile.wallSide + 3].wall && tile.neighbors[tile.wallSide + 3].wallTaper == 0 && tile.wallSide == tile.neighbors[tile.wallSide + 3].wallSide && tile.wallRelativeHeight == tile.neighbors[tile.wallSide + 3].wallRelativeHeight && tile.wallHeight == tile.neighbors[tile.wallSide + 3].wallHeight))) geometry.faces.push(new THREE.Face4(tile.wallSide + 3, 12, 13, (tile.wallSide + 3)%6 + 1));
	 
	}else{
		geometry.faces.push(new THREE.Face3(0, 1, 6));
		geometry.faces.push(new THREE.Face3(0, 2, 1));
		geometry.faces.push(new THREE.Face3(0, 3, 2));
		geometry.faces.push(new THREE.Face3(0, 4, 3));
		geometry.faces.push(new THREE.Face3(0, 5, 4));
		geometry.faces.push(new THREE.Face3(0, 6, 5));
		tile.minMarkupHeight = tile.height;
	}
	
	geometry.materials = [this.materials[tile.materialIndex].material,
				this.materials[tile.splitHexMaterialIndex].material];
	if(tile.wall) geometry.materials.push(this.materials[tile.wallMaterialIndex].material);
	if(tile.pillar) geometry.materials.push(this.materials[tile.pillarMaterialIndex].material);
	for(var i in geometry.faces){
		if(i < 6){
			geometry.faces[i].materialIndex = 0;
		}else{
			if(tile.wall || tile.pillar){
				geometry.faces[i].materialIndex = 2;
			}
		}
	}

	if(tile.splitHex){
		switch(tile.splitHexSize){
			case 2:	geometry.faces[(tile.splitHexSide + 4)%6].materialIndex = 1;
				geometry.faces[(tile.splitHexSide + 2)%6].materialIndex = 1;
			case 1:	geometry.faces[(tile.splitHexSide + 5)%6].materialIndex = 1;
				geometry.faces[(tile.splitHexSide + 1)%6].materialIndex = 1;
			case 0:	geometry.faces[tile.splitHexSide].materialIndex = 1;
		}
	}

	if(tile.wall){
		geometry.faces.splice(3, 1);
		geometry.faces.splice(0, 1);
		geometry.faces[4].materialIndex = geometry.faces[0].materialIndex;
		geometry.faces[5].materialIndex = geometry.faces[1].materialIndex;
		geometry.faces[6].materialIndex = geometry.faces[2].materialIndex;
		geometry.faces[7].materialIndex = geometry.faces[3].materialIndex;
	}else if(tile.pillar){
		for(var i = 5; i >= 0; i--){
			if(tile.pillarSide == i ||
				(tile.pillarSize >= 1 && ((tile.pillarSide + 1)%6 == i || (tile.pillarSide + 5)%6 == i)) ||
				(tile.pillarSize >= 2 && ((tile.pillarSide + 2)%6 == i || (tile.pillarSide + 4)%6 == i)) ||
				tile.pillarSize == 3){
				geometry.faces.splice(i, 1);
			}
		}
	}

	geometry.computeFaceNormals();
	geometry.mergeVertices();
	var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(geometry.materials));
	
	mesh.position.set(x, y, tile.height);
	this.scene.add(mesh);
	tile.mesh = mesh;

	if(x < this.bounds.lower.x){
		this.bounds.lower.x = x;
	}else if(x > this.bounds.upper.x){
		this.bounds.upper.x = x;
	}
	if(y < this.bounds.lower.y){
		this.bounds.lower.y = y;
	}else if(y > this.bounds.upper.y){
		this.bounds.upper.y = y;
	}

	if(tile.gameEntity != null){
		if(tile.gameEntityMesh == null){
			var textGeometry = new THREE.TextGeometry(tile.gameEntity, { size: this.tileRadius, height: 3, curveSegments: 6, font: "helvetiker", weight: "normal", style: "normal" });
			tile.gameEntityMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.6, transparent: true}));
		}
		if(tile.gameEntity < 10){
			tile.gameEntityMesh.position.x = x - this.tileRadius/2 + 5;
		}else{
			tile.gameEntityMesh.position.x = x - this.tileRadius + 5;
		}
		tile.gameEntityMesh.position.y = y - this.tileRadius/2;
		tile.gameEntityMesh.position.z = tile.minMarkupHeight + 5;
		this.scene.add(tile.gameEntityMesh);
	}

	for(var i = 0; i < 6; i++){
		if(tile.neighbors[i] != null && tile.neighbors[i].mesh == null){
			this.showTile(tile.neighbors[i], x + this.tileOffset[i].x, y + this.tileOffset[i].y, z);
		}
	}
}

hexMap.prototype.hideMap = function(){
	this.hideTile(this.centerHex, false, true);
}

hexMap.prototype.hideTile = function(tile, hideNeighbors, hideAll){
	if(tile.mesh != null){
		this.scene.remove(tile.mesh);
		this.scene.remove(tile.gameEntityMesh);
		tile.mesh = null;
	}

	if(hideNeighbors || hideAll){
		for(var i = 0; i < 6; i++){
			if(tile.neighbors[i] != null && tile.neighbors[i].mesh != null){
				if(hideAll){
					this.hideTile(tile.neighbors[i], false, true);
				}else{
					this.hideTile(tile.neighbors[i]);
				}
			}
		}
	}
}

hexMap.prototype.removeTile = function(tile, removeNeighbors, removeAll){
	if(tile === this.centerHex){
		for(var i = 0; i < 6; i++){
			if(tile.neighbors[i] != null){
				this.setCenterHex(tile.neighbors[i]);
				break;
			}
		}
	}
	if(tile === this.centerHex){
		alert("Can't delete last tile.");
		return;
	}
	var deleteAble = true;
	for(var i = 0; i < 6; i++){
		if(tile.neighbors[i] != null && (i == 0 || tile.neighbors[i-1] == null) && !(i==5 && tile.neighbors[0] != null)){
			var tilesToAvoid = [];
			tilesToAvoid[tile.id] = 1;
			if(tile.neighbors[i] != null && tile.neighbors[i].anyPathToTile(this.centerHex, tilesToAvoid, 1000) == null) deleteAble = false;
		}
	}
	if(deleteAble){
		this.hideTile(tile, false, false);
		tile.destroy();
		$('#closeEditButton').click();
	}else{
		alert("Can't leave part of the map unconnected. Move centerhex closer if it is connected.");
	}
}

hexMap.prototype.setCenterHex = function(tile){
	if(tile.__proto__ === this.centerHex.__proto__){
		this.centerHex = tile;
		var markerMesh = this.getCenterHexMarkerMesh();
		this.scene.remove(markerMesh);
		this.scene.add(markerMesh);
		markerMesh.position = tile.mesh.position.clone();
		markerMesh.position.z = tile.minMarkupHeight + this.tileRadius/2;
		this.scene.__lights[0].position.x = markerMesh.position.x;
		this.scene.__lights[0].position.y = markerMesh.position.y;
		this.scene.__lights[0].position.z = markerMesh.position.z;
	}
}

hexMap.prototype.exportToJSON = function(){
	var exportTiles = [];
	var tilesToSkip = [];

	var exportTile = this.centerHex.getExportTileMin();
	exportTiles.push(exportTile);
	tilesToSkip.push(this.centerHex);

	while(exportTiles.length < hexTile.prototype.tiles.length){
		this_tile:
		for(var t in hexTile.prototype.tiles){
			if($.inArray(hexTile.prototype.tiles[t], tilesToSkip) >= 0) continue;
			for(var n in hexTile.prototype.tiles[t].neighbors){
				if(hexTile.prototype.tiles[t].neighbors[n] == null) continue;
				for(var e in exportTiles){
					if(exportTiles[e][0] == hexTile.prototype.tiles[t].neighbors[n].id){
						exportTile = hexTile.prototype.tiles[t].getExportTileMin();
						exportTile[1] = exportTiles[e][0];
						exportTile[2] = parseInt(n);
						exportTiles.push(exportTile);
						tilesToSkip.push(hexTile.prototype.tiles[t]);
						continue this_tile;
					}
				}
			}
		}
	}


	var exportMaterials = [];
	for(var i in this.materials){
		var material = {};
		material.index = i;
		material.type = this.materials[i].type;
		material.name = this.materials[i].name;
		if($.inArray(material.type, [0, 1, 2]) >= 0) material.color = this.materials[i].material.color.getHex();
		if($.inArray(material.type, [1, 2]) >= 0) material.emissive = this.materials[i].material.emissive.getHex();
		material.wireframe = this.materials[i].material.wireframe;
		exportMaterials.push(material);
	}
	return JSON.stringify({materials: exportMaterials, tiles: exportTiles});
}

hexMap.prototype.importFromObject = function(importTiles){
	this.hideMap();
	this.centerHex = null;
	while(hexTile.prototype.tiles.length > 0){
		hexTile.prototype.tiles[0].destroy();
	}

	this.objectsToLoad.length = 0;
	this.loadedObjects.length = 0;
	this.objectsToLoad = importTiles;
	this.continueLoading(1);
}

hexMap.prototype.continueLoading = function(limit){
	if(this.objectsToLoad.length == 0){
		this.centerHex.calculateHeights(true);
		this.showMap();
		$('#loadingDiv').toggle(false);
	}else if(limit == 0){
		$('#loadcount').empty().append(hexTile.prototype.tiles.length);
		return;
	}else{
		for(var i in this.objectsToLoad){
			i = parseInt(i);
			if(this.centerHex == null && this.objectsToLoad[i][1] == null){
				this.centerHex = new hexTile(this.objectsToLoad[i][3], 0);
				var newTile = this.centerHex;
			}else{
				if(this.loadedObjects[this.objectsToLoad[i][1]] === undefined) continue;
				var parentTile = this.loadedObjects[this.objectsToLoad[i][1]];
				parentTile.neighbors[(this.objectsToLoad[i][2] + 3)%6] = new hexTile(this.objectsToLoad[i][3], 0, parentTile, this.objectsToLoad[i][2]);
				var newTile = parentTile.neighbors[(this.objectsToLoad[i][2] + 3)%6];
			}
			newTile.setFromImport(this.objectsToLoad[i]);
			this.loadedObjects[this.objectsToLoad[i][0]] = newTile;
			this.objectsToLoad.splice(i, 1);
			this.continueLoading(limit - 1);
			return;
		}
	}
}



