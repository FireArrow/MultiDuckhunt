describe('given vectors', function(){
	describe('when subtracting', function(){
	it('zero vector from 1 results in same vector', function(){
		var v1 = vec({x:1,y:1,z:1});
		var v2 = vec({x:0,y:0,z:0});

		var result = v1.sub(v2);
		expect( result.x()).toBe( 1 );
		expect( result.y()).toBe( 1 );
		expect( result.z()).toBe( 1 );
	});
	it('same vector from same results in zero vector', function(){
		var v1 = vec({x:1,y:1,z:1});
		var v2 = vec({x:1,y:1,z:1});

		var result = v1.sub(v2);
		expect( result.x()).toBe( 0 );
		expect( result.y()).toBe( 0 );
		expect( result.z()).toBe( 0 );
	});

	it('a vector from another', function(){
		var v1 = vec({x:3,y:2,z:1});
		var v2 = vec({x:1,y:2,z:3});

		var result = v1.sub(v2);
		expect( result.x()).toBe( 2 );
		expect( result.y()).toBe( 0 );
		expect( result.z()).toBe( -2 );
	});
	it('can subtract negative vector values', function(){
		var v1 = vec({x:3,y:2,z:-1});
		var v2 = vec({x:1,y:-2,z:3});

		var result = v1.sub(v2);
		expect( result.x()).toBe( 2 );
		expect( result.y()).toBe( 4 );
		expect( result.z()).toBe( -4 );
	});
	});
	describe('when adding ', function(){
		it('results in correct vector', function(){
			var v1 = vec({x:4,y:1,z:9});
			var v2 = vec({x:-1,y:3,z:0});
			var result = v1.add(v2);
			expect( result.x()).toBe( 3 );
			expect( result.y()).toBe( 4 );
			expect( result.z()).toBe( 9 );
		});
	});
	describe('when scaling', function(){
		it('to unit vector the vector has length 1', function(){
			var v = vec({x:5,y:0,z:0});
			var unit = v.unit();
			expect( unit.abs()).toBeCloseTo( 1, 8 );

			 v = vec({x:5,y:6,z:1});
			 unit = v.unit();
			expect( unit.abs()).toBeCloseTo(1, 14 );
		});
		it('to scalar correct vector is the result', function(){
			var v1 = vec({x:4,y:1,z:9});
			var result = v1.mul( 3 );
			expect( result.x()).toBe( 12 );
			expect( result.y()).toBe( 3 );
			expect( result.z()).toBe( 27 );
		});
	});


});
