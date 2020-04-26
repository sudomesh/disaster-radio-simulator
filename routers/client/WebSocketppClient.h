#ifndef WebSocketCLIENT_H
#define WebSocketCLIENT_H

#include "../DisasterClient.h"
#include "../DisasterServer.h"

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <iostream>
#include <fstream>
#include <set>
#include <streambuf>
#include <string>

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

typedef websocketpp::server<websocketpp::config::asio> WebSocketppServer;
typedef websocketpp::connection_hdl connection_hdl;

class WebSocketppClient : public DisasterClient
{

    WebSocketppServer *ws_server;

public:
    WebSocketppClient(WebSocketppServer *wss);
    
    void receive(struct Datagram datagram, size_t len);
    void on_message(connection_hdl hdl, WebSocketppServer::message_ptr msg);
    void on_http( WebSocketppServer::connection_ptr con);
    void handleDisconnect();

    static void startServer(WebSocketppServer *ws, void (*callback)(WebSocketppClient *));
};

#endif
