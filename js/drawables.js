var enemy = function(base,hit){
	var _x = 0;
	var _y = 0;
	var angle = 0;
	
	return {
		tick: function(){},
		draw: function()
		{
		}
	};
};

var demo = function( calibrator )
{
	return {
		id: "demo",
		draw: function( context, width, height, mark, keys ) {
			context.fillStyle = "#99F";
			var coords = calibrator.getAll();
			for( var i = 0; i < coords.length; i++ )
			{
				context.beginPath();
				context.arc( tCord.x, tCord.y, 10, 0, Math.PI*2, true);
				context.fill();
			}
		}
	};
};