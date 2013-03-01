window.HexMapEditor = window.HexMapEditor || {};

if(!window.requestAnimationFrame){
	window.requestAnimationFrame = ( function(){
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback, element){ 
			window.setTimeout(callback, 1000/60);
		};
	})();
}

HexMapEditor.init = function(){
	HexMapEditor.mapSamples = [];
	HexMapEditor.mapSamples[0] = {name: "Mars", filename: "sample01.json"};
	HexMapEditor.mapSamples[1] = {name: "Dam", filename: "sample02.json"};

	var width = window.innerWidth, height = window.innerHeight;
	var viewAngle = 45, aspect = width/height, near = 0.1, far = 10000;

	HexMapEditor.isCameraMoving = false;
	HexMapEditor.isCameraRotating = false;
	HexMapEditor.isHeightDragging = false;
	HexMapEditor.isShiftDown = false;
	HexMapEditor.dontClickMe = false;
	
	HexMapEditor.time = 0; HexMapEditor.lastTime = Date.now(); HexMapEditor.timeDelta = 0;
	HexMapEditor.tileBeingEdited = null;
	HexMapEditor.tileBeingCloned = null;
	HexMapEditor.mouse2D = {x: 0, y: 0};
	HexMapEditor.dragStart = {x: 0, y: 0};
	HexMapEditor.dragDelay = 25;
	HexMapEditor.heightChangeMultiplier = 50;
	HexMapEditor.rotationMultiplier = 100;
	HexMapEditor.tiltMultiplier = 50;
	HexMapEditor.cameraMovementMultiplier = 1;
	HexMapEditor.clickIntersects = [];
	
	HexMapEditor.theta = 0;
	HexMapEditor.tilt = 0;
	HexMapEditor.cameraDistance = 600;
	HexMapEditor.cameraAimPoint = {x: 0, y: 0};

	HexMapEditor.renderer = new THREE.WebGLRenderer({'antialias': false});
	HexMapEditor.camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
	HexMapEditor.scene = new THREE.Scene();

	HexMapEditor.camera.up.set(0, 0, 1);
	HexMapEditor.scene.add(HexMapEditor.camera);
	HexMapEditor.renderer.setSize(width, height);

	HexMapEditor.light = new THREE.PointLight(0xff2266, 1, 300);
	HexMapEditor.light.position.x = -100;
	HexMapEditor.light.position.y = 100;
	HexMapEditor.light.position.z = 100;
	HexMapEditor.scene.add(HexMapEditor.light);
	HexMapEditor.scene.add(THREE.AmbientLight(0x666666));
	HexMapEditor.directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
	HexMapEditor.directionalLight.position.set(0.6, 0.6, 1).normalize();
	HexMapEditor.scene.add(HexMapEditor.directionalLight);

	document.body.appendChild(HexMapEditor.renderer.domElement);

	HexMapEditor.stats = new Stats();
	HexMapEditor.stats.domElement.style.position = 'absolute';
	HexMapEditor.stats.domElement.style.bottom = '10px';
	HexMapEditor.stats.domElement.style.left = '10px';
	document.body.appendChild(HexMapEditor.stats.domElement);

	HexMapEditor.anaglyph = false;
	HexMapEditor.effect = new THREE.AnaglyphEffect(HexMapEditor.renderer);
	HexMapEditor.effect.setSize(width, height);

	HexMapEditor.projector = new THREE.Projector();

	$('#startButton').click(HexMapEditor.start);
	$('#settingsToggleDiv').click(HexMapEditor.showSettings);
	$('#settingsButton1').click(HexMapEditor.showInstructions);
	$('#settingsButton1').append('Controls');
	$('#settingsButton2').click(HexMapEditor.showClone);
	$('#settingsButton2').append('Clone tool');
	$('#settingsButton3').click(HexMapEditor.showMaterialsList);
	$('#settingsButton3').append('Materials');
	$('#settingsButton4').click(HexMapEditor.showImportExport);
	$('#settingsButton4').append('Import/Export');
	$('#settingsButton5').click(HexMapEditor.showMapSamples);
	$('#settingsButton5').append('Sample Maps');
	$('#settingsButton6').click(HexMapEditor.anaglyphToggle);
	HexMapEditor.isAnaglyphToggled = true;
	$('#settingsButton6').click();
	$('#settingsButton7').append('CLOSE');
	$('#settingsButton7').click(HexMapEditor.hideSettings);
	$('#importButton').click(HexMapEditor.importMap);
	$('#exportButton').click(HexMapEditor.exportMap);
	$('#closeImportExportButton').click(HexMapEditor.hideImportExport);
	document.addEventListener('mousemove', HexMapEditor.onMouseMove, false);
	document.addEventListener('keydown', HexMapEditor.onKeyDown, false);
	document.addEventListener('keyup', HexMapEditor.onKeyUp, false);
	document.addEventListener('mousewheel', HexMapEditor.onMouseWheel, false);
	$(HexMapEditor.renderer.domElement).dblclick(HexMapEditor.onMouseDoubleClick);
	$(HexMapEditor.renderer.domElement).click(HexMapEditor.onMouseClick);
	$(HexMapEditor.renderer.domElement).mousedown(HexMapEditor.onMouseDown);
	$(HexMapEditor.renderer.domElement).mouseup(HexMapEditor.onMouseUp);
	window.addEventListener('resize', HexMapEditor.onWindowResize, false);

	HexMapEditor.initMaterials();
	HexMapEditor.initEditTileDiv();
	HexMapEditor.initClone();
	$('#menu').toggle();
};

HexMapEditor.addMaterial = function(name, materialIndex, materialType, color, emissive, wireframe){
	var parameters = {};
	var numToRemove = 0;
	if(materialIndex == null){
		materialIndex = HexMapEditor.materials.length;
	}else{
		numToRemove = 1;
	}

	if(color !== undefined && color != null) parameters.color = color;
	if(emissive !== undefined && emissive != null) parameters.emissive = emissive;
	if(wireframe !== undefined && wireframe != null) parameters.wireframe = wireframe;
	switch(materialType){
		case 0:	HexMapEditor.materials.splice(materialIndex, numToRemove, {name: name,
						type: materialType,
						color: color,
						material: new THREE.MeshBasicMaterial(parameters)});
			break;
		case 1:	HexMapEditor.materials.splice(materialIndex, numToRemove, {name: name,
						type: materialType,
						color: color,
						material: new THREE.MeshLambertMaterial(parameters)});
			break;
		case 2:	HexMapEditor.materials.splice(materialIndex, numToRemove, {name: name,
						type: materialType,
						color: color,
						material: new THREE.MeshPhongMaterial(parameters)});
			break;
		case 3: HexMapEditor.materials.splice(materialIndex, numToRemove, {name: name,
						type: materialType,
						color: color,
						material: new THREE.MeshNormalMaterial(parameters)});
			break;
	}
}

HexMapEditor.initMaterials = function(){
	HexMapEditor.materialTypes = [];
	HexMapEditor.materialTypes[0] = "Mesh Basic Material";
	HexMapEditor.materialTypes[1] = "Mesh Lambert Material";
	HexMapEditor.materialTypes[2] = "Mesh Phong Material";
	HexMapEditor.materialTypes[3] = "Mesh Normal Material";

	HexMapEditor.materials = [];
	HexMapEditor.addMaterial("Grass", null, 1, 0x5ae42f, 0x091b04);
	HexMapEditor.addMaterial("Dirt", null, 1, 0xa25d2a, 0x000000);
	HexMapEditor.addMaterial("Water", null, 1, 0x4466FF, 0x000000);
	HexMapEditor.addMaterial("Cement", null, 1, 0x666666, 0x000000);
}

HexMapEditor.start = function() {
	$('#menu').toggle();
	$('#tipDiv, #settingsToggleDiv').toggle();

	HexMapEditor.Map = new hexMap(HexMapEditor.scene, 50, HexMapEditor.materials);
	HexMapEditor.Map.loadBlankMap();
	HexMapEditor.Map.showMap();
	HexMapEditor.moveCamera();
	HexMapEditor.animate();
};


HexMapEditor.animate = function(){
	HexMapEditor.time = Date.now();
	HexMapEditor.timeDelta = HexMapEditor.lastTime - HexMapEditor.time;
	HexMapEditor.lastTime = HexMapEditor.time;

	HexMapEditor.Map.centerHexMarkerMesh.rotation.y += HexMapEditor.timeDelta/2000 * Math.PI;
	HexMapEditor.Map.changeHeightHandleMesh.rotation.y -= HexMapEditor.timeDelta/2000 * Math.PI;
	
	if(HexMapEditor.isHeightDragging){
		
		if(Math.round((HexMapEditor.heightChangeMultiplier + HexMapEditor.cameraDistance/5) * (HexMapEditor.mouse2D.y - HexMapEditor.dragStart.y)) != 0){
			HexMapEditor.dontClickMe = true;
			HexMapEditor.changeTileHeight(HexMapEditor.tileBeingEdited, (HexMapEditor.heightChangeMultiplier + HexMapEditor.cameraDistance/5) * (HexMapEditor.mouse2D.y - HexMapEditor.dragStart.y));
			HexMapEditor.dragStart.y = HexMapEditor.mouse2D.y;
		}
	}else if(HexMapEditor.isCameraRotating){
		if(Math.round(HexMapEditor.rotationMultiplier * (HexMapEditor.mouse2D.x - HexMapEditor.dragStart.x)) != 0 || Math.round(HexMapEditor.tiltMultiplier * (HexMapEditor.mouse2D.y - HexMapEditor.dragStart.y)) != 0){
			HexMapEditor.tilt -= HexMapEditor.tiltMultiplier * (HexMapEditor.mouse2D.y - HexMapEditor.dragStart.y);
			HexMapEditor.theta += HexMapEditor.rotationMultiplier * (HexMapEditor.mouse2D.x - HexMapEditor.dragStart.x);
			HexMapEditor.moveCamera();
			HexMapEditor.dragStart.x = HexMapEditor.mouse2D.x;
			HexMapEditor.dragStart.y = HexMapEditor.mouse2D.y;
		}
	}else if(HexMapEditor.isCameraMoving){
		var xD = HexMapEditor.cameraMovementMultiplier * HexMapEditor.cameraDistance * (HexMapEditor.mouse2D.x - HexMapEditor.dragStart.x);
		var yD = HexMapEditor.cameraMovementMultiplier * HexMapEditor.cameraDistance * (HexMapEditor.mouse2D.y - HexMapEditor.dragStart.y);
		if((Math.abs(xD) > HexMapEditor.dragDelay || Math.abs(yD) > HexMapEditor.dragDelay) || (HexMapEditor.dontClickMe && (Math.round(xD) != 0 || Math.round(yD) != 0))){
			HexMapEditor.dontClickMe = true;
			var angle = HexMapEditor.theta * Math.PI/180 + Math.PI;
			HexMapEditor.cameraAimPoint.x += xD * Math.cos(angle) - yD * Math.sin(angle);
			HexMapEditor.cameraAimPoint.y += xD * Math.sin(angle) + yD * Math.cos(angle);
			if(HexMapEditor.cameraAimPoint.x < HexMapEditor.Map.bounds.lower.x){
				HexMapEditor.cameraAimPoint.x = HexMapEditor.Map.bounds.lower.x;
			}else if(HexMapEditor.cameraAimPoint.x > HexMapEditor.Map.bounds.upper.x){
				HexMapEditor.cameraAimPoint.x = HexMapEditor.Map.bounds.upper.x;
			}
			if(HexMapEditor.cameraAimPoint.y < HexMapEditor.Map.bounds.lower.y){
				HexMapEditor.cameraAimPoint.y = HexMapEditor.Map.bounds.lower.y;
			}else if(HexMapEditor.cameraAimPoint.y > HexMapEditor.Map.bounds.upper.y){
				HexMapEditor.cameraAimPoint.y = HexMapEditor.Map.bounds.upper.y;
			}
			HexMapEditor.moveCamera();
			HexMapEditor.dragStart.x = HexMapEditor.mouse2D.x;
			HexMapEditor.dragStart.y = HexMapEditor.mouse2D.y;
		}
	}

	if(HexMapEditor.isAnaglyphToggled){
		HexMapEditor.effect.render(HexMapEditor.scene, HexMapEditor.camera);
	}else{
		HexMapEditor.renderer.render(HexMapEditor.scene, HexMapEditor.camera);
	}
	HexMapEditor.stats.update();

	if(HexMapEditor.Map.objectsToLoad.length > 0) HexMapEditor.Map.continueLoading(100);

	window.requestAnimationFrame(HexMapEditor.animate);
}

HexMapEditor.showSettings = function(event){
	$('#settingsToggleDiv').toggle();
	$('#settingsDiv').toggle();
}

HexMapEditor.hideSettings = function(event){
	HexMapEditor.showSettings(event);
}

HexMapEditor.anaglyphToggle = function(event){
	if(HexMapEditor.isAnaglyphToggled){
		$('#' + event.target.id).empty().append('Anaglyph 3D: OFF');
		HexMapEditor.isAnaglyphToggled = false;
	}else{
		$('#' + event.target.id).empty().append('Anaglyph 3D: ON');
		HexMapEditor.isAnaglyphToggled = true;
	}
}

HexMapEditor.onMouseMove = function(event){
	event.preventDefault();
	HexMapEditor.mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
	HexMapEditor.mouse2D.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

HexMapEditor.getIntersects = function(){
	var vector = new THREE.Vector3(HexMapEditor.mouse2D.x, HexMapEditor.mouse2D.y, 0.5);
	HexMapEditor.projector.unprojectVector(vector, HexMapEditor.camera);
	var raycaster = new THREE.Raycaster(HexMapEditor.camera.position, vector.sub(HexMapEditor.camera.position).normalize());
	return raycaster.intersectObjects(HexMapEditor.scene.children, true);
}

HexMapEditor.onMouseDoubleClick = function(event){
	var intersects = HexMapEditor.getIntersects();
	for(var i in intersects){
		if(intersects[i].object === HexMapEditor.tileBeingEdited.mesh){
			HexMapEditor.Map.setCenterHex(HexMapEditor.tileBeingEdited);
			HexMapEditor.Map.showEditMarkup(HexMapEditor.tileBeingEdited);
			HexMapEditor.updateCamera();
			return;
		}
	}
}

HexMapEditor.onMouseClick = function(event){
	if(HexMapEditor.dontClickMe){
		HexMapEditor.dontClickMe = false;
		return;
	}
	for(var i in HexMapEditor.clickIntersects){
		var tile = hexTile.prototype.getTileByMesh(HexMapEditor.clickIntersects[i].object);
		if(tile != null){
			HexMapEditor.showEditTile(tile); break;
		}else{
			//The addTiles are groups, so the intersected object's parent (the group) is in the addTiles array
			var addTileSide = $.inArray(HexMapEditor.clickIntersects[i].object.parent, HexMapEditor.Map.addTiles);
			if(addTileSide >= 0){
				HexMapEditor.addTile(HexMapEditor.tileBeingEdited, addTileSide);
				//stop once a tile has been added, don't add a second new tiles if a second addTile was intersected
				break;
			}
		}
	}
}

HexMapEditor.onMouseDown = function(event){
	if(event.which == 1){
		var intersects = HexMapEditor.getIntersects();
		for(var i in intersects){
			if(intersects[i].object === HexMapEditor.Map.changeHeightHandleMesh){
				HexMapEditor.isHeightDragging = true;
			}
		}
		if(HexMapEditor.isHeightDragging == false){
			HexMapEditor.clickIntersects = intersects;
			HexMapEditor.isCameraMoving = true;
		}
	}else if(event.which == 2){
		HexMapEditor.isCameraRotating = true;
		HexMapEditor.dontClickMe = true;
	}
	HexMapEditor.dragStart.x = HexMapEditor.mouse2D.x;
	HexMapEditor.dragStart.y = HexMapEditor.mouse2D.y;
}

HexMapEditor.onMouseUp = function(event){
	event.preventDefault();
	HexMapEditor.isCameraMoving = false;
	HexMapEditor.isCameraRotating = false;
	HexMapEditor.isHeightDragging = false;
}

HexMapEditor.onMouseWheel = function(event){
	HexMapEditor.cameraDistance = Math.min(5000, Math.max(50, HexMapEditor.cameraDistance + event.wheelDelta/10));
	HexMapEditor.updateCamera();
}

HexMapEditor.moveCamera = function(){
	HexMapEditor.tilt = Math.min(75, Math.max(5, HexMapEditor.tilt));
	if(HexMapEditor.theta < 0){
		HexMapEditor.theta += 360;
	}else if(HexMapEditor.theta > 360){
		HexMapEditor.theta -= 360;
	}
	HexMapEditor.updateCamera();
}

HexMapEditor.updateCamera = function(){
	var scootForEdit = 0.5;
	var degToRad = Math.PI/180;
	var camZ = Math.cos(HexMapEditor.tilt * degToRad) * HexMapEditor.cameraDistance;
	var xyMultiplier = Math.sin(HexMapEditor.tilt * degToRad) * HexMapEditor.cameraDistance;
	var camX = Math.sin(HexMapEditor.theta * degToRad) * xyMultiplier;
	var camY = -1 * Math.cos(HexMapEditor.theta * degToRad) * xyMultiplier;
	
	camX += HexMapEditor.cameraAimPoint.x;
	camY += HexMapEditor.cameraAimPoint.y;

	HexMapEditor.camera.position.set(camX, camY, camZ);
	HexMapEditor.camera.lookAt(new THREE.Vector3(HexMapEditor.cameraAimPoint.x,
						HexMapEditor.cameraAimPoint.y,
						0));
}

HexMapEditor.onKeyDown = function(event){
	switch(event.keyCode){
		case 16: HexMapEditor.isShiftDown = true; break;
	}
}

HexMapEditor.onKeyUp = function(event){
	switch(event.keyCode){
		case 16: HexMapEditor.isShiftDown = false; break;
		case 68: if(HexMapEditor.tileBeingEdited != null) HexMapEditor.Map.removeTile(HexMapEditor.tileBeingEdited, false, false); break;
		case 67: if(HexMapEditor.tileBeingCloned != null && HexMapEditor.tileBeingEdited != null && $('#cloneDiv').is(':visible')) HexMapEditor.cloneTile(); break;
	}
}

HexMapEditor.onWindowResize = function(event){
	HexMapEditor.camera.aspect = (window.innerWidth / window.innerHeight);
	HexMapEditor.camera.updateProjectionMatrix();
	HexMapEditor.renderer.setSize(window.innerWidth, window.innerHeight);
}

HexMapEditor.addNewMaterial = function(event){
	HexMapEditor.addMaterial("New Material", null, 1);
	HexMapEditor.showMaterialsList();
}

HexMapEditor.changeMaterialType = function(materialIndex, newTypeIndex){
	switch(HexMapEditor.materials[materialIndex].type){
		case 0:	HexMapEditor.addMaterial(HexMapEditor.materials[materialIndex].name, materialIndex, newTypeIndex, parseInt(HexMapEditor.materials[materialIndex].material.color.getHex()), null, HexMapEditor.materials[materialIndex].material.wireframe);
			break;
		case 1:	HexMapEditor.addMaterial(HexMapEditor.materials[materialIndex].name, materialIndex, newTypeIndex, parseInt(HexMapEditor.materials[materialIndex].material.color.getHex()), parseInt(HexMapEditor.materials[materialIndex].material.emissive.getHex()), HexMapEditor.materials[materialIndex].material.wireframe);
			break;
		case 2:	HexMapEditor.addMaterial(HexMapEditor.materials[materialIndex].name, materialIndex, newTypeIndex, parseInt(HexMapEditor.materials[materialIndex].material.color.getHex()), parseInt(HexMapEditor.materials[materialIndex].material.emissive.getHex()), HexMapEditor.materials[materialIndex].material.wireframe);
			break;
		case 3:	HexMapEditor.addMaterial(HexMapEditor.materials[materialIndex].name, materialIndex, newTypeIndex, null, null, HexMapEditor.materials[materialIndex].material.wireframe);
			break;
	}
	HexMapEditor.Map.hideMap();
	HexMapEditor.Map.showMap();
	HexMapEditor.showMaterialsList();
	if(HexMapEditor.tileBeingEdited != null) HexMapEditor.Map.updateEditMarkup(HexMapEditor.tileBeingEdited);
	HexMapEditor.moveCamera();
}

HexMapEditor.showMaterialsList = function(event){
	var html = "";
	$('#settingsDiv').toggle(false);
	$('#materialsListDiv .contentDiv').empty();
	html += "<h2>Materials</h2><table>";
	html += "<tr><td>name</td><td>type</td><td>color</td><td>emis.</td><td>wire</td></tr>";
	for(var i in HexMapEditor.materials){
		html += "<tr id='materialListSpan_" + i + "'>";
		html += "<td><input type='text' onChange='HexMapEditor.materials[" + i + "].name = this.value;' value='" + HexMapEditor.materials[i].name + "'></td>";
		html += "<td><select onChange='HexMapEditor.changeMaterialType( " + i + ", parseInt(this.value));'>";
		html += HexMapEditor.listMaterialTypeOptions(HexMapEditor.materials[i].type);
		html += "</select></td>";
		if(HexMapEditor.materials[i].type != "3"){
			html += "<td><input type='color' name='color' onChange='HexMapEditor.materials[" + i + "].material.color.setHex(parseInt(this.value.substr(1), 16));' value='#" + HexMapEditor.materials[i].material.color.getHexString() + "'/></td>";
		}else{
			html += "<td></td>";
		}
		if(HexMapEditor.materials[i].type == "1" || HexMapEditor.materials[i].type == "2"){
			html += "<td><input type='color' name='emissive' onChange='HexMapEditor.materials[" + i + "].material.emissive.setHex(parseInt(this.value.substr(1), 16));' value='#" + HexMapEditor.materials[i].material.emissive.getHexString() + "'/></td>";
		}else{
			html += "<td></td>";
		}
		html += "<td><input type='checkbox' onclick='HexMapEditor.materials[" + i + "].material.wireframe = !(HexMapEditor.materials[" + i + "].material.wireframe);' ";
		if(HexMapEditor.materials[i].material.wireframe) html += " checked";
		html += "></td>";
		html += "</tr>";
	}
	html += "</table><br>";
	html += "<button id='addMaterialButton' class='button'>New Material</button>";
	html += "<button id='closeMaterialsListDivButton' class='button closeButton'>CLOSE</button>";
	$('#materialsListDiv .contentDiv').append(html);
	$('#addMaterialButton').click(HexMapEditor.addNewMaterial);
	$('#closeMaterialsListDivButton').click(HexMapEditor.hideMaterialsList);
	$('#materialsListDiv').toggle(true);
}

HexMapEditor.hideMaterialsList = function(event){
	$('#materialsListDiv').toggle(false);
	$('#settingsDiv').toggle(true);
}

HexMapEditor.listMaterialTypeOptions = function(selectedMaterialTypeIndex){
	var optionsText = "";
	for(var i in HexMapEditor.materialTypes){
		optionsText += "<option value='" + i + "'";
		if(i == selectedMaterialTypeIndex) optionsText += " selected";
		optionsText += ">" + HexMapEditor.materialTypes[i] + "</option>";
	}
	return optionsText;
}

HexMapEditor.listMaterialOptions = function(selectedMaterialIndex){
	var optionsText = "";
	for(var i in HexMapEditor.materials){
		optionsText += "<option value='" + i + "'";
		if(i == selectedMaterialIndex) optionsText += " selected";
		optionsText += ">" + HexMapEditor.materials[i].name + "</option>";
	}
	return optionsText;
}

HexMapEditor.showInstructions = function(event){
	$('#instructionsDiv').toggle(true);
	$('#settingsDiv').toggle(false);
}

HexMapEditor.listGameEntityOptions = function(selectedEntityIndex){
	var optionsText = "<option value=''>None</option>";
	for(var i = 0; i < 100; i++){
		optionsText += "<option value='" + i + "'";
		if(i == selectedEntityIndex) optionsText += " selected";
		optionsText += ">" + i + "</option>";
	}
	return optionsText;
}

HexMapEditor.initEditTileDiv = function(){
	var html = "<div id='editTileDivHeading'/>";

	html += "<select id='tileMaterialSelect' onChange='HexMapEditor.changeTileMaterial(this.value);'></select><br>";
	html += "<select id='tileGameEntitySelect' onChange='HexMapEditor.changeTileGameEntity(this.value);'></select>";

	html += "<br><fieldset id='splitHexFieldset'><legend>Split terrain</legend>";
	html += "<button id='rotateSplitHexButton' class='button'>Rotate</button><br>";
	html += "<button id='changeSizeSplitHexButton' class='button'>Size</button><br>";
	html += "<select id='splitHexMaterialSelect' onChange='HexMapEditor.changeSplitHexMaterial(this.value);'></select><br>";
	html += "<button id='removeSplitHexButton' class='button'>Remove</button>";
	html += "</fieldset>";
	html += "<button id='addSplitHexButton' class='button'>Split terrain</button>";

	html += "<br><fieldset id='wallFieldset'><legend>Wall</legend>";
	html += "<select id='wallMaterialSelect' onChange='HexMapEditor.changeWallMaterial(this.value);'></select><br>";
	html += "Height: <input type='text' id='wallHeight' size='2'><br>";
	html += "<button id='wallRelativeHeightButton' class='button'></button><br>";
	html += "<button id='rotateWallButton' class='button'>Rotate wall</button><br>";
	html += "<button id='taperWallButton' class='button'></button><br>";
	html += "<button id='removeWallButton' class='button'>Remove wall</button>";
	html += "</fieldset>";
	html += "<button id='addWallButton' class='button'>Add wall</button>";

	html += "<br><fieldset id='pillarFieldset'><legend>Pillar</legend>";
	html += "<select id='pillarMaterialSelect' onChange='HexMapEditor.changePillarMaterial(this.value);'></select><br>";
	html += "Height: <input type='text' id='pillarHeight' size='2'><br>";
	html += "<button id='pillarRelativeHeightButton' class='button'></button><br>";
	html += "<button id='rotatePillarButton' class='button'>Rotate pillar</button><br>";
	html += "<button id='taperPillarButton' class='button'></button><br>";
	html += "<button id='changeSizePillarButton' class='button'>Size</button><br>";
	html += "<button id='removePillarButton' class='button'>Remove pillar</button>";
	html += "</fieldset>";
	html += "<button id='addPillarButton' class='button'>Add pillar</button><br>";

	html += "<button id='deleteTileButton' class='button' onClick='HexMapEditor.Map.removeTile(HexMapEditor.tileBeingEdited, false, false);'>[D]ELETE</button><BR>";
	html += "<button id='closeEditButton' class='button'>CLOSE</button>";

	$('#editTileDiv .contentDiv').empty().append(html);

	$('#addSplitHexButton, #removeSplitHexButton').click(HexMapEditor.toggleSplitHex);
	$('#rotateSplitHexButton').click(HexMapEditor.rotateSplitHex);
	$('#changeSizeSplitHexButton').click(HexMapEditor.changeSizeSplitHex);

	$('#addWallButton, #removeWallButton').click(HexMapEditor.toggleTileWall);
	$('#rotateWallButton').click(HexMapEditor.rotateTileWall);
	$('#taperWallButton').click(HexMapEditor.taperTileWall);
	$('#wallRelativeHeightButton').click(HexMapEditor.toggleTileWallRelativeHeight);
	$('#wallHeight').change(HexMapEditor.setTileWallHeight);

	$('#addPillarButton, #removePillarButton').click(HexMapEditor.togglePillar);
	$('#rotatePillarButton').click(HexMapEditor.rotatePillar);
	$('#taperPillarButton').click(HexMapEditor.taperPillar);
	$('#changeSizePillarButton').click(HexMapEditor.changeSizePillar);
	$('#pillarRelativeHeightButton').click(HexMapEditor.togglePillarRelativeHeight);
	$('#pillarHeight').change(HexMapEditor.setPillarHeight);

	$('#closeEditButton').click(HexMapEditor.hideEditTile);
}

HexMapEditor.showEditTile = function(tile){
	HexMapEditor.tileBeingEdited = tile;
	HexMapEditor.updateEditTileDivHeading();

	if(tile.wall){
		HexMapEditor.toggleTileWall(null, true);
	}else{
		HexMapEditor.toggleTileWall(null, false);
	}

	if(tile.pillar){
		HexMapEditor.togglePillar(null, true);
	}else{
		HexMapEditor.togglePillar(null, false);
	}

	if(tile.splitHex){
		HexMapEditor.toggleSplitHex(null, true);
	}else{
		HexMapEditor.toggleSplitHex(null, false);
	}
	
	$('#tileGameEntitySelect').empty().append(HexMapEditor.listGameEntityOptions(tile.gameEntity));
	$('#tileMaterialSelect').empty().append(HexMapEditor.listMaterialOptions(tile.materialIndex));
	$('#splitHexMaterialSelect').empty().append(HexMapEditor.listMaterialOptions(tile.splitHexMaterialIndex));
	$('#wallMaterialSelect').empty().append(HexMapEditor.listMaterialOptions(tile.wallMaterialIndex));
	$('#pillarMaterialSelect').empty().append(HexMapEditor.listMaterialOptions(tile.pillarMaterialIndex));

	$('#editTileDiv').toggle(true);
	HexMapEditor.Map.showAddTiles(tile);
	HexMapEditor.Map.showEditMarkup(tile);
}

HexMapEditor.updateEditTileDivHeading = function(){
	$('#editTileDivHeading').empty().append("<h2>Tile " + HexMapEditor.tileBeingEdited.id + "</h2>Height: " + Math.round(100 * HexMapEditor.tileBeingEdited.height)/100);
}

HexMapEditor.hideEditTile = function(event){
	HexMapEditor.Map.hideEditMarkup();
	HexMapEditor.Map.hideAddTiles();
	$('#editTileDiv').toggle(false);
	HexMapEditor.tileBeingEdited = null;
}

HexMapEditor.changeTileGameEntity = function(gameEntityIndex){
	if(gameEntityIndex === undefined || gameEntityIndex == null || gameEntityIndex == ""){
		HexMapEditor.tileBeingEdited.gameEntity = null;
	}else{
		HexMapEditor.tileBeingEdited.gameEntity = parseInt(gameEntityIndex);
	}
	HexMapEditor.scene.remove(HexMapEditor.tileBeingEdited.gameEntityMesh);
	HexMapEditor.tileBeingEdited.gameEntityMesh = null;
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changeTileMaterial = function(materialIndex){
	HexMapEditor.tileBeingEdited.setMaterial(materialIndex);
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changeWallMaterial = function(materialIndex){
	HexMapEditor.tileBeingEdited.setWallMaterial(materialIndex);
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.toggleTileWall = function(event, onOffSwitch){
	if(onOffSwitch === undefined){
		onOffSwitch = HexMapEditor.tileBeingEdited.toggleWall();
		HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	}
	if(onOffSwitch){
		$('#addWallButton, #addPillarButton').toggle(false);
		$('#wallFieldset').toggle(true);
		$('#wallHeight').val(HexMapEditor.tileBeingEdited.wallHeight);
		HexMapEditor.setWallRelativeHeightButtonText();
		HexMapEditor.setWallTaperButtonText();
	}else{
		$('#addWallButton, #addPillarButton').toggle(true);
		$('#wallFieldset').toggle(false);
	}
}

HexMapEditor.rotateTileWall = function(){
	HexMapEditor.tileBeingEdited.rotateWall();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.setWallRelativeHeightButtonText = function(){
	if(HexMapEditor.tileBeingEdited.wallRelativeHeight){
		$('#wallRelativeHeightButton').empty().append("Relative Height");
	}else{
		$('#wallRelativeHeightButton').empty().append("Absolute Height");
	}
}

HexMapEditor.setWallTaperButtonText = function(){
	$('#taperWallButton').empty().append("Taper: " + Math.round(HexMapEditor.tileBeingEdited.wallTaper * 100) + "%");
}

HexMapEditor.taperTileWall = function(){
	HexMapEditor.tileBeingEdited.changeWallTaper();
	HexMapEditor.setWallTaperButtonText();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.toggleTileWallRelativeHeight = function(){
	HexMapEditor.tileBeingEdited.toggleWallRelativeHeight();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	HexMapEditor.setWallRelativeHeightButtonText();
}

HexMapEditor.setTileWallHeight = function(height){
	HexMapEditor.tileBeingEdited.setWallHeight(Number($('#wallHeight').val()));
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changePillarMaterial = function(materialIndex){
	HexMapEditor.tileBeingEdited.setPillarMaterial(materialIndex);
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.togglePillar = function(event, onOffSwitch){
	if(onOffSwitch === undefined){
		onOffSwitch = HexMapEditor.tileBeingEdited.togglePillar();
		HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	}
	if(onOffSwitch){
		$('#addPillarButton, #addWallButton').toggle(false);
		$('#pillarFieldset').toggle(true);
		$('#pillarHeight').val(HexMapEditor.tileBeingEdited.pillarHeight);
		HexMapEditor.setPillarRelativeHeightButtonText();
		HexMapEditor.setPillarTaperButtonText();
	}else{
		$('#addPillarButton, #addWallButton').toggle(true);
		$('#pillarFieldset').toggle(false);
	}
}


HexMapEditor.rotatePillar = function(){
	HexMapEditor.tileBeingEdited.rotatePillar();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.setPillarRelativeHeightButtonText = function(){
	if(HexMapEditor.tileBeingEdited.pillarRelativeHeight){
		$('#pillarRelativeHeightButton').empty().append("Relative Height");
	}else{
		$('#pillarRelativeHeightButton').empty().append("Absolute Height");
	}
}

HexMapEditor.setPillarTaperButtonText = function(){
	$('#taperPillarButton').empty().append("Taper: " + Math.round(HexMapEditor.tileBeingEdited.pillarTaper * 100) + "%");
}

HexMapEditor.taperPillar = function(){
	HexMapEditor.tileBeingEdited.changePillarTaper();
	HexMapEditor.setPillarTaperButtonText();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.togglePillarRelativeHeight = function(){
	HexMapEditor.tileBeingEdited.togglePillarRelativeHeight();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	HexMapEditor.setPillarRelativeHeightButtonText();
}

HexMapEditor.setPillarHeight = function(height){
	HexMapEditor.tileBeingEdited.setPillarHeight(Number($('#pillarHeight').val()));
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changeSizePillar = function(){
	HexMapEditor.tileBeingEdited.changeSizePillar();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.toggleSplitHex = function(event, onOffSwitch){
	if(onOffSwitch === undefined){
		onOffSwitch = HexMapEditor.tileBeingEdited.toggleSplitHex();
		HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	}
	if(onOffSwitch){
		$('#addSplitHexButton').toggle(false);
		$('#splitHexFieldset').toggle(true);
	}else{
		$('#addSplitHexButton').toggle(true);
		$('#splitHexFieldset').toggle(false);
	}
}

HexMapEditor.rotateSplitHex = function(){
	HexMapEditor.tileBeingEdited.rotateSplitHex();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changeSizeSplitHex = function(){
	HexMapEditor.tileBeingEdited.changeSizeSplitHex();
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.changeSplitHexMaterial = function(materialIndex){
	HexMapEditor.tileBeingEdited.setSplitHexMaterial(materialIndex);
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.addTile = function(tile, side){
	tile.neighbors[side] = new hexTile(tile.height, tile.materialIndex, tile, (side + 3)%6);
	tile.neighbors[side].calculateCornerHeights(1);
	var x = tile.mesh.position.x + HexMapEditor.Map.tileOffset[side].x;
	var y = tile.mesh.position.y + HexMapEditor.Map.tileOffset[side].y;
	var z = tile.mesh.position.z;
	HexMapEditor.Map.hideTile(tile.neighbors[side], true, false);
	HexMapEditor.Map.showTile(tile.neighbors[side], x, y, z);
	$('#addTileButton' + side).remove();
	HexMapEditor.scene.remove(HexMapEditor.Map.addTiles[side]);
	HexMapEditor.showEditTile(tile.neighbors[side]);
}

HexMapEditor.hideAndShowTile = function(tile){
	var x = tile.mesh.position.x;
	var y = tile.mesh.position.y;
	var z = tile.mesh.position.z;
	HexMapEditor.Map.hideTile(tile, true, false);
	HexMapEditor.Map.showTile(tile, x, y, z);
	if(tile === HexMapEditor.tileBeingEdited) HexMapEditor.Map.updateEditMarkup(tile);
}


HexMapEditor.changeTileHeight = function(tile, heightChange){
	if(Math.round(heightChange) == 0) return;
	tile.height += heightChange;
	tile.clearCornerHeights(1);
	tile.calculateHeights(false);
	HexMapEditor.hideAndShowTile(tile);
	HexMapEditor.Map.updateEditMarkup(tile);
	HexMapEditor.updateEditTileDivHeading();
}

HexMapEditor.showImportExport = function(){
	$('#importExportDiv').toggle(true);
	$('#settingsDiv').toggle(false);
}

HexMapEditor.hideImportExport = function(event){
	$('#importExportDiv').toggle(false);
	$('#settingsDiv').toggle(true);
}

HexMapEditor.importMap = function(event, sampleMapIndex){
	$('#loadingDiv').toggle(true);
	if(sampleMapIndex !== undefined && HexMapEditor.mapSamples[sampleMapIndex] != null){
		$.getJSON("sample_maps/" + HexMapEditor.mapSamples[sampleMapIndex].filename, function(data){ HexMapEditor.processImportedMapObject(data);});
	}else{
		HexMapEditor.processImportedMapObject(JSON.parse($('#importExportTextarea').val()));
	}
}

HexMapEditor.processImportedMapObject = function(mapObject){
	if(mapObject.materials !== undefined && mapObject.materials.length > 0){
		for(var i in mapObject.materials){
			HexMapEditor.addMaterial(mapObject.materials[i].name,
						mapObject.materials[i].index,
						mapObject.materials[i].type,
						mapObject.materials[i].color, 
						mapObject.materials[i].emissive,
						mapObject.materials[i].wireframe);
		}
	}

	HexMapEditor.tileBeingCloned = null;
	HexMapEditor.hideEditTile();
	HexMapEditor.Map.importFromObject(mapObject.tiles);
	$('#closeImportExportButton').click();
}

HexMapEditor.exportMap = function(event){
	$('#importExportTextarea').val(HexMapEditor.Map.exportToJSON());
}

HexMapEditor.showMapSamples = function(event){
	var html = "<h2>Sample Maps</h2>Loading a sample will<br>erase the current map.";
	for(var i in HexMapEditor.mapSamples){
		html += "<br><button class='button' onClick='HexMapEditor.importMap(null, " + i + "); HexMapEditor.hideMapSamples();'>Load: " + HexMapEditor.mapSamples[i].name + "</button>";
	}
	html += "<br><button class='button' onClick='HexMapEditor.hideMapSamples();'>CLOSE</button>";
	$('#mapSamplesDiv .contentDiv').empty().append(html);
	$('#mapSamplesDiv').toggle(true);
	$('#settingsDiv').toggle(false);
}

HexMapEditor.hideMapSamples = function(){
	$('#mapSamplesDiv').toggle(false);
	$('#settingsDiv').toggle(true);
}

HexMapEditor.initClone = function(){
	var html = "<h2>Clone tool</h2>";
	html += "<span id='cloneHeading'></span><br>";
	html += "<div style='padding-left: 15px; text-align: left;'>";
	html += "<input type='checkbox' id='cloneHeight'>Height<br>";
	html += "<input type='checkbox' id='cloneMaterial'>Material<br>";
	html += "<input type='checkbox' id='cloneGameEntity'>Game Entity<br>";
	html += "<input type='checkbox' id='cloneSplitHex'>Split terrain<br>";
	html += "<input type='checkbox' id='cloneWall'>Wall<br>";
	html += "<input type='checkbox' id='clonePillar'>Pillar<br>";
	html += "</div>";
	html += "<button class='button' onclick='HexMapEditor.cloneTile();'>[C]lone values</button><br>";
	html += "<button class='button' onclick='HexMapEditor.hideClone();'>CLOSE</button>";
	$('#cloneDiv .contentDiv').empty().append(html);
}

HexMapEditor.cloneTile = function(){
	if(HexMapEditor.tileBeingEdited == null ||
		HexMapEditor.tileBeingCloned == null ||
		HexMapEditor.tileBeingEdited === HexMapEditor.tileBeingCloned) return;
	if($('#cloneHeight').is(':checked')){
		HexMapEditor.changeTileHeight(HexMapEditor.tileBeingEdited, HexMapEditor.tileBeingCloned.height - HexMapEditor.tileBeingEdited.height);
		HexMapEditor.tileBeingEdited.height = HexMapEditor.tileBeingCloned.height;
		HexMapEditor.tileBeingEdited.clearCornerHeights(1);
		HexMapEditor.tileBeingEdited.calculateCornerHeights(1);
	}
	if($('#cloneMaterial').is(':checked')) HexMapEditor.tileBeingEdited.materialIndex = HexMapEditor.tileBeingCloned.materialIndex;
	if($('#cloneGameEntity').is(':checked')){
		HexMapEditor.scene.remove(HexMapEditor.tileBeingEdited.gameEntityMesh);
		HexMapEditor.tileBeingEdited.gameEntity = HexMapEditor.tileBeingCloned.gameEntity;
	}
	if($('#cloneSplitHex').is(':checked')){
		HexMapEditor.tileBeingEdited.splitHex = HexMapEditor.tileBeingCloned.splitHex;
		HexMapEditor.tileBeingEdited.splitHexMaterialIndex = HexMapEditor.tileBeingCloned.splitHexMaterialIndex;
		HexMapEditor.tileBeingEdited.splitHexSide = HexMapEditor.tileBeingCloned.splitHexSide;
		HexMapEditor.tileBeingEdited.splitHexSize = HexMapEditor.tileBeingCloned.splitHexSize;
	}
	if($('#cloneWall').is(':checked')){
		HexMapEditor.tileBeingEdited.wall = HexMapEditor.tileBeingCloned.wall;
		HexMapEditor.tileBeingEdited.wallMaterialIndex = HexMapEditor.tileBeingCloned.wallMaterialIndex;
		HexMapEditor.tileBeingEdited.wallSide = HexMapEditor.tileBeingCloned.wallSide;
		HexMapEditor.tileBeingEdited.wallHeight = HexMapEditor.tileBeingCloned.wallHeight;
		HexMapEditor.tileBeingEdited.wallRelativeHeight = HexMapEditor.tileBeingCloned.wallRelativeHeight;
		HexMapEditor.tileBeingEdited.wallTaper = HexMapEditor.tileBeingCloned.wallTaper;
	}
	if($('#clonePillar').is(':checked')){
		HexMapEditor.tileBeingEdited.pillar = HexMapEditor.tileBeingCloned.pillar;
		HexMapEditor.tileBeingEdited.pillarMaterialIndex = HexMapEditor.tileBeingCloned.pillarMaterialIndex;
		HexMapEditor.tileBeingEdited.pillarSide = HexMapEditor.tileBeingCloned.pillarSide;
		HexMapEditor.tileBeingEdited.pillarHeight = HexMapEditor.tileBeingCloned.pillarHeight;
		HexMapEditor.tileBeingEdited.pillarRelativeHeight = HexMapEditor.tileBeingCloned.pillarRelativeHeight;
		HexMapEditor.tileBeingEdited.pillarSize = HexMapEditor.tileBeingCloned.pillarSize;
		HexMapEditor.tileBeingEdited.pillarTaper = HexMapEditor.tileBeingCloned.pillarTaper;
	}
	HexMapEditor.hideAndShowTile(HexMapEditor.tileBeingEdited);
	HexMapEditor.showEditTile(HexMapEditor.tileBeingEdited);
}

HexMapEditor.setCloneHeading = function(){
	var html = "";
	if(HexMapEditor.tileBeingCloned == null){
		html += "No cloned tile.<br>";
	}else{
		html += "<button class='button' onclick='HexMapEditor.showEditTile(HexMapEditor.tileBeingCloned);'>Select cloned tile</button><br>";
	}
	html += "<button class='button' onclick='HexMapEditor.tileBeingCloned = HexMapEditor.tileBeingEdited; HexMapEditor.setCloneHeading();'>Clone selected tile</button>";
	$('#cloneHeading').empty().append(html);
}

HexMapEditor.showClone = function(event){
	HexMapEditor.setCloneHeading();
	$('#cloneDiv').toggle(true);
	$('#settingsDiv').toggle(false);
}

HexMapEditor.hideClone = function(){
	$('#cloneDiv').toggle(false);
	$('#settingsDiv').toggle(true);
}


