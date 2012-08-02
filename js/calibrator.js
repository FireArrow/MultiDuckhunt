
var makeCalibration = function( comms )
{
	var _state = "show1"; // show2, ready
	var _current_coords = {x:0,y:0};
	
	var base_report = undefined;
	var scale_report = undefined;
	
	return {
		reportFirst: function(current_width,current_height){
			_current_coords = {x:current_width,y:current_height};
			_state = "show2";
			base_report = comms()[0];
		},
		reportSecond: function(){
			_state = "ready";
			scale_report = comms()[0];
		},
		getState: function(){
			return _state;
		},
		transform: function(coords){
		
		var baseX = coords.x - base_report.x;
		var deltaX = scale_report.x - base_report.x;
		var x = ( baseX / deltaX ) * _current_coords.x;
		
		var baseY = coords.y - base_report.y;
		var deltaY = scale_report.y - base_report.y;
		var y = ( baseY / deltaY ) * _current_coords.y;

			return { x: x, y: y };
		}
	};
};