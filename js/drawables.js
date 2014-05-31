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
			context.fillStyle = "white";
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

	var makeDashVector = function( apex, multiplier )
	{
		var target = apex.sub( position );
		var norm = target.unit();
		return norm.mul( multiplier );
	};
	
	var enemyid = 0; // which enemy sprite should be drawn?
	var meakness = [10, 13, 15];
	var points = [7, 3, 1];
	var imgoffsets = [0,120,250];//data used to navigate the single-image sprite
	var imgwidths = [110,120,80];// 
	var animation = [0,90]; // the offset in the sprite image for the two different animation images
	var islive = -1; // timestamp for when enemy was killed
	var angle = 0; // current angle of rotation (used during death animation)
	var _size = 100;
	var position = new Vec(); // our position in a three dimensional vector room
	var health = 100;
	var armor = 0;
	var timeoffset = 0;
	var turnspeed = 100;
	var turnaround = new Vec();
	
	var stateMachine = 0;
	
	var stateV1 = new Vec();
	var stateV2 = new Vec();
	var stateV3 = new Vec();
	
	var currentVelocity = new Vec();
	var targetVelocity = new Vec();
	var areSame = true;
	
	var setTarget = function( v ){
		areSame = false;
		targetVelocity = v;
		turnaround = currentVelocity.unit().cross( targetVelocity.unit() ).unit();
	};
	var setCurrent = function( v ){
		areSame = true;
		targetVelocity = v;
		currentVelocity = v;
	};
	
	// function that resets all values
	var reset = function(){
		enemyid = Math.floor( Math.random() * 3 );
		islive = -1;
		health=100;
		armor = Math.random()*8+8;
		timeoffset = Math.random()*1500;
		_size = 100 + (Math.random()-0.5)*30; // vary enemy size somewhat
		// reset starting position to a random place somwhere in the distance
		position = new Vec([
			(Math.random()-0.5)*8000,
			(Math.random()-0.5)*8000,
			Math.random()*1000 + 6000
		]);
		
		stateV1 = makeDashVector(
			new Vec([0,0,1000]),(1.2+(Math.random()*0.4))
		);
		
		setCurrent( stateV1.clone() );

		};
	reset();
	var wasHit = function(mark){
		// what to do when we are hit
		if( health <= 0 )
		{
			killed(points[enemyid]);
			islive = mark;
			// transform velocity to be more toward the side than toward the camera
			setCurrent(
			new Vec([3,0,0]).rotate( Math.random()*2*Math.PI, new Vec([0,0,1]) )
			);
		}
		health -= meakness[enemyid];
	};
	
	var selectSprite = function(){
		if( islive !== -1 )
			return _deadSprite;
			
		if( health <= 45 )
			return _5Sprite;
		if( health <= 60 )
			return _4Sprite;
		if( health <= 75 )
			return _3Sprite;
		if( health <= 90 )
			return _2Sprite;

		return _1Sprite;
	};
	
	
	var mergeVelocity = function()
	{
		if( areSame )
			return;
		var diff = currentVelocity.angle(targetVelocity);
		if(diff < 0.1)
		{
			currentVelocity = targetVelocity;
			areSame = true;
			return;
		}
		
		currentVelocity = currentVelocity.rotate( diff/2, turnaround );
	};
	
	var turncounter=0;

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

			if( turncounter++ > turnspeed )
			{
				turncounter = 0;
				mergeVelocity();
			}
			
			// this switches between the two animation states.
			animation = ( Math.floor( mark / 1000 ) % 2 == 0) ? [0,90] : [80,90];
			// move our position a little bit, based on how much time has passed since the last frame
			if( position.z() > 2000 && position.z() < 4000 )
			{
				if( stateMachine !== 3 )
				{
					stateMachine = 3;
					setTarget( makeDashVector( new Vec([0,0,0]), 1 + Math.random()*2 ) );
				}
			}
			else if( position.z() > 700 && position.z() < 1000 )
			{
				if( stateMachine !== 1 )
				{
					stateMachine = 1;
					setTarget( makeDashVector( new Vec([
						Math.random()*100 - 50,
						Math.random()*100 - 50,
						Math.random()*100 + 500
					]), 4 + Math.random()*2 ) );
				}
			}
			else if( Math.floor( (mark+timeoffset) / 1000 ) % 3 !== 0 )
			{
				if( stateMachine !== 0 )
				{
					stateMachine = 0;
					setTarget( stateV1 );
				}
			}
			else
			{
				if( stateMachine !== 2 )
				{
					stateMachine = 2;
					
					var r = new Vec([
						Math.random()-0.5,
						Math.random()-0.5,
						Math.random()-0.5
						]);
					setTarget( currentVelocity.unit().rotate( 1.5707, r.unit() ).unit().mul( Math.random() *3 +2 ) );
				}
			}
				
			position = position.add( currentVelocity.mul( delta ) );
		},
		draw: function( context, x, y, s, mark ) {
			// draw one enemy, the game engine calculates x and y screen coordinates, and image size for us
			var sprite = selectSprite();
			if( islive === -1 )//if this enemy still lives
			{
				if( intersectHit( x, y, s ) ) // if this enemy is currently hit by a laser
					wasHit( mark ); // report it (then keep rendering, the state will be updated when the next frame is drawn)
				if( debugmode )
				{
					// draw a little helper circle if we are debugging
					// this b0rks on the death animation but whatev.
					context.setTransform(1, 0, 0, 1, 0, 0); // reset the html canvas context transform matrix to move the image a bit
					context.fillStyle = "rgba(0,255,0,100)";
					context.beginPath();
					context.arc( x, y, s/2, 0, Math.PI*2, true);
					context.fill();
				}
				context.setTransform(1, 0, 0, 1, -s/2, -s/2); // reset the html canvas context transform matrix to move the image a bit
				// this is done so that the middle of the image is on x,y
				//then just draw the image
				context.drawImage(sprite, imgoffsets[enemyid], animation[0], imgwidths[enemyid],animation[1], x, y, s, s);

				if( position.z() > 4000 )
				{
					var alpha = (position.z()/2000)-2;
					context.setTransform(1, 0, 0, 1, 0, 0);
					context.fillStyle = "rgba(0,0,0,"+alpha+")";
					context.beginPath();
					context.arc( x, y, s/1.5, 0, Math.PI*2, true);
					context.fill();
				}
			}
			else // enemy is dead
			{
				//update rotation animation
				angle+=0.1;
				var sin = Math.sin(angle);
				var cos = Math.cos(angle);
				context.setTransform( cos, sin, -sin, cos, x, y ); // set transform matrix to rotate image and move it to x,y
				// and draw the image, remeber to offset half the image width and height so that it is drawn with the middle in x,y
				context.drawImage(sprite, imgoffsets[enemyid], animation[0], imgwidths[enemyid],animation[1], -s/2,-s/2,s,s);
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
