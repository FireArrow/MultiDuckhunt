package se.insektionen.cosmonova;

import static com.googlecode.javacv.cpp.opencv_core.CV_AA;
import static com.googlecode.javacv.cpp.opencv_core.cvCircle;
import static com.googlecode.javacv.cpp.opencv_core.cvClearMemStorage;
import static com.googlecode.javacv.cpp.opencv_core.cvDrawContours;
import static com.googlecode.javacv.cpp.opencv_core.cvFillConvexPoly;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSeqElem;
import static com.googlecode.javacv.cpp.opencv_core.cvLoad;
import static com.googlecode.javacv.cpp.opencv_core.cvPoint;
import static com.googlecode.javacv.cpp.opencv_core.cvRectangle;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSize;

import java.net.DatagramSocket;
import java.net.SocketException;
import java.sql.Time;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicInteger;

import com.googlecode.javacpp.FloatPointer;
import com.googlecode.javacpp.Loader;
import com.googlecode.javacv.*;
import com.googlecode.javacv.FrameGrabber.Exception;
import com.googlecode.javacv.cpp.*;
import com.googlecode.javacv.cpp.opencv_core.CvContour;
import com.googlecode.javacv.cpp.opencv_core.CvMemStorage;
import com.googlecode.javacv.cpp.opencv_core.CvPoint;
import com.googlecode.javacv.cpp.opencv_core.CvRect;
import com.googlecode.javacv.cpp.opencv_core.CvScalar;
import com.googlecode.javacv.cpp.opencv_core.CvSeq;
import com.googlecode.javacv.cpp.opencv_core.IplImage;

import static com.googlecode.javacv.cpp.opencv_core.*;
import static com.googlecode.javacv.cpp.opencv_imgproc.*;
import static com.googlecode.javacv.cpp.opencv_calib3d.*;
import static com.googlecode.javacv.cpp.opencv_objdetect.*;

//Förkortning för Cosmonova Invaders - Shoot Them All
public class CISTA {
	
	//Colors given in order BGR-A, Blue, Green, Red, Alpha
	private static CvScalar min = cvScalar(255, 255, 255, 0);
	private static CvScalar max = cvScalar(255, 255, 255, 0);
	
	private AtomicInteger frames = new AtomicInteger(0);
	private class FPSCounter extends TimerTask {

		@Override
		public void run() {
			System.out.println(frames.get());
			frames.set(0);
		}
	}

	public CISTA() throws Exception, SocketException {
		
		DatagramSocket socket = new DatagramSocket();
		
		Timer t = new Timer();
		t.schedule(new FPSCounter(), 1000, 1000);
		
		// Preload the opencv_objdetect module to work around a known bug.
		Loader.load(opencv_objdetect.class);
		
		

		// The available FrameGrabber classes include OpenCVFrameGrabber (opencv_highgui),
		// DC1394FrameGrabber, FlyCaptureFrameGrabber, OpenKinectFrameGrabber,
		// PS3EyeFrameGrabber, VideoInputFrameGrabber, and FFmpegFrameGrabber.
		FrameGrabber grabber = new OpenCVFrameGrabber(0);
		grabber.setGamma(1);
		grabber.start();
		
		CanvasFrame realframe = new CanvasFrame("Real image", 1);
		CanvasFrame detectframe = new CanvasFrame("Fixed image", 1);

		// Objects allocated with a create*() or clone() factory method are automatically released
		// by the garbage collector, but may still be explicitly released by calling release().
		// You shall NOT call cvReleaseImage(), cvReleaseMemStorage(), etc. on objects allocated this way.
		CvMemStorage storage = CvMemStorage.create();
		
		//Create initial images
		IplImage grabbedImage = grabber.grab();
		IplImage imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
		
		while (realframe.isVisible() && detectframe.isVisible() && (grabbedImage = grabber.grab()) != null) {
			cvClearMemStorage(storage);
			
			//Create detection image
			imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
			cvInRangeS(grabbedImage, min, max, imgThreshold);

			//Flip images to act as a mirror. TODO remove when camera faces screen
			cvFlip(grabbedImage, grabbedImage, 1);
			cvFlip(imgThreshold, imgThreshold, 1);
			
			CvSeq seq = cvHoughCircles(imgThreshold, storage, CV_HOUGH_GRADIENT, 2, 20, 20, 5, 3, 10);
			
			for(int i=0; i<seq.total(); i++){
				
				FloatPointer point = new FloatPointer(cvGetSeqElem(seq, i));
				
				//Rita cirkeln på bilden
				paintCircle(point, grabbedImage);
				
				//Skicka koordinaten till server
				float[] points = { point.get(0), point.get(1) };
			}
//			cvSmooth(imgThreshold,imgThreshold,CV_GAUSSIAN,9,9,2,2);
			
			//Show images
			detectframe.showImage(imgThreshold);
			realframe.showImage(grabbedImage);
			frames.incrementAndGet();
		}
		
		t.cancel();
		
		//Clean up
		detectframe.dispose();
		realframe.dispose();
		grabber.stop();
	}
	
	private void paintCircle(FloatPointer point, IplImage target) {
			
			CvPoint center = new CvPoint(Math.round(point.get(0)), Math.round(point.get(1)));

			int radius = Math.round(point.get(2));
			cvCircle(target, center, 2, CvScalar.GREEN, -1, 8, 0);
			cvCircle(target, center, radius, CvScalar.BLUE, 1, 8, 0);
	}
	
	public static void main(String[] args) throws Exception, SocketException {
		new CISTA();
	}
}
