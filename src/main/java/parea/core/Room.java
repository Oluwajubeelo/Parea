package parea.core;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class Room {
    public String roomCode;
    public String documentText;

    public List<User> activeUsers;

    public Room(String roomCode){
        this.roomCode=roomCode;
        this.documentText="";
        this.activeUsers=new CopyOnWriteArrayList<>();
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

    


