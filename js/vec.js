/*
 * A three dimensional vector.
 * Not modifiable, if you want to change a vector, make a new one.
 */
function Vec( par )
{
	this._abs = undefined;
	this.data = par || [0,0,0];
};

Vec.prototype.num = function(i){
	i *= 1000;
	i = Math.round(i);
	i /= 1000;
	return i;
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
