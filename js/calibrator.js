// This is the object that is responsible for setting up a calibration sequence.
// When it is done, it will return a prepared calibrate-object
var calibrateAction = function( state, image, finished )
{
	var id = "calibrate";
	var c = makeCalibration( state );
	var transition_mark = undefined;
	// The delegate will be added to the rendering engine. It will be called once for each rendered frame.
	var delegate = function( context, width, height, mark, keys ) {
		
		// depending on which state the calibration sequence is in, we either
		if( c.getState() === "topleft" )
		{
			// draw an image in the top left corner
			context.drawImage(image, -20, -20,40,40);
			if( keys.length > 0 )
			{
				c.reportTopLeft( width, height );
				transition_mark = mark;
			}
		}
		else if( c.getState() === "topright" )
		{
			// draw an image in the top right corner
			context.drawImage(image, width-20, -20,40,40);
			if( keys.length > 0 && transition_mark + 1000 < mark )
			{
				c.reportTopRight();
				transition_mark = mark;
			}
		}
		else if( c.getState() === "bottomright" )
		{
			// draw an image in the bottom right corner
			context.drawImage(image, width-20, height-20,40,40);
			if( keys.length > 0 && transition_mark + 1000 < mark )
			{
				c.reportBottomRight();
				transition_mark = mark;
			}
		}
		else if( c.getState() === "bottomleft" )
		{
			// draw an image in the bottom left corner
			context.drawImage(image, -20, height-20,40,40);
			if( keys.length > 0 && transition_mark + 1000 < mark )
			{
				c.reportBottomLeft();
			}
		}
		else if( c.getState() === "ready" )
		{
			// or finish up and return our ready calibration object
			finished( id, c );
		}
	};
	return {
		id: id,
		draw: delegate
	};
};

var makeCalibration = function( comms )
{
	var _state = "topleft"; // other possible states are [topright, bottomright, bottomleft, ready]
	var _current_coords = {x:0,y:0};

    // The calibration works by taking the mean of two linear transformations, one for each diagonal.
	
	var calPointTopLeft = undefined; //Top left bottom right base
    var calPointBottomRight = undefined; //Top left bottom right scale
    var calPointTopRight = undefined; //Top right bottom left base
	var calPointBottomLeft = undefined; //Top right bottom left scale
	
	return {
		reportTopLeft: function(current_width,current_height){
			//user has pressed key signaling that the current state reported by the server matches the
			// mark drawn on the screen.
			var coords = comms();
			if( coords.length > 0 ) // guard for badness from server
			{
				_current_coords = {x:current_width,y:current_height}; // save screen size so we know where to print the other marks
				_state = "topright";
				calPointTopLeft = coords[0];
			}
		},
		reportTopRight: function(){
			// user signals that second mark matches
			var coords = comms();
			if( coords.length > 0 )
			{
				_state = "bottomright";
				calPointTopRight = coords[0];
			}
		},
		reportBottomRight: function(){
			// user signals that second mark matches
			var coords = comms();
			if( coords.length > 0 )
			{
				_state = "bottomleft";
				calPointBottomRight = coords[0];
			}
		},
		reportBottomLeft: function(){
			// user signals that second mark matches
			var coords = comms();
			if( coords.length > 0 )
			{
				_state = "ready";
				calPointBottomLeft = coords[0];
			}
		},

		getState: function(){
			return _state;
		},

        

		transform: function(coords){
			
    		// This function transforms coords from the scale they are imported from the imaging server
    		// to on screen window relative coordinates.
            //
            // To account for the camera not being perfectly aligned with the screen we do two
            // linear transformations, one over each diagonal, and return the mean of the two.

    		// There is testing done on this. Check test.html. 
            // TODO Update test to match new calibration algorithm

    		// Transform x component linearily onto screen based on the two calibration reports
            // Top left corner to bottom right.
    		var base_TLBR_X = coords.x - (calPointTopLeft.x + calPointBottomLeft.x) / 2;
    		var delta_TLBR_X = (calPointTopRight.x + calPointBottomRight.x) / 2 - (calPointTopLeft.x + calPointBottomLeft.x) / 2;
    		var x1 = ( base_TLBR_X / delta_TLBR_X ) * _current_coords.x;

    		// transform y coordinate in the same way
    		var base_TLBR_Y = coords.y - (calPointTopLeft.y + calPointTopRight.y) / 2;
    		var delta_TLBR_Y = (calPointBottomLeft.y + calPointBottomRight.y) / 2 - (calPointTopLeft.y + calPointTopRight.y) / 2;
    		var y1 = ( base_TLBR_Y / delta_TLBR_Y ) * _current_coords.y;

          //Everything gets a bit upside-down in top right bottom left
          //but just be careful and it'll be ok
          //Top right corner to bottom left.
//    		var base_TRBL_X = coords.x - calPointBottomLeft.x;
//       		var delta_TRBL_X = calPointTopRight.x - calPointBottomLeft.x;
//    		var x2 = ( base_TRBL_X / delta_TRBL_X ) * _current_coords.x;

    		// transform y coordinate in the same way
//    		var base_TRBL_Y = coords.y - calPointTopRight.y;
//    		var delta_TRBL_Y = calPointBottomLeft.y - calPointTopRight.y;
//    		var y2 = ( base_TRBL_Y / delta_TRBL_Y ) * _current_coords.y;

//            var meanX = ( x1 + x2 ) / 2;
//            var meanY = ( y1 + y2 ) / 2;

//			return { x: meanX, y: meanY };
			return { x: x1, y: y1 };
		},

		getAll: function(){
			// this is a helper function that simply gets the latest reported coords from the server and transforms them in bulk
			var serverCoords = comms();
			var transformed = [];
			for( var i = 0; i < serverCoords.length; i++ )
			{
				transformed.push( this.transform( serverCoords[i] ) );
			}
			return transformed;
		}
	};
};
