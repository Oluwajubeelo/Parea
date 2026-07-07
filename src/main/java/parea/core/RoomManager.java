package parea.core;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class RoomManager {
    //a thread-safe dictionary. key="X7F9A2", value= the room object
    private ConcurrentHashMap<String, Room> activeRooms;

    public RoomManager(){
        this.activeRooms = new ConcurrentHashMap<>();
    }
    //generates a room, a 6-character code and saves it in RAM
    public Room createNewRoom(String password){
        String code = UUID.randomUUID().toString().substring(0,6).toUpperCase();

        Room newRoom = new Room(code, password);
        activeRooms.put(code, newRoom);

        boolean isSecured = (password != null && !password.isBlank());
        System.out.println("New Room Created: " + code + (isSecured ? " [SECURED]" : ""));
        return newRoom;
    }

    public Room getRoom(String code){
        if(code == null) return null;
        return activeRooms.get(code.toUpperCase());
    }

    public void destroyRoom(String code){
        if(code !=null){
            activeRooms.remove(code.toUpperCase());
            System.out.println("Room Destroyed: " + code);
        }
    }
}
