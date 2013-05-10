#include <cv.h> 
#include <highgui.h> 
#include <stdio.h>  
#include <string.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <netinet/in.h>

#define RED 255, 0, 0, 0
#define GREEN 0, 255, 0, 0
#define BLUE 0, 0, 255, 0
#define WHITE 255, 255, 255, 0

#define DEFAULT_SERVER_ADDRESS "127.0.0.1"
#define DEFAULT_SERVER_PORT 10001

//Flags
#define GRAB_DOTS 1
#define CALIBRATE 2

//Colors given in order BGR-A, Blue, Green, Red, Alpha
const CvScalar min = {120, 255, 120, 0};
const CvScalar max = {255, 255, 255, 0};

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
    while (q != NULL) {
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


void calibrateClick(int event, int x, int y, int flags, void* param) {

}

int run(const char *serverAddress, const int serverPort, char headless)
{
    int i, sockfd, show = ~0;
    int frames = 0;
    int returnValue = EXIT_SUCCESS;
    CvCapture *capture;
    CvMemStorage *storage;
    IplImage *grabbedImage;
    IplImage *imgThreshold;
    CvSeq *seq;
    CvFont font;
    SendQueue *queue;
    char strbuf[255];
    struct timeval oldTime, time, diff;
    float lastKnownFPS = 0;
    char state = GRAB_DOTS;

    sockfd = initNetwork(serverAddress, serverPort);
    if (sockfd == -1) {
        fprintf(stderr, "ERROR: initNetwork returned -1\n");
        return EXIT_FAILURE;
    }
    queue = initSendQueue();

    capture = cvCaptureFromCAM(CV_CAP_ANY);
    if (capture == NULL) {
        fprintf( stderr, "ERROR: capture is NULL \n" );
        getchar();
        return EXIT_FAILURE;
    }

    // Create a window in which the captured images will be presented
    cvNamedWindow("mywindow", CV_WINDOW_AUTOSIZE);

    storage = cvCreateMemStorage(0);

    // void cvInitFont(font, font_face, hscale, vscale, shear=0, thickness=1, line_type=8 )
    cvInitFont(&font, CV_FONT_HERSHEY_PLAIN, 1, 1, 0, 1, 8);

    gettimeofday(&oldTime, NULL);
    // Show the image captured from the camera in the window and repeat
    while (1) {

        // ------ Common actions
        cvClearMemStorage(storage);

        grabbedImage = cvQueryFrame(capture);
        if (grabbedImage == NULL) {
            fprintf( stderr, "ERROR: frame is null...\n" );
            getchar();
            returnValue = EXIT_FAILURE;
            break;
        }

        switch(state) {
            case GRAB_DOTS:
                //Create detection image
                imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
                cvInRangeS(grabbedImage, min, max, imgThreshold);

                //Flip images to act as a mirror. 
                //TODO remove when camera faces screen
                if (show) {
                    cvFlip(grabbedImage, grabbedImage, 1);
                    cvFlip(imgThreshold, imgThreshold, 1);
                }

                //Find all dots in the image. This is where any calibration of dot detection is done, if needed, though it
                //should be fine as it is right now.
                /*
                 * image, circleStorage, method, double dp,	double minDist,	double param1, double param2, int minRadius, int maxRadius
                 */
                seq = cvHoughCircles(imgThreshold, storage, CV_HOUGH_GRADIENT, 2, 20, 20, 2, 0, 10);

                for (i = 0; i < seq->total; i++){
                    // Get point
                    float *p = (float*)cvGetSeqElem(seq, i);

                    //Draw current circle to the original image
                    if (show) paintCircle(p, grabbedImage);

                    //Buffer current circle to be sent to the server
                    addPointToSendQueue(p, queue);
                }

                //Print some statistics to the image
                if (show) {
                    snprintf(strbuf, sizeof(strbuf), "Dots: %i", seq->total);
                    cvPutText(grabbedImage, strbuf, cvPoint(10, 20), &font, cvScalar(WHITE));
                    snprintf(strbuf, sizeof(strbuf), "FPS: %.1f", lastKnownFPS);
                    cvPutText(grabbedImage, strbuf, cvPoint(10, 200), &font, cvScalar(WHITE));
                }

                //Show images 
                //TODO Comment these out will probably improve performance quite a bit
                if (show) {
                    cvShowImage("mywindow", imgThreshold);
                    cvShowImage("mywindow", grabbedImage);
                }

                gettimeofday(&time, NULL);
                timeval_subtract(&diff, &time, &oldTime);
                //		printf("Frames = %i\n", diff.tv_sec);
                if (diff.tv_sec >= 2) {
                    lastKnownFPS = (float)frames / diff.tv_sec;
                    oldTime = time;
                    frames = 0;
                }

                //Send to dots detected this frame to the server
                sendQueue(sockfd, queue);
                clearSendQueue(queue);
                break; //End of GRAB_DOTS


            case CALIBRATE:

                break; //End of CALIBRATE
            }
                //Add one to the frame rate counter
                frames++;
                //If ESC key pressed, Key=0x10001B under OpenCV 0.9.7(linux version),
                //remove higher bits using AND operator
                i = (cvWaitKey(10) & 0xff);
                if (i == 'v') show = ~show;
                if (i == 27) break;
        } //End of main while-loop

        // Release the capture device housekeeping
        cvReleaseCapture( &capture );
        cvDestroyWindow( "mywindow" );
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

