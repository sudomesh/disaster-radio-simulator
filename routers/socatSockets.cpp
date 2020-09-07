//#define BACKWARD_HAS_DW 1
#include <stdio.h>
#include <errno.h>
#include <fcntl.h>
#include <string>
#include <cstring>
#include <termios.h>
#include <unistd.h>

#include <backward.cpp>
#include "client_ws.hpp"
#include "server_ws.hpp"
//#include "client_http.hpp"
//#include "server_http.hpp"

#include <algorithm>
#include <boost/filesystem.hpp>
#include <fstream>

#include <future>

using namespace std;

using WsServer = SimpleWeb::SocketServer<SimpleWeb::WS>;
using WsClient = SimpleWeb::SocketClient<SimpleWeb::WS>;

//using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
//using HttpClient = SimpleWeb::Client<SimpleWeb::HTTP>;

int nodeID = 1;
string root = "../routers/static/";

int state = 0;
int chance;
int dest;

int _routeInterval = 10;
int _learningTimeout = 200;
int _maxRandomDelay = 20;

//mutex ws_data;
int numOfMessages = 0;

string portname;
int tty_file;
bool serialInitialized;

/*
void setupSocat()
{
  Serial.printf("* Initializing Serial...\r\n");

  // append nodeID to tty port (used string out of convience)
  string port = "./tty/N";
  string number = to_string(nodeID);
  string portname = port + number;

  Serial.printf(" --> connect to %s\r\n", portname.c_str());
  SocatClient *socat_client = new SocatClient(portname);
  if(socat_client->init()){
    Serial.printf(" --> Serial initialized and connected\r\n");
  }
  else{
    Serial.printf(" --> Serial initialized, no device connected\r\n");
  }
  radio->connect(new Console())
    ->connect(socat_client);
}
*/

/*
void setupWebSocket(){
  Serial.printf("* WebSocketpp not initialized...\r\n");
  // TODO: Websocketpp polling cause seg fault inside of loop?
  uint16_t port = 8000 + nodeID;
  Serial.printf("* Initializing WebSocketpp...\r\n");
  WebSocketppClient *ws_client = new WebSocketppClient();
  ws_client->startServer(port, root);
  radio->connect(ws_client);
}
*/

int set_interface_attribs(int speed, int parity)
{
  struct termios tty;
  if (tcgetattr (tty_file, &tty) != 0)
  {
    //Serial.printf("error %d from tcgetattr", errno);
    return -1;
  }

  cfsetospeed (&tty, speed);
  cfsetispeed (&tty, speed);

  tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8;     // 8-bit chars
  // disable IGNBRK for mismatched speed tests; otherwise receive break
  // as \000 chars
  tty.c_iflag &= ~IGNBRK;         // disable break processing
  tty.c_lflag = 0;                // no signaling chars, no echo,
                                  // no canonical processing
  tty.c_oflag = 0;                // no remapping, no delays
  tty.c_cc[VMIN]  = 0;            // read doesn't block
  tty.c_cc[VTIME] = 5;            // 0.5 seconds read timeout

  tty.c_iflag &= ~(IXON | IXOFF | IXANY); // shut off xon/xoff ctrl

  tty.c_cflag |= (CLOCAL | CREAD);// ignore modem controls,
                                  // enable reading
  tty.c_cflag &= ~(PARENB | PARODD);      // shut off parity
  tty.c_cflag |= parity;
  tty.c_cflag &= ~CSTOPB;
  tty.c_cflag &= ~CRTSCTS;

  if (tcsetattr (tty_file, TCSANOW, &tty) != 0)
  {
    //Serial.printf("error %d from tcsetattr", errno);
    return -1;
  }
  return 0;
}

void socat_loop(){
  //if(serialInitialized){
  char buffer[100];
  ssize_t length = read(tty_file, &buffer, sizeof(buffer));
  if (length == -1)
  {
    //Error reading from serial port
    return;
  }
  else if (length > 0)
  {
    buffer[length] = '\0';
    //struct Datagram datagram = { 0xff, 0xff, 0xff, 0xff };
    //datagram.type = 'c';
    //memcpy(datagram.message, buffer, length);
    //server->transmit(this, datagram, length + DATAGRAM_HEADER);
  }
  //}
  //else{
  //  serialInitialized = init();
  //}
  //write(tty_file, datagram.message, len - DATAGRAM_HEADER);
}


int main(int argc, char **argv) {
  int opt;
  // handle getopt arguments
  while ((opt = getopt(argc, argv, "t:a:n:")) != -1) {
      switch (opt) {
          //case 't':
          //    Layer1->setTimeDistortion(strtod(optarg, NULL));
          //    break;
          //case 'a':
          //    LL2->setLocalAddress(optarg);
          //    break;
          case 'n':
              //Layer1->setNodeID(atoi(optarg));
              nodeID = atoi(optarg);
              break;
          default:
              perror("Bad args\n");
              return 1;
      }
  }

  string port = "./tty/WS";
  string number = to_string(nodeID);
  string portname = port + number;

  tty_file = open(portname.c_str(), O_RDWR | O_NOCTTY | O_SYNC);
  if(tty_file < 0)
  {
    return false;
  }

  set_interface_attribs(B115200, 0);  // set speed to 115,200 bps, 8n1 (no parity)
  write(tty_file, "hello from socatSocket!\n", 25);           // send 7 character greeting
  usleep((7 + 25) * 100);             // sleep enough to transmit the 7 plus
                                       // receive 25:  approx 100 uS per char transmit
  //Serial.printf("serial client connected\r\n");

    
  WsServer ws_server;
  ws_server.config.port = 8000 + nodeID;

  auto &echo = ws_server.endpoint["^/ws/?$"];

  echo.on_message = [](shared_ptr<WsServer::Connection> connection, shared_ptr<WsServer::InMessage> in_message) {
    auto out_message = in_message->string();

    cout << "Server: Message received: \"" << out_message << "\" from " << connection.get() << endl;

    cout << "Server: Sending message \"" << out_message << "\" to " << connection.get() << endl;

    // connection->send is an asynchronous function
    connection->send(out_message, [](const SimpleWeb::error_code &ec) {
      if(ec) {
        cout << "Server: Error sending message. " <<
            // See http://www.boost.org/doc/libs/1_55_0/doc/html/boost_asio/reference.html, Error Codes for error code meanings
            "Error: " << ec << ", error message: " << ec.message() << endl;
      }
    });

    // Alternatively use streams:
    // auto out_message = make_shared<WsServer::OutMessage>();
    // *out_message << in_message->string();
    // connection->send(out_message);
  };

   echo.on_open = [](shared_ptr<WsServer::Connection> connection) {
    cout << "Server: Opened connection " << connection.get() << endl;
  };

  // See RFC 6455 7.4.1. for status codes
  echo.on_close = [](shared_ptr<WsServer::Connection> connection, int status, const string & /*reason*/) {
    cout << "Server: Closed connection " << connection.get() << " with status code " << status << endl;
  };

  // Can modify handshake response headers here if needed
  echo.on_handshake = [](shared_ptr<WsServer::Connection> /*connection*/, SimpleWeb::CaseInsensitiveMultimap & /*response_header*/) {
    return SimpleWeb::StatusCode::information_switching_protocols; // Upgrade to websocket
  };

  // See http://www.boost.org/doc/libs/1_55_0/doc/html/boost_asio/reference.html, Error Codes for error code meanings
  echo.on_error = [](shared_ptr<WsServer::Connection> connection, const SimpleWeb::error_code &ec) {
    cout << "Server: Error in connection " << connection.get() << ". "
         << "Error: " << ec << ", error message: " << ec.message() << endl;
  };

  // Example 3: Echo to all WebSocket endpoints
  // Sending received messages to all connected clients
  auto &echo_all = ws_server.endpoint["^/echo_all/?$"];
  echo_all.on_message = [&ws_server](shared_ptr<WsServer::Connection> /*connection*/, shared_ptr<WsServer::InMessage> in_message) {
    auto out_message = in_message->string();

    // echo_all.get_connections() can also be used to solely receive connections on this endpoint
    for(auto &a_connection : ws_server.get_connections())
      a_connection->send(out_message);
  };

  // Start server and receive assigned port when server is listening for requests
  promise<unsigned short> ws_server_port;
  thread ws_server_thread([&ws_server, &ws_server_port]() {
    // Start server
    ws_server.start([&ws_server_port](unsigned short port) {
      ws_server_port.set_value(port);
    });
  });


  //Serial.printf("WS Server listening on port %d\r\n", ws_server_port.get_future().get());
  cout << "WS Server listening on port " << ws_server_port.get_future().get() << endl << endl;

  thread socat_thread(socat_loop);

  ws_server_thread.join();
  socat_thread.join();


  return 0;
}
