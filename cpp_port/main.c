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

// Most functions in OpenCV uses BGR-A for some reason, so that's how these are defined
#define RED 0, 0, 255, 0
#define GREEN 0, 255, 0, 0
#define BLUE 255, 0, 0, 0
#define WHITE 255, 255, 255, 0

#define DEFAULT_SERVER_ADDRESS "127.0.0.1"
#define DEFAULT_SERVER_PORT 10001

// States
#define GRAB_DOTS 1
#define SELECT_MASK 2
#define SELECT_TRANSFORM 3

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

typedef struct BoundingBox {
    CvPoint topLeft;
    CvPoint topRight;
    CvPoint bottomRight;
    CvPoint bottomLeft;
} BoundingBox;

typedef struct ClickParams {
    int currentPoint;
    struct BoundingBox * DD_box;
} ClickParams;

static char state = GRAB_DOTS;

// The definition of a single element in the send queue
typedef struct SendQueue {
    float point[2]; // x and y
    struct SendQueue *next;
} SendQueue;

// Starts up the network part
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

// Sets up the send queue
SendQueue *initSendQueue() {
    SendQueue *q = malloc(sizeof(SendQueue));
    q->next = NULL;
    return q;
}

// Adds a single point to the send queue
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

// Sends the send queue over the network in text format "x.xx,y.yy x.xx,y.yy"
// Sends "ndd" if there are no dots detected
void sendQueue(int sockfd, SendQueue *q)
{
    static char sentEmpty = 0;
    int ret, len = 0;
    char buf[10240];
    buf[0] = '\0';

    // Skip first entry
    q = q->next;
    while (q != NULL) { //TODO buffer overflow here? segfaults when sending very many dots
        ret = snprintf(&buf[len], sizeof(buf) - strlen(buf), "%.2f,%.2f ", q->point[0], q->point[1]);
        if (ret < 0) {
            printf("Foo\n");
            break;
        }
        len += ret;

        q = q->next;
    }
    if(len > 0) {
        buf[--len] = '\0'; //Remove the trailing space

        // Resetting empty queue counter (see below for explanation)
        sentEmpty = 0;

        //	printf("Sending: \"%s\"\n", buf);
        send(sockfd, buf, len, 0);
    }
    else {
        if( sentEmpty < 5 ) {

            // We keep track of how many times (in a row) we have sent an empty queue.
            // We do this so that we don't keep sending 'ndd' forever, but we still want
            // to send it a few times (we are using UDP after all)
            sentEmpty++; 

            //If no dots are detected we send "ndd", No Dots Detected. Sending "" didn't seem to work.
            buf[0] = 'n';
            buf[1] = 'd';
            buf[2] = 'd';
            buf[3] = '\0';
            len = 3;

            //	printf("Sending: \"%s\"\n", buf);
            send(sockfd, buf, len, 0);
        }
    }
}

// Removes all elements from the send queue, freeing up the memory allocated to them
// Will not destroy the actual queue. New elements can still be added after running this
void clearSendQueue(SendQueue *q) {
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

// Destroys the send queue, freeing up all memory allocated to it.
// Not to be confused with clearSendQueue()
void destroySendQueue(SendQueue *q) {
    clearSendQueue(q);
    free(q);
}

// Draws a circle on the specified x,y with specified radius on target image
void drawCircle(int x, int y, int radius, IplImage *target) {
    CvPoint center = { x, y };

    cvCircle(target, center, 2, cvScalar( GREEN ), -1, 8, 0);
    cvCircle(target, center, radius, cvScalar( BLUE ), 1, 8, 0);
}

/* Return 1 if the difference is negative, otherwise 0.  */
int timeval_subtract(struct timeval *result, struct timeval *t2, struct timeval *t1) {
    long int diff = (t2->tv_usec + 1000000 * t2->tv_sec) - (t1->tv_usec + 1000000 * t1->tv_sec);
    result->tv_sec = diff / 1000000;
    result->tv_usec = diff % 1000000;

    return (diff<0);
}

// The callback function for a click while in calibration mode
// Sets the state to GRAB_DOTS after the last point is calibrated
void calibrateClick(int event, int x, int y, int flags, void* param) {
    ClickParams * clickParams = (ClickParams*) param;
    int* currentCalibrationPoint = (int*) &clickParams->currentPoint;
    BoundingBox* DD_box = (BoundingBox *) clickParams->DD_box;

    if(state == SELECT_MASK || state == SELECT_TRANSFORM) { //State is zero when finding dots
        if(event == CV_EVENT_LBUTTONDOWN) {
            if(*currentCalibrationPoint <= BOTTOM_LEFT) { // This should be a unneccessary clause

                printf("Calibrating mask point %d\n", *currentCalibrationPoint);
                CvPoint p = { x, y };
                switch(*currentCalibrationPoint) {
                    case TOP_LEFT:      DD_box->topLeft      = p; break;
                    case TOP_RIGHT:     DD_box->topRight     = p; break;
                    case BOTTOM_RIGHT:  DD_box->bottomRight  = p; break;
                    case BOTTOM_LEFT:   DD_box->bottomLeft   = p; break;
                }
                ++(*currentCalibrationPoint);
            }
        }
        else if(event == CV_EVENT_RBUTTONDOWN) { //Allow skipping already well calibrated points
            ++(*currentCalibrationPoint);
        }
        if(*currentCalibrationPoint > BOTTOM_LEFT) {
            state = GRAB_DOTS;
        }
    }
}

// Paints the edges of the calibration area
void paintOverlayPoints(IplImage* grabbedImage, BoundingBox* DD_box) {
    cvCircle(grabbedImage, DD_box->topLeft, 2, cvScalar(BLUE), -1, 8, 0); 
    cvLine(grabbedImage, DD_box->topLeft, DD_box->topRight, cvScalar(GREEN), 1, 8, 0);
    cvCircle(grabbedImage, DD_box->topRight, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_box->topRight, DD_box->bottomRight, cvScalar(GREEN), 1, 8, 0);
    cvCircle(grabbedImage, DD_box->bottomLeft, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_box->bottomRight, DD_box->bottomLeft, cvScalar(GREEN), 1, 8, 0);
    cvCircle(grabbedImage, DD_box->bottomRight, 2, cvScalar(BLUE), -1, 8, 0);
    cvLine(grabbedImage, DD_box->bottomLeft, DD_box->topLeft, cvScalar(GREEN), 1, 8, 0);
}

// Runs the dot detector and sends detected dots to server on port TODO Implement headless. Needs more config options of possibly a config file first though
int run(const char *serverAddress, const int serverPort, char headless) {
    int i, sockfd, show = ~0, flip = 0, vflip = 0, noiceReduction = 0, done = 0;
    int dp = 0, minDist = 29, param1 = 0, param2 = 5, minRadius = 2, maxRadius = 20; // Configuration variables for circle detection 
    int minDotRadius = 1;
    int frames = 0, detected_dots;
    int returnValue = EXIT_SUCCESS;
    Color min = {240, 180, 180, 0};
    Color max = {255, 255, 255, 0};
    BoundingBox DD_mask;
    BoundingBox DD_transform;
    CvCapture *capture;
    CvMemStorage *storage;
    IplImage *grabbedImage = NULL;
    IplImage *imgThreshold = NULL;
    IplImage *mask = NULL;
    IplImage *coloredMask = NULL;
    CvSeq *seq;
    CvFont font;
    SendQueue *queue;
    char strbuf[255];
    struct timeval oldTime, time, diff;
    float lastKnownFPS = 0;
    ClickParams clickParams = { TOP_LEFT, NULL };
//    int currentCalibrationPoint = TOP_LEFT;

    sockfd = initNetwork(serverAddress, serverPort);
    if (sockfd == -1) {
        fprintf(stderr, "ERROR: initNetwork returned -1\n");
        return EXIT_FAILURE;
    }
    queue = initSendQueue();

//  Capture from the highest connected device number. This is a really
//  bad solution, but it'll have to do for now. TODO Make this better
    for( i = 0; i < 5; ++i ) {
        capture = cvCaptureFromCAM(i);    
        if (capture != NULL) {
            break;
        }
    }
    if (capture == NULL) {
        fprintf( stderr, "ERROR: capture is NULL \n" );
        return EXIT_FAILURE;
    }

    // Create a window in which the captured images will be presented
    cvNamedWindow("imagewindow", CV_WINDOW_AUTOSIZE | CV_WINDOW_KEEPRATIO | CV_GUI_NORMAL );

    // Create a window to hold the configuration sliders and the detection frame TODO This is kind of a hack. Make a better solution
    cvNamedWindow("configwindow", CV_WINDOW_AUTOSIZE | CV_WINDOW_KEEPRATIO | CV_GUI_NORMAL);

    // Create sliders to adjust the lower color boundry
    cvCreateTrackbar("Red",     "configwindow", &min.red,   255,    NULL);
    cvCreateTrackbar("Green",   "configwindow", &min.green, 255,    NULL);
    cvCreateTrackbar("Blue",    "configwindow", &min.blue,  255,    NULL);

    //Create sliters for the contour based dot detection
    cvCreateTrackbar("Min area","configwindow", &minDotRadius,255,    NULL);

    //Create the memory storage
    storage = cvCreateMemStorage(0);

    // void cvInitFont(font, font_face, hscale, vscale, shear=0, thickness=1, line_type=8 )
    cvInitFont(&font, CV_FONT_HERSHEY_PLAIN, 1, 1, 0, 1, 8);

    // Grab an initial image to be able to fetch image size before the main loop.
    grabbedImage = cvQueryFrame(capture);

    //Move the two windows so both are visible at the same time
    cvMoveWindow("imagewindow", 0, 0);
    cvMoveWindow("configwindow", grabbedImage->width+2, 0);

    // Set masking defaults TODO load from file? Specify file for this file loading?
    DD_mask.topLeft.x = 0;  
    DD_mask.topLeft.y = 0;

    DD_mask.topRight.x = grabbedImage->width-1;
    DD_mask.topRight.y = 0;

    DD_mask.bottomLeft.x = 0;
    DD_mask.bottomLeft.y = grabbedImage->height-1;

    DD_mask.bottomRight.x = grabbedImage->width-1;
    DD_mask.bottomRight.y = grabbedImage->height-1;

    // Set transformation defaults TODO load from file? Specify file for this file loading?
    DD_transform.topLeft.x = 0;  
    DD_transform.topLeft.y = 0;

    DD_transform.topRight.x = grabbedImage->width-1;
    DD_transform.topRight.y = 0;

    DD_transform.bottomLeft.x = 0;
    DD_transform.bottomLeft.y = grabbedImage->height-1;

    DD_transform.bottomRight.x = grabbedImage->width-1;
    DD_transform.bottomRight.y = grabbedImage->height-1;

    // Set callback function for mouse clicks
    cvSetMouseCallback("imagewindow", calibrateClick, (void*) &clickParams );

    gettimeofday(&oldTime, NULL);
    
    // Show the image captured from the camera in the window and repeat
    while (!done) {

//PROFILING_PRO_STAMP(); //Uncomment this and the one in the end of the while-loop, and comment all other PROFILING_* to profile main-loop

        // ------ Common actions
        cvClearMemStorage(storage);
        detected_dots = 0;

        PROFILING_PRO_STAMP();

        //Grab a fram from the camera
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
        if(show && vflip) {
            cvFlip(grabbedImage, grabbedImage, 0);
        }

        // ------ State based actions
        switch(state) {
            case GRAB_DOTS:

                //Create detection image
                imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
                cvInRangeS(grabbedImage, cvScalar(DD_COLOR(min)), cvScalar(DD_COLOR(max)), imgThreshold);

                //Mask away anything not in our calibration area
                mask = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
                cvZero(mask);
                cvFillConvexPoly(mask, (CvPoint*) &DD_mask, 4, cvScalar(WHITE), 1, 0);
                cvAnd(imgThreshold, mask, imgThreshold, NULL);

                cvNot(mask, mask);
                coloredMask = cvCreateImage(cvGetSize(grabbedImage), grabbedImage->depth, grabbedImage->nChannels );
                cvCvtColor(mask, coloredMask, CV_GRAY2BGR);
                cvAddWeighted(grabbedImage, 0.95, coloredMask, 0.05, 0.0, grabbedImage);


                // Reduce noise. 
                // Erode is kind of floor() of pixels, dilate is kind of ceil()
                // I'm not sure which gives the best result.
                switch(noiceReduction) {
                    case 0: break; //No noice reduction at all
                    case 1: cvErode(imgThreshold, imgThreshold, NULL, 2); break;
                    case 2: cvDilate(imgThreshold, imgThreshold, NULL, 2); break;
                }

                //Find all dots in the image. This is where any calibration of dot detection is done, if needed, though it
                //should be fine as it is right now.
                PROFILING_PRO_STAMP();

                seq = 0;
                cvFindContours( imgThreshold, storage, &seq, sizeof(CvContour), CV_RETR_LIST, CV_CHAIN_APPROX_SIMPLE, cvPoint(0,0) );
                cvZero(imgThreshold);

                PROFILING_POST_STAMP("Dot detection");

                PROFILING_PRO_STAMP();

                //Process all detected dots
                for( ; seq != 0; seq = seq->h_next ) {

                    CvRect rect = ((CvContour *)seq)->rect;
                    float relCenterX = rect.width / 2;
                    float relCenterY = rect.height / 2;

                    //Make sure the dot is big enough
                    if(relCenterX < minDotRadius || relCenterY < minDotRadius) {
                        continue;
                    }

                    CvScalar color = cvScalar( WHITE );
                    cvDrawContours( imgThreshold, seq, color, color, -1, CV_FILLED, 8, cvPoint(0,0));

                    float absCenter[] = { rect.x + relCenterX, rect.y + relCenterY };

                    ++detected_dots;

                    if(show) drawCircle( absCenter[0], absCenter[1], (relCenterX + relCenterY) / 2, grabbedImage);
                    
                    // Add detected points (if any) to to send queue
                    addPointToSendQueue( absCenter, queue ); 
                }

                PROFILING_POST_STAMP("Painting dots");

                //Calculate framerate
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


            case SELECT_MASK:

                //One day we might do something here
                break; //End of SELECT_MASK
        }

        // Paint the corners of the detecting area and the calibration area
        paintOverlayPoints(grabbedImage, &DD_transform);

        //Print some statistics to the image
        if (show) {
            snprintf(strbuf, sizeof(strbuf), "Dots: %i", detected_dots); //Print number of detected dots to the screen
            cvPutText(grabbedImage, strbuf, cvPoint(10, 20), &font, cvScalar(WHITE));
            snprintf(strbuf, sizeof(strbuf), "FPS: %.1f", lastKnownFPS);
            cvPutText(grabbedImage, strbuf, cvPoint(10, 40), &font, cvScalar(WHITE));
            cvCircle(grabbedImage, cvPoint(15, 55), minDotRadius, cvScalar(min.blue, min.green, min.red, min.alpha), -1, 8, 0); // Colors given in order BGR-A, Blue, Green, Red, Alpha
        }

        //Show images 
        if (show) {
            cvShowImage("configwindow", imgThreshold);
            cvShowImage("imagewindow", grabbedImage);
        }

        //Release the temporary images
        cvReleaseImage(&imgThreshold);
        cvReleaseImage(&mask);
        cvReleaseImage(&coloredMask);

        //Add one to the frame rate counter
        frames++;

        //If ESC key pressed, Key=0x10001B under OpenCV 0.9.7(linux version),
        //remove higher bits using AND operator
        i = (cvWaitKey(10) & 0xff);
        switch(i) {
            case 'v': show = ~show; break; //Toggles updating of the image. Can be useful for performance of slower machines... Or as frame freeze
            case 'm': state = SELECT_MASK; clickParams.currentPoint = TOP_LEFT; clickParams.DD_box = &DD_mask; break; //Starts selection of masking area. Will return to dot detection once all four points are set
            case 't': state = SELECT_TRANSFORM; clickParams.currentPoint = TOP_LEFT; clickParams.DD_box = &DD_transform; break;
            case 'f': flip = ~flip; break; //Toggles horizontal flipping of the image
            case 'g': vflip = ~vflip; break; //Toggles vertical flipping of the image
            case 'n': noiceReduction = (noiceReduction + 1) % 3; break; //Cycles noice reduction algorithm
            case  27: done = 1; break; //ESC. Kills the whole thing (in a nice and controlled manner)
        }

//PROFILING_POST_STAMP("Main loop");
    } //End of main while-loop

    // Release the capture device and do some housekeeping
    cvReleaseImage(&grabbedImage);
    cvReleaseCapture( &capture );
    cvReleaseMemStorage( &storage );
    cvDestroyWindow( "imagewindow" );
    cvDestroyWindow( "configwindow" );
    destroySendQueue(queue);
    close(sockfd);
    return returnValue;
}

int main(int argc, char **argv) {
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

