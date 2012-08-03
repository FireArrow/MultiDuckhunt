var bar = function(name, position, size, color, getPercent ){
	return {
		id: name,
		draw: function( context, width, height, mark, keys ) {
			context.fillStyle = "white";
			context.fillRect( position.x, position.y, size.x, size.y );
			context.fillStyle = color;
			var colorheight = (size.y - 10) * getPercent();
			if(colorheight < 0 ) colorheight = 0;
			context.fillRect( 5+position.x, position.y+(size.y-colorheight)-5, size.x - 10, colorheight  );
			context.fillStyle = "white";
			context.font = "12px";
			context.fillText( name, position.x, position.y + size.y + 10 );
		}
	};
};
var ending = function( score ) {
	return {
		id: "scorescreen",
		draw: function( context, width, height, mark, keys ) {
			context.fillStyle = "white";
			context.font = "bold 80px Consolas, monospace";
			context.fillText( "GAME OVER", 300, height/2 );
			context.font = "35px Consolas, monospace";
			context.fillText( score + " points" , 300, height/2 + 50 );
		}
	};
};
var enemy = function( killed ){
	var enemyid = 0;
	var imgoffsets = [0,120,250];
	var imgwidths = [110,120,80];
	var islive = -1;
	var angle = 0;
	var state = [0,90];
	var _size = 100;
	var position = vec();
	var velocity = vec();
	var reset = function(){
		enemyid = Math.floor( Math.random() * 3 );
		islive = -1;
		_size = 100 + (Math.random()-0.5)*30;
		position = vec({x:(Math.random()-0.5)*400,
						y:(Math.random()-0.5)*400,
						z:Math.random()*100 + 10000});
		velocity = vec({x:(Math.random()-0.5)*0.7,
						y:(Math.random()-0.5)*0.7,
						z:(-1)*(4+Math.random())});
		};
	reset();

	return {
		id:"enemy",
		pos: function(){ return position;},
		size: function(){ return _size; },
		tick: function( keys, mark, delta ) {
			if(keys.length > 0 && islive === -1 )
			{
				islive = mark;
				velocity = vec({
					x: velocity.x()*10,
					y: velocity.y()*10,
					z: velocity.z()/10
				});

			}
			if( islive !== -1 && mark-islive > 2000 || position.z() < -10000 )
			{
				reset();
			}

			state = ( Math.floor( mark / 1000 ) % 2 == 0) ? [0,90] : [80,90];
			position = position.add( velocity.mul( delta ) );
		},
		draw: function( context, x, y, s ) {
			if( _debug !== undefined )
			{
				context.fillStyle = "rgba(0,255,0,100)";
				context.beginPath();
				context.arc( x, y, s/2, 0, Math.PI*2, true);
				context.fill();
			}

			if( islive == -1 )
			{
				context.setTransform(1, 0, 0, 1, -s/2, -s/2);
				context.drawImage(_wSprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], x,y,s,s);
			}
			else
			{

				angle+=0.1;
				var sin = Math.sin(angle);
				var cos = Math.cos(angle);
				context.setTransform( cos, sin, -sin, cos, x, y );
				context.drawImage(_rSprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], -s/2,-s/2,s,s);
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