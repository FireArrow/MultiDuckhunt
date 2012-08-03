var makeGame = function() {
	var server = makeServerState();
	var engine = makeEngine(document.getElementById("example"));
	var view = makeView();
	engine.start();
	var calibrator = undefined;

	var start = function() {
		var drawables = [enemy()];
		var viewport = makeView();

		var lastmark = 0;

		var sortFunction = function(a,b){
			var v1 = b.pos().abs();
			var v2 = a.pos().abs();
			return v1 - v2;
		};

		var enemies = function( context, width, height, mark, keys ) {
			for( var d in drawables )
				drawables[d].tick( keys, mark, (mark - lastmark) );
			drawables.sort( sortFunction );
			for( var d2 in drawables )
				viewport.draw( context, width,height, drawables[d2] );
			lastmark = mark;
		};
		engine.add( {draw:enemies,id:"aoeu"} );
	};

	var reset = function() {
		engine.clear();
		start();
	};

	return {
		recalibrate: function() {
			engine.clear();
			var c = calibrateAction( server.getState, _X, function( id, c ) {
				calibrator = c;
				reset();
			});
		//	engine.add( c );
			reset();
		},
		reset: reset
	}
};
