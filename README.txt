Image analyzer part:
The image analyzer takes frames from a web camera, looks for white dots in it and sends the result to
the web server part. The white dots are intended to be laser dots, but any bright light works

The image analyzer depends on JavaCV, available at http://code.google.com/p/javacv/
Instructions how to JavaCV available at http://code.google.com/p/javacv/wiki/Windows7AndOpenCV
It is prefable to create a folder called "lib" and place libraries there, as that is what
the supplied build-file expects.

Build the project using the supplied ant-file and start it with
java -cp [your library path] se.insektionen.cosmonova.DotDetector

An easier way to do it is to import the whole thing into Eclipse and run it from there (or export a jar-file)


Web server part:

Depends on http://nodejs.org
Reads udp packets from image analyzer and delivers static web content and the image data from the analyzers on request.

Download nodejs from above url, install, start nodejs/start.bat



Game part:
All done in javascript. Just point web browser to http://localhost:8888/invaders.html (substitute localhost for the address of the computer running node js if applicable)