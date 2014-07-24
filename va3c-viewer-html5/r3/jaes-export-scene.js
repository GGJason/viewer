	var JAES = {} || JAES;

	JAES.count = 0;

	JAES.addExportSceneTab = function() {
		var tab = JA.menu.appendChild( document.createElement( 'div' ) );
		tab.title = 'Export current view to a data file';
		tab.innerHTML =
			'<a href=# id=tabExportScene ><p class=button >' +
				'<i class="fa fa-paw"></i> Save / Open Scenes...' +
			'</p></a>'; 
		tabExportScene.onclick = function() { JA.toggleTab( JAES.exportScene ); };

		JAES.exportScene = JA.menu.appendChild( document.createElement( 'div' ) );
		JAES.exportScene.style.cssText = 'cursor: auto; display: none; ' ;
		JAES.exportScene.innerHTML =
			'<p>Save what you have made...</p>' +
			'<p><a href=# onclick=saveFile(); >Save scene</a></p>' +
			'<p>Open scene: <input type=file id=inpFile ></p>' +
		'';
		inpFile.onchange = function() { loadFile ( this ); };

	}

	function loadScripts ( ) {
		var p = 'http://mrdoob.github.io/three.js/examples/js/';
		var scripts = [
			'utils/GeometryUtils.js',
			'exporters/BufferGeometryExporter.js',
			'exporters/TypedGeometryExporter.js',
			'exporters/GeometryExporter.js',
			'exporters/MaterialExporter.js',
			'exporters/ObjectExporter.js',
			'exporters/SceneExporter.js'
		];

		for (var i = 0; i < 7; i++) {
			loadScript( p + scripts[i] );
		}
	}

	function loadScript( src ) {
		var scr = document.body.appendChild( document.createElement( 'script' ) );
		scr.src = src;
		scr.onload = function () { 
			if ( JAES.count >= 6 ) { saveFile(); }
			JAES.count++;
		};
	}

	function saveFile() {
		if ( !THREE.ObjectExporter ) { loadScripts(); return; }

		var exporter = new THREE.ObjectExporter();
		var output = exporter.parse( scene );
		output = JSON.stringify( output, null, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );

		var blob = new Blob( [ output ], { type: 'text/plain' } );

		var a = document.createElement( 'a' );
		a.href = window.URL.createObjectURL( blob );
		a.download = 'scene.json';
		a.click();
		delete a;
	}

	var loadFile = function ( file ) {

/*
		var reader = new FileReader();
		reader.addEventListener( 'load', function ( event ) {
	//  fileList, index, basepath, filename, boilerplate
			fileList = [['test.js','']];
			basepath = '../../../json/';
			index = 0;
			filename = file.name;
			boilerplate = '';
	console.log( file, file.name );
			V3LI.updateIframe(  fileList, index, basepath, filename, boilerplate )
		} );
*/

		var reader = new FileReader();
		reader.addEventListener( 'load', function ( event ) {
			var contents = event.target.result;
			// 2.0
			if ( contents.indexOf( 'postMessage' ) !== -1 ) {
				var blob = new Blob( [ contents ], { type: 'text/javascript' } );
				var url = URL.createObjectURL( blob );
				var worker = new Worker( url );
				worker.onmessage = function ( event ) {
					event.data.metadata = { version: 2 };
					handleJSON( event.data, file.name );
				};
				worker.postMessage( Date.now() );
				return;
			}
			// >= 3.0
			var data;
			try {
				data = JSON.parse( contents );
			} catch ( error ) {
				alert( error );
				return;
			}
			handleJSON( data, file.name );
		}, false );
		reader.readAsText( file.files[0] );

	}

	var handleJSON = function ( data, filename ) {
//		scene = new THREE.Scene();
//		addLights();
// console.log( data ) 
		if ( data.metadata === undefined ) { // 2.0
			data.metadata = { type: 'Geometry' };
		}
		if ( data.metadata.type === undefined ) { // 3.0
			data.metadata.type = 'Geometry';
		}
		if ( data.metadata.version === undefined ) {
			data.metadata.version = data.metadata.formatVersion;
		}
		if ( data.metadata.type.toLowerCase() === 'geometry' ) {
			var loader = new THREE.JSONLoader();
			var result = loader.parse( data );
			var geometry = result.geometry;
			var material;

			if ( result.materials !== undefined ) {
				if ( result.materials.length > 1 ) {
					material = new THREE.MeshFaceMaterial( result.materials );
				} else {
					material = result.materials[ 0 ];
				}
			} else {
				material = new THREE.MeshPhongMaterial();
			}

			geometry.sourceType = "ascii";
			geometry.sourceFile = filename;

			var mesh = new THREE.Mesh( geometry, material );
			mesh.name = filename;
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			scene.add( mesh );
			scene.select = mesh;

		} else if ( data.metadata.type.toLowerCase() === 'object' ) {
			var loader = new THREE.ObjectLoader();
//console.log( data );  // for Dan
			var result = loader.parse( data );
			if ( result instanceof THREE.Scene ) {
//				scene = result; 
				scene.add( result );  // so we always have some light...
			} else {
				scene.add( result );
				scene.select( result );
			}
		} else if ( data.metadata.type.toLowerCase() === 'scene' ) {
			// DEPRECATED
			var loader = new THREE.SceneLoader();
			loader.parse( data, function ( result ) {
				scene = result.scene;
			}, '' );
		}

	};

	function addLights() {
		light = new THREE.AmbientLight( 0x888888 );
		scene.add( light );

		light = new THREE.PointLight( 0xffffff, 1 );
		scene.add( light );
	}