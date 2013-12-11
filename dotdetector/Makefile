all:
	gcc main.c -O3 -o dotdetector `pkg-config --libs --cflags opencv`

debug:
	gcc main.c -o dotdetector -g -DPROFILING `pkg-config --libs --cflags opencv`
