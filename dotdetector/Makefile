all:
	gcc main.c -o dotdetector -I/usr/include/opencv/ `pkg-config --libs --cflags opencv`

debug:
	gcc main.c -o dotdetector -g -DPROFILING -I/usr/include/opencv/ `pkg-config --libs --cflags opencv`
