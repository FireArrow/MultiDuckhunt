/*
* A three dimensional vector.
* Not mutable, if you want to change a vector, make a new one.
*/
function Vec( par ){
	this._abs = undefined;
	this.data = par || [0,0,0];
};

Vec.prototype.num = function(i){
	i *= 1000;
	i = Math.round(i);
	i /= 1000;
	return i;
};

Vec.prototype.angle = function( other ){
	var t = this.data[0]*other.x() + this.data[1]*other.y() + this.data[2]*other.z();
	var n = this.abs() * other.abs();
	return Math.acos(t/n);
};

// return a vector that is this vector rotated around the vector parameter 'around' by theta radians
Vec.prototype.rotate = function(theta, around){
	// this is basically the extracted arithmetic of multiplying a series of rotational matrixes with vector ve
	var cos = Math.cos(theta);
	var sin = Math.sin(theta);
	var u = around.x();
	var v = around.y();
	var w = around.z();
	var x = this.data[0];
	var y = this.data[1];
	var z = this.data[2];
	var rx = u*(u*x+v*y+w*z)*(1-cos)+x*cos+(-1*w*y+v*z)*sin;
	var ry = v*(u*x+v*y+w*z)*(1-cos)+y*cos+(w*x-u*z)*sin;
	var rz = w*(u*x+v*y+w*z)*(1-cos)+z*cos+(-1*v*x+u*y)*sin;
	return new Vec([rx,ry,rz]);
};

Vec.prototype.clone = function(){
	return new Vec([this.data[0], this.data[1], this.data[2]]);
};

Vec.prototype.abs = function(){
	if( this._abs === undefined )
		this._abs = Math.sqrt( this.data[0]*this.data[0] + this.data[1]*this.data[1] + this.data[2]*this.data[2] );
	return this._abs;
};

Vec.prototype.x = function(){return this.data[0];};
Vec.prototype.y = function(){return this.data[1];};
Vec.prototype.z = function(){return this.data[2];};

// return the unit vector pointing in the same direction as this vector.
Vec.prototype.unit = function(){ return this.mul( 1 / this.abs() ); };
Vec.prototype.norm = function(){ return this.unit(); };

// return the dot product of this and v
Vec.prototype.dot = function( v ){ return this.data[0] * v.data[0] + this.data[1] * v.data[1] + this.data[2] * v.data[2]; };

// return the cross product of this and v
Vec.prototype.cross = function( v ){
	return new Vec([
		this.data[1] * v.data[2] - this.data[2] * v.data[1],
		this.data[2] * v.data[0] - this.data[0] * v.data[2],
		this.data[0] * v.data[1] - this.data[1] * v.data[0]
	]);
};

// return the product of the vector 'this' and the parameter scalar
Vec.prototype.mul = function( scal ) { return new Vec( [scal*this.data[0], scal*this.data[1], scal*this.data[2]] ); };

Vec.prototype.add = function( v ) {
	return new Vec([
		this.data[0] + v.data[0],
		this.data[1] + v.data[1],
		this.data[2] + v.data[2]
	]);
};

Vec.prototype.sub = function( v ) {
	return new Vec([
		this.data[0] - v.data[0],
		this.data[1] - v.data[1],
		this.data[2] - v.data[2]
	]);
};

// printable string representing this vector
Vec.prototype.info = function() { return "[ "+this.num(this.x())+", "+this.num(this.y())+", "+this.num(this.z())+" ]";};
Vec.prototype.toString = function() { return "tostr"+this.info()};
Vec.prototype.toSource = function() { return "tosou"+this.info()};
