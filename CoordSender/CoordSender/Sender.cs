using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Timers;

namespace CoordSender
{
	public class Sender : INotifyPropertyChanged
	{
		Socket _socket;
		IPAddress _serverAddr;
		IPEndPoint _endPoint;

		public Sender()
		{
			_socket = new Socket( AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp );
			_serverAddr = IPAddress.Parse( ConfigurationManager.AppSettings["TargetServer"] ?? "127.0.0.1" );
			_endPoint = new IPEndPoint( _serverAddr, Int32.Parse( ConfigurationManager.AppSettings["TargetPort"] ?? "10001" ) );
			_data = "";
			var t = new Timer( Double.Parse( ConfigurationManager.AppSettings["SendingInterval"] ?? "100" ) );
			t.Elapsed += Send;
			t.Enabled = true;
		}

		void Send( object sender, ElapsedEventArgs e )
		{
			byte[] send_buffer = Encoding.UTF8.GetBytes( DataSource );

			_socket.SendTo( send_buffer, _endPoint );
		}

		string _data;

		public string DataSource
		{
			get { return _data; }
			set
			{
				_data = value;
				OnPropertyChanged( new PropertyChangedEventArgs( "DataSource" ) );
			}
		}

		public event PropertyChangedEventHandler PropertyChanged;

		public void OnPropertyChanged( PropertyChangedEventArgs e )
		{
			PropertyChangedEventHandler handler = PropertyChanged;
			if( handler != null )
				handler( this, e );
		}
	}
}
