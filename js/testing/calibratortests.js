var makeTestCalib = function( arr )
{
	var inputarray = arr;
	var pointer = 0;
	return makeCalibration(function(){return inputarray[pointer++];});
};

describe('given a calibrator object', function(){

	describe('after stretch calibration', function() {
		var c = makeTestCalib( [[{x:-100,y:-50}],[{x:100,y:0}]] );
		c.reportFirst( 10,10 );
		c.reportSecond();
		it('can transform coordinates as expected', function() {
			var before = {x:"0",y:"0"};
			var after = c.transform( before );
			expect( after.x ).toBeCloseTo( 5, 0.0001 );
			expect( after.y ).toBeCloseTo( 10, 0.0001 );
		});
	});
	
	describe('after slightly more intricate calibration', function() {
		var c = makeTestCalib( [[{x:-10,y:5}],[{x:40,y:55}]] );
		c.reportFirst( 50,50 );
		c.reportSecond();
		it('can transform coordinates as expected', function() {
			var before = {x:"0",y:"10"};
			var after = c.transform( before );
			expect( after.x ).toBeCloseTo( 10, 0.0001 );
			expect( after.y ).toBeCloseTo( 5, 0.0001 );
		});
	});

	describe('after simple calibration', function() {
		var c = makeTestCalib( [[{x:0,y:0}],[{x:50,y:50}]] );
		c.reportFirst( 50,50 );
		c.reportSecond();
		it('can transform coordinates in a dumb way', function() {
			var before = {x:"35",y:"36"};
			var after = c.transform( before );
			expect( after.x ).toBeCloseTo( before.x, 0.0001 );
			expect( after.y ).toBeCloseTo( before.y, 0.0001 );
		});
		it('can transform edge case coordinates', function(){
			var before = {x:"0",y:"0"};
			var after = c.transform( before );
			expect( after.x ).toBeCloseTo( before.x, 0.0001 );
			expect( after.y ).toBeCloseTo( before.y , 0.0001 );
			 before = {x:"50",y:"50"};
			 after = c.transform( before );
			expect( after.x ).toBeCloseTo( before.x, 0.0001 );
			expect( after.y ).toBeCloseTo( before.y, 0.0001 );
			});
		it('can transform outside boundaries coordinates', function(){
		var before = {x:"-2",y:"-4"};
			var after = c.transform( before );
			expect( after.x ).toBeCloseTo( before.x , 0.0001 );
			expect( after.y ).toBeCloseTo( before.y, 0.0001 );
			 before = {x:"51",y:"54"};
			 after = c.transform( before );
			expect( after.x ).toBeCloseTo( before.x, 0.0001 );
			expect( after.y ).toBeCloseTo( before.y, 0.0001 );
		});
	});
});
