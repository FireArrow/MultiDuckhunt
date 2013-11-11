Dot detector
============
The image analyzer takes frames from a web camera, looks for white dots in it and sends the result to
the web server part. The white dots are intended to be laser dots, but any bright light works

Java implementation
-----------

*DEPRICATED* - Use the C implementation instead

* The image analyzer depends on JavaCV, available at http://code.google.com/p/javacv/
* Instructions how to JavaCV available at http://code.google.com/p/javacv/wiki/Windows7AndOpenCV

It is prefable to create a folder called "lib" and place libraries there, as that is what
the supplied build-file expects.

Build the project using the supplied ant-file and start it with
    java -cp [your library path] se.insektionen.cosmonova.DotDetector

An easier way to do it is to import the whole thing into Eclipse and run it from there (or export a jar-file)

C implementation
--------------
See README.md in the dotdetector folder


Web server
===========

Runs on Node.js -  http://nodejs.org

Reads UDP packets from dot detector and delivers static web content. It also provide a websocket server for
pages to get the latest state of detected dots when it arrive.

* Download nodejs from above url, install
* Download websocket nodejs module ( npm install ws )
* Start nodejs/start.bat run "node nodejs/server.js"

Games
=====

All done in javascript. Just point web browser to http://localhost:8888/
(substitute localhost for the address of the computer running node js if applicable)

Invaders
--------
Aliens comes at you. Point at them with your laser to fend them off.
Game runs for 50 seconds. Once an alien is shot it will show a death animation and then
respawn. It will also respawn if you fail to shoot it down and it makes it past you.
Points are counted for each alien you manage to shoot down.

Calibrate
---------
Shows a point on the screen where it thinks you light the laser. The laser dot and the point 
on the screen should match, or something is up with the calibration.
