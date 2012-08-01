package se.insektionen.cosmonova;
import static com.googlecode.javacv.cpp.opencv_core.CV_AA;
import static com.googlecode.javacv.cpp.opencv_core.cvClearMemStorage;
import static com.googlecode.javacv.cpp.opencv_core.cvDrawContours;
import static com.googlecode.javacv.cpp.opencv_core.cvFillConvexPoly;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSeqElem;
import static com.googlecode.javacv.cpp.opencv_core.cvLoad;
import static com.googlecode.javacv.cpp.opencv_core.cvPoint;
import static com.googlecode.javacv.cpp.opencv_core.cvRectangle;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSize;

import com.googlecode.javacpp.FloatPointer;
import com.googlecode.javacpp.Loader;
import com.googlecode.javacv.*;
import com.googlecode.javacv.FrameGrabber.Exception;
import com.googlecode.javacv.cpp.*;
import com.googlecode.javacv.cpp.opencv_core.CvContour;
import com.googlecode.javacv.cpp.opencv_core.CvMemStorage;
import com.googlecode.javacv.cpp.opencv_core.CvRect;
import com.googlecode.javacv.cpp.opencv_core.CvScalar;
import com.googlecode.javacv.cpp.opencv_core.CvSeq;
import com.googlecode.javacv.cpp.opencv_core.IplImage;

import static com.googlecode.javacv.cpp.opencv_core.*;
import static com.googlecode.javacv.cpp.opencv_imgproc.*;
import static com.googlecode.javacv.cpp.opencv_calib3d.*;
import static com.googlecode.javacv.cpp.opencv_objdetect.*;
import com.googlecode.javacv.cpp.opencv_core.IplImage;

public class Circles {
	public Circles() throws Exception {

		FrameGrabber grabber = new OpenCVFrameGrabber(0);
		grabber.setGamma(1);
		grabber.start();

		CanvasFrame frame = new CanvasFrame("Real image", 1);

		IplImage img = grabber.grab();


		IplImage gray;


		CvMemStorage circles = CvMemStorage.create();

		while (frame.isVisible() && (img = grabber.grab()) != null) {
			cvClearMemStorage(circles);

			gray = cvCreateImage( cvSize( img.width(), img.height() ), IPL_DEPTH_8U, 1 );
			cvCvtColor( img, gray, CV_RGB2GRAY );
			// smooth it, otherwise a lot of false circles may be detected
			cvSmooth(gray,gray,CV_GAUSSIAN,9,9,2,2);
			
			CvSeq seq = cvHoughCircles(gray, circles, CV_HOUGH_GRADIENT, 1, img.height()/4, 100, 100, 0, 50);
			
			for(int i=0; i<seq.total(); i++){
				FloatPointer point = new FloatPointer(cvGetSeqElem(seq, i));    

				CvPoint center = new CvPoint(Math.round(point.get(0)), Math.round(point.get(1)));

				int radius = Math.round(point.get(2));
				cvCircle(img, center, 2, CvScalar.GREEN, -1, 8, 0);
				cvCircle(img, center, radius, CvScalar.BLUE, 3, 8, 0);
			}
			
			frame.showImage(img);
		}
		
		//Clean up
		frame.dispose();
		grabber.stop();
	}
	
	public static void main(String[] args) throws Exception {
		new Circles();
	}
}
