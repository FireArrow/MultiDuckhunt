all:
	gcc main.c -o main -I/usr/include/opencv/ `pkg-config --libs --cflags opencv`

debug:
	gcc main.c -o main -g -DPROFILING -I/usr/include/opencv/ `pkg-config --libs --cflags opencv`
