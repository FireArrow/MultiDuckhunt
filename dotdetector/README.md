Dot detector
============

This program grabs images from the camera latest added to the system (TODO Grab from given camera),
and finds dots in it. These dots are then sent to given port (udp) on given IP. 
When the program starts it will present three windowses, one with the image grabbed from the camera (plus some overlay),
one black and white showing the currently detected shapes (one shape is one dot), and one warped image.
Before any sensible data can be had from the dot detector the transformation area has to be set. This is done by pressing 't'
on the keyboard and then click the corners of the screen where dots should be detected. Now the warped image should show the
image within the transformation area as a rectangle. If not you just redo the process. If you don't want to relocate a point
just right click instead and you'll skip the the next point.

When the transformation area is set you can improve the performance of the dot detector by turning off the warp image ('w'). 
The points will still be transformed, but there is no need to transform the whole image.

If you are detecting dots outside the area of interest you can press 'm' to set the masking area. You get no live feedback
about where you clicked, but the overlay in the top tells you what point to set next.

Keys
-----
* ESC - close the program
* t - recalibrate the transformation area (right click to skip point)
* m - recalibrate the mask area (right click to skip point)
* f - flip the image horizontally
* v - flip the image vertically
* s - stop updating the image
* n - cycle noice reduction mode
* w - toggle showing of warped area

Noice reduction
---------------

There are currently three types of noice reduction. They appear in order
* None - No noice reduction is done at all
* Erode - Kind of a floor for pixels. Small areas of matching color are removed
* Delite - Kind of a ceil for pixels. Small areas of matching color are enlarged


Install instructions
====================
make
./dotdetector [server ip] [server port]

On rasberry pi
-------------

* apt-get install git
* git clone (https://github.com/FireArrow/MultiDuckhunt.git)
* download and install opencv. instructions at http://opencv.willowgarage.com/wiki/InstallGuide%20%3A%20Debian (Note: this takes ages!)
* cd MultiDuckhunt/dotdetector
* make

