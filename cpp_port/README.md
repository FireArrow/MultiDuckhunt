Dotdetector in C
=============

Same as the Java dot detector this program grabs images from the camera latest added to the system (TODO Grab from given camera),
and finds dots in it. These dots are then sent to given port (udp) on given IP. As the program 
starts it will present a debug window showing the current image with the detected dots painted. A tetragon 
represents the bounding area, allowing the detection area to be smaller then the grabbed image.

Keys
-----
* ESC - close the program
* r - recalibrate the bounding area
* f - flip the image horizontally
* g - flip the image vertically
* v - stop updating the image
* n - cycle noice reduction mode

Noice reduction
---------------

There are currently three types of noice reduction. They appear in order
* None - No noice reduction is done at all
* Erode - Kind of a floor for pixels. Small areas of matching color are removed
* Delite - Kind of a ceil for pixels. Small areas of matching color are enlarged


Install instructions
====================

On rasberry pi
-------------

* apt-get install git
* git clone (https://github.com/FireArrow/MultiDuckhunt.git)
* download and install opencv. instructions at http://opencv.willowgarage.com/wiki/InstallGuide%20%3A%20Debian (Note: this takes ages!)
* cd MultiDuckhunt/cpp_port
* make

