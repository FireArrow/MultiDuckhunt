// simplified viewport, it cant move
var makeView = function( starting_position, starting_updirection, starting_rightdirection )
{
	var wid = 0;
	var hei = 0;
	var pos = starting_position || new Vec();
	var u = starting_updirection || new Vec([1,0,0]).unit();
	var v = starting_rightdirection || new Vec([0,1,0]).unit();
	var n = u.cross( v );
	var fovx = .5;
	var fovy = .5;

	return {
		draw: function( context, w, h, obj, mark ) { // draw: draw obj on context which has width w, height h
			this.project( 
				w,
				h,
				obj.pos().sub( pos ),
				obj.size(),
				function(x,y,size){
					obj.draw(context,x,y,size,mark,w,h);
				} );
		},
		project: function( w, h, start, size, action ) {
			wid=w;
			hei=h;
			var p = start; // p is vector pointing from viewport to object
			var ndist = p.dot( n ); // project p onto the viewport normal to get how far away object is along the axis
			if( ndist > -300 ) // if object should be drawn, (i.e. if distance is positive)
			{
				var x = p.dot( u ); // project p onto x and y viewport axises
				var y = p.dot( v ); // these are the actual coordinates in the vector space of object as viewed from viewport
				
				//calculate the scaled down coordinates and size of object that represent the x and y coordinates of draw location. 
				var cx = (x*fovx*w) / (ndist+fovx*w) + w/2;
				var cy = (y*fovy*h) / (ndist+fovy*h) + h/2;
				var obj_observed_size = size*fovx*w/(ndist+fovx*w);

				if( cx < w && cy < h && cx >= 0 && cy >= 0 )
				{
					action( cx, cy, obj_observed_size );
				}
			}
		},
		width: function(){return wid},
		height: function(){return hei}
	};
};
