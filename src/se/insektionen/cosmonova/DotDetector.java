package se.insektionen.cosmonova;


//Primär klass för att läsa av bilder från en webkamera. 
//Den är beroende av att man har JavaCV: http://code.google.com/p/javacv/
//som i sin tur är beroende av OpenCV. Läs mer om, och hitta länkar till det, på http://code.google.com/p/javacv/wiki/Windows7AndOpenCV
//

//import static com.googlecode.javacv.cpp.opencv_core.CV_AA;
import static com.googlecode.javacv.cpp.opencv_core.cvCircle;
import static com.googlecode.javacv.cpp.opencv_core.cvPutText;
import static com.googlecode.javacv.cpp.opencv_core.cvClearMemStorage;
//import static com.googlecode.javacv.cpp.opencv_core.cvDrawContours;
//import static com.googlecode.javacv.cpp.opencv_core.cvFillConvexPoly;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSeqElem;
//import static com.googlecode.javacv.cpp.opencv_core.cvLoad;
import static com.googlecode.javacv.cpp.opencv_core.cvGetSize;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicInteger;

import com.googlecode.javacpp.FloatPointer;
import com.googlecode.javacpp.Loader;
import com.googlecode.javacv.*;
import com.googlecode.javacv.FrameGrabber.Exception;
import com.googlecode.javacv.cpp.*;
//import com.googlecode.javacv.cpp.opencv_core.CvContour;
import com.googlecode.javacv.cpp.opencv_core.CvMemStorage;
import com.googlecode.javacv.cpp.opencv_core.CvPoint;
//import com.googlecode.javacv.cpp.opencv_core.CvRect;
import com.googlecode.javacv.cpp.opencv_core.CvScalar;
import com.googlecode.javacv.cpp.opencv_core.CvSeq;
import com.googlecode.javacv.cpp.opencv_core.IplImage;

import static com.googlecode.javacv.cpp.opencv_core.*;
import static com.googlecode.javacv.cpp.opencv_imgproc.*;
//import static com.googlecode.javacv.cpp.opencv_calib3d.*;
//import static com.googlecode.javacv.cpp.opencv_objdetect.*;

public class DotDetector {

	private static final String DEFAULT_SERVER_ADDRESS = "127.0.0.1";
	private static final int DEFAULT_SERVER_PORT = 10001;
	private static final CvFont font = new CvFont(CV_FONT_HERSHEY_PLAIN, 1, 1); 

	//Colors given in order BGR-A, Blue, Green, Red, Alpha
	private static CvScalar min = cvScalar(120, 255, 120, 0);
	private static CvScalar max = cvScalar(255, 255, 255, 0);

	//UDP prerequisites
	private DatagramSocket socket;
	private String buffer = "";
	private DatagramPacket packet;
	
	private InetAddress serverAddress;
	private int serverPort;

	//Timer for the FPS counter
	private Timer t;

	//Counter to be used for counting the number of frames per second
	private AtomicInteger frames = new AtomicInteger(0);
	
	//Variable holding latest known FPS. This is used to print the FPS to
	//the image window
	private AtomicInteger lastKnownFPS = new AtomicInteger(0);

	//FPS counter class. Prints and resets the above defined counter.
	//Should preferably be set to execute once every second
	private class FPSCounter extends TimerTask {

		@Override
		public void run() {
			int fps = frames.getAndSet(0);
			lastKnownFPS.set(fps);
			System.out.println("FPS: " + fps);
		}
	}

	private FrameGrabber grabber;
	private CanvasFrame realframe;
	private CanvasFrame detectframe;
	private CvMemStorage storage;
	private IplImage grabbedImage;
	private IplImage imgThreshold;

	public DotDetector() {

		
		
		//Set up the FPS counter
		t = new Timer();

		// Preload the opencv_objdetect module to work around a known bug.
		Loader.load(opencv_objdetect.class);

		// The available FrameGrabber classes include OpenCVFrameGrabber (opencv_highgui),
		// DC1394FrameGrabber, FlyCaptureFrameGrabber, OpenKinectFrameGrabber,
		// PS3EyeFrameGrabber, VideoInputFrameGrabber, and FFmpegFrameGrabber.
		grabber = new OpenCVFrameGrabber(0);
		grabber.setGamma(1);
		grabber.setFrameRate(15); //Seems to be hard limited between ~15 and ~25 on my webcam


		realframe = new CanvasFrame("Real image", 1);
		detectframe = new CanvasFrame("Fixed image", 1);

		// Objects allocated with a create*() or clone() factory method are automatically released
		// by the garbage collector, but may still be explicitly released by calling release().
		// You shall NOT call cvReleaseImage(), cvReleaseMemStorage(), etc. on objects allocated this way.
		storage = CvMemStorage.create();


	}

	public void start(String serverAddress, int serverPort) throws Exception, IOException {

		//Initialize the network component here to avoid throwing exceptions from the constructor
		initNetwork(serverAddress, serverPort);

		//Schedule the FPS counter
		t.schedule(new FPSCounter(), 1000, 1000);

		//Start the grabber
		grabber.start();

		//Create initial images
		grabbedImage = grabber.grab();
		imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);

		while (realframe.isVisible() && detectframe.isVisible() && (grabbedImage = grabber.grab()) != null) {
			
			cvClearMemStorage(storage);

			//Create detection image
			imgThreshold = cvCreateImage(cvGetSize(grabbedImage), 8, 1);
			cvInRangeS(grabbedImage, min, max, imgThreshold);

			//Flip images to act as a mirror. 
			//TODO remove when camera faces screen
			cvFlip(grabbedImage, grabbedImage, 1);
			cvFlip(imgThreshold, imgThreshold, 1);

			//Find all dots in the image. This is where any calibration of dot detection is done, if needed, though it
			//should be fine as it is right now.
			/*
			 * image, circleStorage, method, double dp,	double minDist,	double param1, double param2, int minRadius, int maxRadius
			 */
			CvSeq seq = cvHoughCircles(imgThreshold, storage, CV_HOUGH_GRADIENT, 2, 20, 20, 2, 0, 10);

			for(int i=0; i<seq.total(); i++){

				FloatPointer point = new FloatPointer(cvGetSeqElem(seq, i));

				//Draw current circle to the original image
				paintCircle(point, grabbedImage);

				//Buffer current circle to be sent to the server
				addPointToSendQueue(point);
			}
			
			//Print some statistics to the image
			cvPutText(grabbedImage, "Dots: " + seq.total(), cvPoint(10, 20), font, CvScalar.WHITE);
			cvPutText(grabbedImage, "FPS: " + lastKnownFPS.get(), cvPoint(realframe.getWidth()-100, 20), font, CvScalar.WHITE);

			//Show images 
			//TODO Comment these out will probably improve performance quite a bit
			detectframe.showImage(imgThreshold);
			realframe.showImage(grabbedImage);

			//Add one to the frame rate counter
			frames.incrementAndGet();
			
			//Send to dots detected this frame to the server
			sendQueue();
		}


	}

	public void close() {
		//Turn off the FPS counter
		t.cancel();

		//Clean up and release the resources
		detectframe.dispose();
		realframe.dispose();
		try {
			//Try to stop the grabber
			grabber.stop();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private void paintCircle(FloatPointer point, IplImage target) {

		CvPoint center = new CvPoint(Math.round(point.get(0)), Math.round(point.get(1)));

		int radius = Math.round(point.get(2));
		cvCircle(target, center, 2, CvScalar.GREEN, -1, 8, 0);
		cvCircle(target, center, radius, CvScalar.BLUE, 1, 8, 0);
	}

	private void addPointToSendQueue(FloatPointer fp) throws IOException {
		float x = fp.get(0);
		float y = fp.get(1);

		buffer+=x;
		buffer+=",";
		buffer+=y;
		buffer+=" ";

	}
	
	private void sendQueue() throws IOException {
		
		//Don't bother sending an empty queue
		if(buffer.isEmpty()){
			return;
		}
		
		//Prepare queue to be sent to server
		byte[] data = buffer.getBytes();
		packet = new DatagramPacket(data, data.length, serverAddress, serverPort);
		socket.send(packet);
		
		//Clear queue
		buffer = "";
	}

	private void initNetwork(String serverAddress, int serverPort) throws SocketException, UnknownHostException {
		this.serverAddress = InetAddress.getByName(serverAddress);
		this.serverPort = serverPort;
		if(socket == null) {
			socket = new DatagramSocket();
		}
	}

	public static void main(String[] args) {
		String serverAddress = DEFAULT_SERVER_ADDRESS;
		int serverPort = DEFAULT_SERVER_PORT;
		switch(args.length) {
		case 2: 
			try { 
				serverPort = Integer.parseInt(args[1]);
				if(serverPort < 1024 || serverPort > 65535) throw new NumberFormatException();
			} catch(NumberFormatException e) {
				System.err.println(args[1] + " invalid port number");
				serverPort = DEFAULT_SERVER_PORT;
			}
		case 1: serverAddress = args[0];
		}
		DotDetector dd = new DotDetector();
		try {
			dd.start(serverAddress, serverPort);
		} catch(Exception e) {
			e.printStackTrace();
		} catch(SocketException e) {
			e.printStackTrace();
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		finally {
			dd.close();
		}

	}
}
