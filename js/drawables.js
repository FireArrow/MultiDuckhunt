var enemy = function( killed ){
	var enemyid = Math.floor( Math.random() * 3 )
	var imgoffsets = [0,120,250];
	var imgwidths = [110,120,80];
	var usedimage = _wSprite;
	var islive = -1;
	var angle = 0;
	var state = [0,90];
	var _size = 100;
	var position = vec({x:40,y:50,z:300});
	var animateLive = function( context, x, y, s )
	{

		context.drawImage(_wSprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], x,y,s,s);
	};
	var animateDeath = function( context, x, y, s )
	{

		context.drawImage(_rSprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], x,y,s,s);
	};
	return {
		id:"enemy",
		pos: function(){ return position;},
		size: function(){ return _size; },
		tick: function( keys, mark, delta ) {
			if(keys.length > 0 )
			{
				islive = mark;
			}
			state = ( Math.floor( mark / 1000 ) % 2 == 0) ? [0,90] : [80,90];
			position = position.add(
				vec({x:Math.random()*.01,y:Math.random*0.01,z:-0.1}).mul( delta )
		);

		},
		draw: function( context, x, y, s ) {

			if( islive == -1 )
				animateLive( context, x, y, s );
			else
			{
				animateDeath(context, x, y, s);
			}

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
				context.arc( coords[i].x, coords[i].y, 10, 0, Math.PI*2, true);
				context.fill();
			}
		}
	};
};