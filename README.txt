Image analyzer part:

Detta projekt är beroende av JavaCV. Hitta det på http://code.google.com/p/javacv/
och följ sedan instruktionerna på http://code.google.com/p/javacv/wiki/Windows7AndOpenCV
för att få det att fungera.



Web server part:

Depends on http://nodejs.org
Reads udp packets from image analyzer and delivers static web content and the image data from the analyzers on request.

Download nodejs from above url, install, start nodejs/start.bat



Game part:
All done in javascript. Just point web browser to http://localhost:8888/invaders.html (substitute localhost for the address of the computer running node js if applicable)