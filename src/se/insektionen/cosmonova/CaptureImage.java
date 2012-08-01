package se.insektionen.cosmonova;

import com.googlecode.javacv.OpenCVFrameGrabber;
import com.googlecode.javacv.cpp.opencv_core.IplImage; 
import static com.googlecode.javacv.cpp.opencv_highgui.*; 
public class CaptureImage {
	private static void captureFrame() { 
		// 0-default camera, 1 - next...so on
		System.out.println("Startar");
		final OpenCVFrameGrabber grabber = new OpenCVFrameGrabber(0);
		try { 
			System.out.println("Startar grabber");
			grabber.start(); 
			System.out.println("Grabbar");
			IplImage img = grabber.grab();
			if (img != null) { 
				System.out.println("sparar bild");
				cvSaveImage("capture.jpg", img);
			}
		} catch (Exception e) { 
			e.printStackTrace(); 
		} 
	} 
	public static void main(String[] args) {
		captureFrame(); 
	} 
}

