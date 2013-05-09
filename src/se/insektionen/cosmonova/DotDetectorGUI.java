package se.insektionen.cosmonova;

import java.awt.Color;
import java.awt.Container;
import java.awt.FlowLayout;
import java.awt.Image;

import javax.swing.BoxLayout;
import javax.swing.JCheckBox;
import javax.swing.JColorChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JToggleButton;
import javax.swing.SwingUtilities;

import com.googlecode.javacv.cpp.opencv_core.IplImage;

public class DotDetectorGUI {
	
	private JFrame mainFrame;
	private FlowLayout mainLayout;
	private BoxLayout controllerLayout;
	
	/**************************************
	 *          *            *            *
	 *    1     *     2      *     3      *
	 *          *            *            *
	 *          *            *            *
	 **************************************/
	
	
	//Frame 1 - Controllers
	private JPanel controllerPanel;
	private JCheckBox flipImages;
	private JColorChooser minDetectColor;
	private JColorChooser maxDetectColor;
	private JToggleButton silenceToggle;

	//Frame 2 - Real image
	private ImagePanel realImagePanel;

	//Frame 3 - Detected image
	private ImagePanel detectedImagePanel;
	
	public DotDetectorGUI() {
		this("DotDetector");
	}
	
	public DotDetectorGUI(String title) {
		
		//Init components
		mainFrame = new JFrame();
		mainLayout = new FlowLayout();
		
		controllerPanel = new JPanel();
		controllerLayout = new BoxLayout(controllerPanel, BoxLayout.Y_AXIS);
		
		realImagePanel = new ImagePanel();
		detectedImagePanel = new ImagePanel();
		
		minDetectColor = new JColorChooser(Color.RED);
		maxDetectColor = new JColorChooser(Color.WHITE);
		
		silenceToggle = new JToggleButton("Silent mode");
		
		//Build GUI
		mainFrame.setLayout(mainLayout);
		mainFrame.add(controllerPanel);
		mainFrame.add(realImagePanel);
		mainFrame.add(detectedImagePanel);
		
		//Frame 1 - Controllers
		controllerPanel.add(silenceToggle);
		controllerPanel.add(minDetectColor);
		controllerPanel.add(maxDetectColor);
		
		
		mainFrame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		
		mainFrame.pack(); //TODO Ta bort denna när guiet är färdigkodat
		
		mainFrame.setVisible(true);
	}
	
	private class ImagePanel extends JPanel {
		/**
		 * 
		 */
		private static final long serialVersionUID = 4901502881215372933L;
		private Image image;
		private JLabel holder = new JLabel();
		private boolean silent = false;
		
		public ImagePanel() {
			super();
			add(holder);
		}
		
		void showImage(final IplImage image) {
			if(!silent) {
				this.image = image.getBufferedImage(image.getBufferedImageType());
				final Container self = this.getParent();
				SwingUtilities.invokeLater(new Runnable() {

					@Override
					public void run() {
						self.repaint();
					}
				});
			}
		}
		
		void silentMode(boolean newState) {
			if(newState != silent) {
				silent = newState;
				
				if(silent == true) {
					holder.setIcon(null);
					holder.setText("Silent");
				}
			}
		}
	}
	
	
	public static void main(String[] args) {
		new DotDetectorGUI();
	}

}
