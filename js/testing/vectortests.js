	var angleBetween = function(a,b)
	{
		var t = a.x()*b.x() + a.y()*b.y() + a.z()*b.z();
		var n = a.abs() * b.abs();
		return Math.acos(t/n);
	};

describe('angles', function(){
it( 'can be calculated', function(){
var res = angleBetween(new Vec([2,-3,4]),new Vec([5,2,1]));
expect( res ).toBeCloseTo(1.296081,0.0001)
});
});

describe('given vectors', function(){
	describe('when subtracting', function(){
	it('zero vector from 1 results in same vector', function(){
		var v1 = new Vec([1,1,1]);
		var v2 = new Vec([0,0,0]);

		var result = v1.sub(v2);
		expect( result.x()).toBe( 1 );
		expect( result.y()).toBe( 1 );
		expect( result.z()).toBe( 1 );
	});
	it('same vector from same results in zero vector', function(){
		var v1 = new Vec([1,1,1]);
		var v2 = new Vec([1,1,1]);

		var result = v1.sub(v2);
		expect( result.x()).toBe( 0 );
		expect( result.y()).toBe( 0 );
		expect( result.z()).toBe( 0 );
	});

	it('a vector from another', function(){
		var v1 = new Vec([3,2,1]);
		var v2 = new Vec([1,2,3]);

		var result = v1.sub(v2);
		expect( result.x()).toBe( 2 );
		expect( result.y()).toBe( 0 );
		expect( result.z()).toBe( -2 );
	});
	it('can subtract negative vector values', function(){
		var v1 = new Vec([3,2,-1]);
		var v2 = new Vec([1,-2,3]);

		var result = v1.sub(v2);
		expect( result.x()).toBe( 2 );
		expect( result.y()).toBe( 4 );
		expect( result.z()).toBe( -4 );
	});
	});
	describe('when adding ', function(){
		it('results in correct vector', function(){
			var v1 = new Vec([4,1,9]);
			var v2 = new Vec([-1,3,0]);
			var result = v1.add(v2);
			expect( result.x()).toBe( 3 );
			expect( result.y()).toBe( 4 );
			expect( result.z()).toBe( 9 );
		});
	});
	describe('when scaling', function(){
		it('to unit vector the vector has length 1', function(){
			var v = new Vec([5,0,0]);
			var unit = v.unit();
			expect( unit.abs()).toBeCloseTo( 1, 8 );

			 v = new Vec([5,6,1]);
			 unit = v.unit();
			expect( unit.abs()).toBeCloseTo(1, 14 );
		});
		it('to scalar correct vector is the result', function(){
			var v1 = new Vec([4,1,9]);
			var result = v1.mul( 3 );
			expect( result.x()).toBe( 12 );
			expect( result.y()).toBe( 3 );
			expect( result.z()).toBe( 27 );
		});
	});


});
