package parea.core;

import java.util.concurrent.CopyOnWriteArrayList;

public class Room {
    public String roomCode;
    public String documentText;
    public CopyOnWriteArrayList<User> activeUsers;
    public String currentMode = "WRITING";
    public String password;

    public Room(String roomCode, String password){
        this.roomCode=roomCode;
        this.documentText="";
        this.activeUsers=new CopyOnWriteArrayList<>();
        this.password = password;
        this.currentMode = "WRITING";
    }

    public void addUser(User user){
        activeUsers.add(user);
    }
    public void removeUser(User user){
        activeUsers.remove(user);
    }

    public void broadcastToEveryone(String jsonMessage){
        for (User user : activeUsers){
            user.send(jsonMessage);
        }
    }

    public void broadcastToEveryone(Object messageObject){
        for(User user : activeUsers){
            user.send(messageObject);
        }
    }
}