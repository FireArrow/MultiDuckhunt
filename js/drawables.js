// This file holds a lot of things that can be drawn on screen.

// this is a vertical progress bar with white border, colored content, and a text label.
var bar = function(name, position, size, color, getPercent ) {
	return {
		id: name,
		draw: function( context, width, height, mark, keys ) {
			context.fillStyle = "#555";
			context.fillRect( position.x, position.y, size.x, size.y );
			context.fillStyle = color;
			var colorheight = (size.y - 10) * getPercent();
			if(colorheight < 0 ) colorheight = 0;
			context.fillRect( 5+position.x, position.y+(size.y-colorheight)-5, size.x - 10, colorheight  );
			context.fillStyle = "red";
			context.font = "12px";
			context.fillText( name, position.x, position.y + size.y + 10 );
		}
	};
};

// this is the ending screen
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

var highscore = function( strHighScore ) {
    return {
        id: "highscorescreen",
        draw: function( context, width, height, mark, keys ) {
            context.fillStyle = "white";
            context.font = "25px Consolas, monospace";
            context.fillText(strHighScore, 30, height - 50);
        }
    };
}

var restartButton = function( isHitRect, restartFunction ) {
    return {
        id: "restartbutton",
        draw: function( context, width, height, mark, keys ) {
            context.fillStyle = "white";
            context.font = "36px Consolas, monospace";
            context.fillText( "RESTART", 300, height/2 + 200 );
            context.strokeStyle = "white";
            context.rect( 295, height/2 + 170, 200, 40);
            context.stroke();
            if( isHitRect( 295, height/2 + 170, 200, 40) ) {
                restartFunction();
            }
        }
    };
};

// this is the dot counter
var dotcounter = function( counter ) {
	return {
		id: "dotcounter",
		draw: function( context, width, height, mark, keys ) {
			context.fillStyle = "white";
			context.font = "bold 20px Consolas, monospace";
			context.fillText( counter(), 20, 20 );
		}
	};
};

// this is one enemy
// this class is not added directly to the rendering engine, it should first go through the game engine
var enemy = function( killed, intersectHit, debugmode ){
	//params:
	// killed, callback function, we call killed when this enemy is killed
	// intersectHit, callbackfunction, we use this to check if this enemy is currently hit by laser
	
	var enemyid = 0; // which enemy sprite should be drawn?
	var imgoffsets = [0,120,250];//data used to navigate the single-image sprite
	var imgwidths = [110,120,80];// 
	var state = [0,90]; // the offset in the sprite image for the two different animation images
	var islive = -1; // timestamp for when enemy was killed
	var angle = 0; // current angle of rotation (used during death animation)
	var _size = 100;
	var position = new Vec(); // our position in a three dimensional vector room
	var velocity = new Vec(); // our velocity in a three dimensional vector room
	var sidevelocity = new Vec();
	var health = 100;
	var timeoffset = 0;
	
	
	
	// function that resets all values
	var reset = function(){
		enemyid = Math.floor( Math.random() * 3 );
		islive = -1;
		health=100;
		timeoffset = Math.random()*1500;
		_size = 100 + (Math.random()-0.5)*30; // vary enemy size somewhat
		// reset starting position to a random place somwhere in the distance
		position = new Vec([(Math.random()-0.5)*800,
					(Math.random()-0.5)*800,
						Math.random()*1000 + 1000]);
		// reset starting velocity to be almost directed towards the camera
		velocity = new Vec([(Math.random()-0.5)*0.07,
						(Math.random()-0.5)*0.07,
						(-1)*(0.4+(Math.random()*0.1))]);
		sidevelocity = new Vec([
				velocity.x()*5,
				 velocity.y()*5,
				 velocity.z()*0.01]);
		};
	reset();
	var wasHit = function(mark){
		// what to do when we are hit
		if( health <= 0 )
		{
			killed();
			islive = mark;
			// transform velocity to be more toward the side than toward the camera
			velocity = new Vec([
				velocity.x()*10,
				 velocity.y()*10,
				 0]);
		}
		health -= 5;
	};
	
	var selectSprite = function(){
		if( islive !== -1 )
			return _deadSprite;
			
		if( health <= 60 )
			return _5Sprite;
		if( health <= 70 )
			return _4Sprite;
		if( health <= 80 )
			return _3Sprite;
		if( health <= 90 )
			return _2Sprite;

		return _1Sprite;
	};

	return {
		id:"enemy",
		pos: function(){ return position;},
		size: function(){ return _size; },
		tick: function( keys, mark, delta ) {
			// our game engine calls this one once for every enemy once per frame, before anything is drawn
			if( islive !== -1 && mark-islive > 2000 || position.z() < -2000 )
			{
				//if we are dead, and have been dead for a little while
				// or if we are way past the viewport
				reset(mark);
			}
			
			// this switches between the two animation states.
			state = ( Math.floor( mark / 1000 ) % 2 == 0) ? [0,90] : [80,90];
			// move our position a little bit, based on how much time has passed since the last frame
			if( Math.floor( (mark+timeoffset) / 1000 ) % 3 == 0 )
				position = position.add( velocity.mul( delta ) );
			else
				position = position.add( sidevelocity.mul( delta ) );
		},
		draw: function( context, x, y, s, mark ) {
			// draw one enemy, the game engine calculates x and y screen coordinates, and image size for us
			if( position.z() > 1000 )
				return; // clipspace
			var sprite = selectSprite();
			if( islive === -1 )//if this enemy still lives
			{
				if( intersectHit( x, y, s ) ) // if this enemy is currently hit by a laser
					wasHit( mark ); // report it (then keep rendering, the state will be updated when the next frame is drawn)
				if( debugmode )
				{
					// draw a little helper circle if we are debugging
					// this b0rks on the death animation but whatev.
				context.setTransform(1, 0, 0, 1, 0,0); // reset the html canvas context transform matrix to move the image a bit
					context.fillStyle = "rgba(0,255,0,100)";
					context.beginPath();
					context.arc( x, y, s/2, 0, Math.PI*2, true);
					context.fill();
				}
				context.setTransform(1, 0, 0, 1, -s/2, -s/2); // reset the html canvas context transform matrix to move the image a bit
				// this is done so that the middle of the image is on x,y
				//then just draw the image
				context.drawImage(sprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], x, y, s, s);
			}
			else // enemy is dead
			{
				//update rotation animation
				angle+=0.1;
				var sin = Math.sin(angle);
				var cos = Math.cos(angle);
				context.setTransform( cos, sin, -sin, cos, x, y ); // set transform matrix to rotate image and move it to x,y
				// and draw the image, remeber to offset half the image width and height so that it is drawn with the middle in x,y
				context.drawImage(sprite, imgoffsets[enemyid], state[0], imgwidths[enemyid],state[1], -s/2,-s/2,s,s);
			}
		}
	};
};

// demo object
var demo = function( calibrator )
{
	return {
		id: "demo",
		draw: function( context, width, height, mark, keys ) {
			// draw one little circle for every reported lightpoint from server
			context.fillStyle = "#99F";
			var coords = calibrator.getAll();
			for( var i = 0; i < coords.length; i++ )
			{
				context.arc( coords[i].x, coords[i].y, 4, 0, Math.PI*2, true);
				context.fill();
			}
		}
	};
};
