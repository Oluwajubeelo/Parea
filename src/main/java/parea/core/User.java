package parea.core;

import io.javalin.websocket.WsContext;

public class User {
    public WsContext connection;
    public boolean isHost;
    public String username;

    public User(WsContext connection, boolean isHost, String username){
        this.connection = connection;
        this.isHost = isHost;
        this.username = username;
    }

    public void send(String jsonMessage){
        if(connection.session.isOpen()){
            connection.send(jsonMessage);
        }
    }

    public void send(Object messageObject){
        if(connection.session.isOpen()){
            connection.send(messageObject);
        }
    }
}