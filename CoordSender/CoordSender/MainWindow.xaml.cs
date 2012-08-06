using System.Windows;
using System.Windows.Input;
namespace CoordSender
{
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	public partial class MainWindow : Window
	{
		bool _keep;
		readonly Sender _s;
		public MainWindow()
		{
			InitializeComponent();
			_s = new Sender { Info = GetCurrentInfoString() };
			DataContext = _s;
		}

		private void Window_MouseDown( object sender, MouseButtonEventArgs e )
		{
			var coords = System.Windows.Forms.Control.MousePosition;
			var stringdata = string.Format( "{0},{1}", coords.X, coords.Y );
			if( _keep )
			{
				if( _s.DataSource.Equals( " " ) )
				{
					_s.DataSource = stringdata;
				}
				else
					_s.DataSource = _s.DataSource + " " + stringdata;
			}
			else
			{
				_s.DataSource = stringdata;
			}
		}

		private void Window_MouseUp( object sender, MouseButtonEventArgs e )
		{
			if( !_keep )
			{
				_s.DataSource = " ";
			}
		}

		private void Window_KeyDown( object sender, KeyEventArgs e )
		{
			if( _keep )
				_s.DataSource = " ";
			_keep = !_keep;
			_s.Info = GetCurrentInfoString();
		}

		string GetCurrentInfoString()
		{
			return string.Format( "This app sends system mouse coords via udp to {0}:{1} every {2} ms.\nPress any key to switch state.\n\n", Properties.Settings.Default.TargetServer, Properties.Settings.Default.TargetPort, Properties.Settings.Default.SendingInterval ) + ( _keep ?
				"Currently in HOLD state.\n\nAny clicks in window area will be continuously sent until this state is exited."
				:
				"Currently in SINGLE CLICK state.\n\nClicking the window will send coordinates while mouse button is pressed." );
		}

		private void Window_KeyUp( object sender, KeyEventArgs e )
		{
		}
	}
}
