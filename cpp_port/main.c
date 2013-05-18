#include <cv.h> 
#include <highgui.h> 
#include <stdio.h>  
#include <string.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>
#include "profiling.h"

#define RED 255, 0, 0, 0
#define GREEN 0, 255, 0, 0
#define BLUE 0, 0, 255, 0
#define WHITE 255, 255, 255, 0

#define DEFAULT_SERVER_ADDRESS "127.0.0.1"
#define DEFAULT_SERVER_PORT 10001

// States
#define GRAB_DOTS 1
#define CALIBRATE 2

// Cornors of the calibrator
//
// 0 ------- 1
// |        /
// |       /
// 3 ---- 2

#define TOP_LEFT 0
#define TOP_RIGHT 1
#define BOTTOM_RIGHT 2
#define BOTTOM_LEFT 3

#define DD_COLOR(c) c.blue, c.green, c.red, c.alpha
// cvScalar, used to handle colors in OpenCV uses doules internally.
// This causes problems when using a slider to set the color as that
// wants the address to an int. Thus, we store colors in a struct of
// ints and use cvScalar() to create the scalars when needed.
struct color {
    int red;
    int green;
    int blue;
    int alpha;
};
typedef struct color Color;

struct {
    CvPoint topLeft;
    CvPoint topRight;
    CvPoint bottomRight;
    CvPoint bottomLeft;
} DD_calibration;

static char state = GRAB_DOTS;

typedef struct SendQueue {
    float point[2]; // x and y
    struct SendQueue *next;
} SendQueue;

int initNetwork(const char *serverAddress, const int serverPort)
{
    int sockfd;
    struct addrinfo hints, *servinfo, *p;
    int rv;
    int numbytes;
    char port[10];
    snprintf(port, sizeof(port), "%i", serverPort);

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_DGRAM;

    rv = getaddrinfo(serverAddress, port, &hints, &servinfo);
    if (rv != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return -1;
    }

    // loop through all the results and make a socket
    for(p = servinfo; p != NULL; p = p->ai_next) {
        sockfd = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
        if (sockfd == -1) {
            perror("socket");
            continue;
        }

        break;
    }

    if (p == NULL) {
        fprintf(stderr, "talker: failed to bind socket\n");
        return -1;
    }

    rv = connect(sockfd, p->ai_addr, p->ai_addrlen);
    if (rv == -1) {
        perror("connect");
        return -1;
    }

    freeaddrinfo(servinfo);
    return sockfd;
}

SendQueue *initSendQueue()
{
    SendQueue *q = malloc(sizeof(SendQueue));
    q->next = NULL;
    return q;
}

void addPointToSendQueue(const float p[2], SendQueue *q)
{
    SendQueue *newEntry = malloc(sizeof(SendQueue));
    newEntry->point[0] = p[0];
    newEntry->point[1] = p[1];
    newEntry->next = NULL;

    // Advance to last entry
    while (q->next != NULL) {
        q = q->next;
    }
    q->next = newEntry;
}

void sendQueue(int sockfd, SendQueue *q)
{
    int ret, len = 0;
    char buf[10240];
    buf[0] = '\0';

    // Skip first entry
    q = q->next;
    while (q != NULL) { //TODO buffer overflow here? segfaults when sending very many dots
        ret = snprintf(&buf[len], sizeof(buf) - strlen(buf), "%.2f,%f ", q->point[0], q->point[1]);
        if (ret < 0) {
            printf("Foo\n");
            break;
        }
        len += ret;

        q = q->next;
    }
    //	printf("Sending: \"%s\"\n", buf);
    send(sockfd, buf, len, 0);
}

void clearSendQueue(SendQueue *q)
{
    SendQueue *toBeFreed;
    SendQueue *first = q;

    // Skip first entry
    q = q->next;
    while (q != NULL) {
        toBeFreed = q;
        q = q->next;
        free(toBeFreed);
    }
    first->next = NULL;
}

void destroySendQueue(SendQueue *q)
{
    clearSendQueue(q);
    free(q);
}

void paintCircle(const float *p, IplImage *target)
{
    CvPoint center = {cvRound(p[0]), cvRound(p[1]) };
    int radius = cvRound(p[2]);

    cvCircle(target, center, 2, cvScalar(GREEN), -1, 8, 0);
    cvCircle(target, center, radius, cvScalar(BLUE), 1, 8, 0);
}

/* Return 1 if the difference is negative, otherwise 0.  */
int timeval_subtract(struct timeval *result, struct timeval *t2, struct timeval *t1)
{
    long int diff = (t2->tv_usec + 1000000 * t2->tv_sec) - (t1->tv_usec + 1000000 * t1->tv_sec);
    result->tv_sec = diff / 1000000;
    result->tv_usec = diff % 1000000;

    return (diff<0);
}


void calibrateClick(int event, int x, int y, int flags, void* param) 
{
    int* currentCalibrationPoint = (int *) param;
    if(state == CALIBRATE) {
        if(event == CV_EVENT_LBUTTONDOWN) {
            if(*currentCalibrationPoint <= BOTTOM_LEFT) { // This should be a unneccessaru clause

                printf("Calibrating point %d\n", *currentCalibrationPoint);
                CvPoint p = { x, y };
                switch(*currentCalibrationPoint) {
                    case TOP_LEFT:      DD_calibration.topLeft      = p; break;
                    case TOP_RIGHT:     DD_calibration.topRight     = p; break;
                    case BOTTOM_RIGHT:  DD_calibration.bottomRight  = p; break;
                    case BOTTOM_LEFT:   DD_calibration.bottomLeft   = p; break;
                }
                ++(*currentCalibrationPoint);
                if(*currentCalibrationPoint > BOTTOM_LEFT) {
                    state = GRAB_DOTS;
                }
            }
        }
    }
}

void paintCalibrationPoints(IplImage* grabbedImage) {
    cvCircle(grabbedImage, DD_calibration.topLeft, 2, cvScalar(BLUE), -1, 8, 0); //BLUE gives red, don't argue :S
    cvLine(grabbedImage, DD_calibration.topLeft, DD_calibration.topRight, cvScalar(BLUE), 1, 8, 0);
    cvCircle(grabbedImage, DD_calibration.topRight, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_calibration.topRight, DD_calibration.bottomRight, cvScalar(BLUE), 1, 8, 0);
    cvCircle(grabbedImage, DD_calibration.bottomLeft, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_calibration.bottomRight, DD_calibration.bottomLeft, cvScalar(BLUE), 1, 8, 0);
    cvCircle(grabbedImage, DD_calibration.bottomRight, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_calibration.bottomLeft, DD_calibration.topLeft, cvScalar(BLUE), 1, 8, 0);
}


int run(const char *serverAddress, const int serverPort, char headless)
{
    int i, sockfd, show = ~0, flip = ~0;
    int dp = 0, minDist = 29, param1 = 0, param2 = 5, minRadius = 2, maxRadius = 20; // Configuration variables for circle detection 
    int frames = 0;
    int returnValue = EXIT_SUCCESS;
    Color min = {255, 120, 120, 0};
    Color max = {255, 255, 255, 0};
    CvCapture *capture;
    CvMemStorage *storage;
    IplImage *grabbedImage = NULL;
    IplImage *imgThreshold = NULL;
    IplImage *mask = NULL;
    CvSeq *seq;
    CvFont font;
    SendQueue *queue;
    char strbuf[255];
    struct timeval oldTime, time, diff;
    float lastKnownFPS = 0;
    int currentCalibrationPoint = TOP_LEFT;

    sockfd = initNetwork(serverAddress, serverPort);
    if (sockfd == -1) {
        fprintf(stderr, "ERROR: initNetwork returned -1\n");
        return EXIT_FAILURE;
    }
    queue = initSendQueue();

//    capture = cvCaptureFromCAM(CV_CAP_ANY);

//  Capture from the highest connected device number. This is a really
//  bad solution, but it'll have to do for now. TODO Make this better
    for( i = 5; i >= 0; --i ) {
        capture = cvCaptureFromCAM(i);    
        if (capture != NULL) {
            break;
        }
    }
    if (capture == NULL) {
        fprintf( stderr, "ERROR: capture is NULL \n" );
//        getchar();
        return EXIT_FAILURE;
    }

    // Create a window in which the captured images will be presented
    cvNamedWindow("imagewindow", CV_WINDOW_AUTOSIZE);

    // Create a window to hold the configuration sliders TODO This is kind of a hack. Make a better solution
    cvNamedWindow("configwindow", CV_WINDOW_AUTOSIZE);

    // Create sliders to adjust the lower color boundry, param 1 and 2 for the circle detector (whatever they do?)
    cvCreateTrackbar("Red",     "configwindow", &min.red,   255,    NULL);
    cvCreateTrackbar("Green",   "configwindow", &min.green, 255,    NULL);
    cvCreateTrackbar("Blue",    "configwindow", &min.blue,  255,    NULL);

    cvCreateTrackbar("DP",      "configwindow", &dp,        10,     NULL); // I have no idea what this parameter do =S
    cvCreateTrackbar("MinDist", "configwindow", &minDist,   100,    NULL);
    cvCreateTrackbar("Param1",  "configwindow", &param1,    50,     NULL); // Nor this...
    cvCreateTrackbar("Param2",  "configwindow", &param2,    50,     NULL); // nor this.
    cvCreateTrackbar("MinRad",  "configwindow", &minRadius, 100,    NULL);
    cvCreateTrackbar("MaxRad",  "configwindow", &maxRadius, 300,    NULL);

    storage = cvCreateMemStorage(0);

    // void cvInitFont(font, font_face, hscale, vscale, shear=0, thickness=1, line_type=8 )
    cvInitFont(&font, CV_FONT_HERSHEY_PLAIN, 1, 1, 0, 1, 8);

    // Grab an initial image to be able to fetch image size before the main loop.
    grabbedImage = cvQueryFrame(capture);

    // Set calibration defaults TODO load from file?
    DD_calibration.topLeft.x = 0;  
    DD_calibration.topLeft.y = 0;

    DD_calibration.topRight.x = grabbedImage->width-1;
    DD_calibration.topRight.y = 0;

    DD_calibration.bottomLeft.x = 0;
    DD_calibration.bottomLeft.y = grabbedImage->height-1;

    DD_calibration.bottomRight.x = grabbedImage->width-1;
    DD_calibration.bottomRight.y = grabbedImage->height-1;

    // Set callback function for mouse clicks
    cvSetMouseCallback("imagewindow", calibrateClick, (void*) &currentCalibrationPoint);

    gettimeofday(&oldTime, NULL);
    // Show the image captured from the camera in the window and repeat
    while (1) {
//PROFILING_PRO_STAMP(); //Uncomment this and comment all but the last PROFILING_* to profile main-loop

        // ------ Common actions
        cvClearMemStorage(storage);

        PROFILING_PRO_STAMP();
        grabbedImage = cvQueryFrame(capture);
        PROFILING_POST_STAMP("cvQueryFrame");
        if (grabbedImage == NULL) {
            fprintf( stderr, "ERROR: frame is null...\n" );
            getchar();
            returnValue = EXIT_FAILURE;
            break;
        }

        //Flip images to act as a mirror. 
        if (show && flip) {
            cvFlip(grabbedImage, grabbedImage, 1);
        }

        // ------ State based actions
        switch(state) {
            case GRAB_DOTS:

                //Create detection image
                imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
                cvInRangeS(grabbedImage, cvScalar(DD_COLOR(min)), cvScalar(DD_COLOR(max)), imgThreshold);

                mask = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
                cvZero(mask);
                cvFillConvexPoly(mask, (CvPoint*) &DD_calibration, 4, cvScalar(RED), 1, 0);
                cvAnd(imgThreshold, mask, imgThreshold, NULL);

                //Find all dots in the image. This is where any calibration of dot detection is done, if needed, though it
                //should be fine as it is right now.
                /*
                 * image, circleStorage, method, double dp,	double minDist,	double param1, double param2, int minRadius, int maxRadius
                 */
                
                PROFILING_PRO_STAMP();
                seq = cvHoughCircles(imgThreshold, storage, CV_HOUGH_GRADIENT, dp+1, minDist+1, param1+1, param2+1, minRadius, maxRadius);
                PROFILING_POST_STAMP("cvHoughCircles");

                PROFILING_PRO_STAMP();
                for (i = 0; i < seq->total; i++){
                    // Get point
                    float *p = (float*)cvGetSeqElem(seq, i);

                    //Draw current circle to the original image
                    if (show) paintCircle(p, grabbedImage);

                    //Buffer current circle to be sent to the server
                    addPointToSendQueue(p, queue);
                }
                PROFILING_POST_STAMP("Painting dots");

                gettimeofday(&time, NULL);
                timeval_subtract(&diff, &time, &oldTime);
                //		printf("Frames = %i\n", diff.tv_sec);
                if (diff.tv_sec >= 2) {
                    lastKnownFPS = (float)frames / diff.tv_sec;
                    oldTime = time;
                    frames = 0;
                }

                //Send to dots detected this frame to the server
                PROFILING_PRO_STAMP();
                sendQueue(sockfd, queue);
                clearSendQueue(queue);
                PROFILING_POST_STAMP("Sending dots");

                break; //End of GRAB_DOTS


            case CALIBRATE:

                //One day we might do something here

                break; //End of CALIBRATE
        }

        // Paint the corners of the detecting area
        paintCalibrationPoints(grabbedImage);

        //Print some statistics to the image
        if (show) {
            snprintf(strbuf, sizeof(strbuf), "Dots: %i", seq->total);
            cvPutText(grabbedImage, strbuf, cvPoint(10, 20), &font, cvScalar(WHITE));
            snprintf(strbuf, sizeof(strbuf), "FPS: %.1f", lastKnownFPS);
            cvPutText(grabbedImage, strbuf, cvPoint(10, 40), &font, cvScalar(WHITE));
            cvCircle(grabbedImage, cvPoint(15, 55), 5, cvScalar(min.blue, min.green, min.red, min.alpha), -1, 8, 0); // Colors given in order BGR-A, Blue, Green, Red, Alpha
        }

        //Show images 
        if (show) {
            //     cvShowImage("imagewindow", imgThreshold);
            cvShowImage("imagewindow", grabbedImage);
        }

        //Release the temporary images
        cvReleaseImage(&imgThreshold);
        cvReleaseImage(&mask);

        //Add one to the frame rate counter
        frames++;
        //If ESC key pressed, Key=0x10001B under OpenCV 0.9.7(linux version),
        //remove higher bits using AND operator
        i = (cvWaitKey(10) & 0xff);
        if (i == 'v') show = ~show;
        if (i == 'r') { state = CALIBRATE; currentCalibrationPoint = TOP_LEFT; }
        if (i == 'f') flip = ~flip;
        if (i == 27) break;

//PROFILING_POST_STAMP("Main loop");
    } //End of main while-loop

    // Release the capture device housekeeping
    cvReleaseImage(&grabbedImage);
    cvReleaseCapture( &capture );
    cvReleaseMemStorage( &storage );
    cvDestroyWindow( "imagewindow" );
    destroySendQueue(queue);
    close(sockfd);
    return returnValue;
}

int main(int argc, char **argv)
{
    int ret;
    long int serverPort = DEFAULT_SERVER_PORT;
    char *serverAddress = NULL;
    switch(argc) {
        case 3: 
            serverPort = strtol(argv[2], NULL, 10);
            if (serverPort >= 65535 || serverPort <= 1024) {
                printf("Invalid port number! Using %i\n", DEFAULT_SERVER_PORT);
                serverPort = DEFAULT_SERVER_PORT;
            }
        case 2:
            serverAddress = strdup(argv[1]);
        default:
            if (serverAddress == NULL) {
                printf("Invalid hostname! Using %s\n", DEFAULT_SERVER_ADDRESS);
                serverAddress = strdup(DEFAULT_SERVER_ADDRESS);
            }
    }
    printf("Server address: %s\n", serverAddress);
    printf("Server port: %d\n", (int)serverPort);

    ret = run(serverAddress, serverPort, 1);
    free(serverAddress);
    return ret;
}

