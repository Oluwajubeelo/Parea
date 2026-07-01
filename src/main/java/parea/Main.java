package parea;

import io.javalin.Javalin;
import parea.core.Message;
import parea.core.Room;
import parea.core.RoomManager;
import parea.core.User;

import java.util.Map;

public class Main{
    private static final RoomManager roomManager = new RoomManager();

    public static void main(String[] args){
        int port = System.getenv("PORT") !=null ? Integer.parseInt(System.getenv("PORT")) : 8080;

        
    }
}