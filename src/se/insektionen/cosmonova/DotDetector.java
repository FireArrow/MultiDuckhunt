package se.insektionen.cosmonova;


//Primär klass för att läsa av bilder från en webkamera. 
//Den är beroende av att man har JavaCV: http://code.google.com/p/javacv/
//som i sin tur är beroende av OpenCV. Läs mer om, och hitta länkar till det, på http://code.google.com/p/javacv/wiki/Windows7AndOpenCV
//

//TODO Figure out which of these are actually needed for operation. The include list is copied from an example
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

import java.net.DatagramPacket;
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

public class DotDetector {
	
	//Colors given in order BGR-A, Blue, Green, Red, Alpha
	private static CvScalar min = cvScalar(255, 255, 255, 0);
	private static CvScalar max = cvScalar(255, 255, 255, 0);
	
	//Counter to be used for counting the number of frames per second
	private AtomicInteger frames = new AtomicInteger(0);

	//FPS counter class. Prints and resets the above defined counter.
	//Should preferably be set to execute once every second
	private class FPSCounter extends TimerTask {

		@Override
		public void run() {
			System.out.println(frames.get());
			frames.set(0);
		}
	}

	public DotDetector() throws Exception, SocketException {

		//Set up UDP prerequisites
		DatagramSocket socket = new DatagramSocket();
		byte[] targetData = new byte[1024];
		DatagramPacket packet;
		
		//Set up the FPS counter
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
			
			//Find all dots in the image. This is where any calibration to dot detection is done, if needed, though it
			//should be fine as it is right now.
			CvSeq seq = cvHoughCircles(imgThreshold, storage, CV_HOUGH_GRADIENT, 2, 20, 20, 5, 3, 10);
			
			for(int i=0; i<seq.total(); i++){
				
				FloatPointer point = new FloatPointer(cvGetSeqElem(seq, i));
				
				//Draw current circle to the original image
				paintCircle(point, grabbedImage);
				
				//Buffer current circle to be sent to the server
				addPointToSendQueue(point);
			}
			
			//Show images 
			//TODO Comment these out will probably improve performance quite a bit
			detectframe.showImage(imgThreshold);
			realframe.showImage(grabbedImage);
			
			//Add one to the frame rate counter
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
	
	private void addPointToSendQueue(FloatPointer fp) {
		float[] point = { fp.get(0), fp.get(1) };
	}
	
	public static void main(String[] args) throws Exception, SocketException {
		new DotDetector();
	}
}
