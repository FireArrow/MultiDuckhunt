package se.insektionen.cosmonova;


import java.awt.BorderLayout;
import java.awt.Container;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;

import marvin.gui.MarvinImagePanel;
import marvin.image.MarvinImage;
import marvin.image.MarvinImageMask;
import marvin.io.MarvinImageIO;
import marvin.plugin.MarvinImagePlugin;
import marvin.util.MarvinPluginLoader;

public class FirstApplication extends JFrame implements ActionListener
{
	private MarvinImagePanel 	imagePanel;
	private MarvinImage 		image, 
								backupImage;
	
	private JPanel 				panelBottom;
	
	
	private JButton 			buttonGray, 
								buttonEdgeDetector, 
								buttonInvert, 
								buttonReset;
	
	private MarvinImagePlugin 	imagePlugin;
	
	public FirstApplication()
	{
		super("First Application");
		
		// Create Graphical Interface
		buttonGray = new JButton("Gray");
		buttonGray.addActionListener(this);
		buttonEdgeDetector = new JButton("EdgeDetector");
		buttonEdgeDetector.addActionListener(this);
		buttonInvert = new JButton("Invert");
		buttonInvert.addActionListener(this);
		buttonReset = new JButton("Reset");
		buttonReset.addActionListener(this);
		
		panelBottom = new JPanel();
		panelBottom.add(buttonGray);
		panelBottom.add(buttonEdgeDetector);
		panelBottom.add(buttonInvert);
		panelBottom.add(buttonReset);
		
		// ImagePanel
		imagePanel = new MarvinImagePanel();
		
		
		Container l_c = getContentPane();
		l_c.setLayout(new BorderLayout());
		l_c.add(panelBottom, BorderLayout.SOUTH);
		l_c.add(imagePanel, BorderLayout.NORTH);
		
		// Load image
		image = MarvinImageIO.loadImage("./res/are.jpg");
		backupImage = image.clone();		
		imagePanel.setImage(image);
		
		setSize(340,430);
		setVisible(true);	
	}
	
	public static void main(String args[]){
		FirstApplication t = new FirstApplication();
		t.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
	}
	
	public void actionPerformed(ActionEvent e){
		image = backupImage.clone();
		if(e.getSource() == buttonGray){
			imagePlugin = MarvinPluginLoader.loadImagePlugin("org.marvinproject.image.color.grayScale.jar");
			imagePlugin.process(image, image, null, MarvinImageMask.NULL_MASK, false);
		}
		else if(e.getSource() == buttonEdgeDetector){
			imagePlugin = MarvinPluginLoader.loadImagePlugin("org.marvinproject.image.edge.edgeDetector.jar");
			imagePlugin.process(image, image, null, MarvinImageMask.NULL_MASK, false);
		}
		else if(e.getSource() == buttonInvert){
			imagePlugin = MarvinPluginLoader.loadImagePlugin("org.marvinproject.image.color.invert.jar");
			imagePlugin.process(image, image, null, MarvinImageMask.NULL_MASK, false);
		}
		image.update();
		imagePanel.setImage(image);
	}
}