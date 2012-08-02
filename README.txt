Image analyzer part:

Detta projekt är beroende av JavaCV. Hitta det på http://code.google.com/p/javacv/
och följ sedan instruktionerna på http://code.google.com/p/javacv/wiki/Windows7AndOpenCV
för att få det att fungera.



Web server part:

Depends on http://nodejs.org
Reads udp packets from image analyzer and delivers static web content and the image data from the analyzers on request.



Game part:
All done in javascript.