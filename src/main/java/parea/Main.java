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

        Javalin app=Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(it -> it.anyHost());
            });
            config.staticFiles.add("frontend", io.javalin.http.staticfiles.Location.EXTERNAL);
        }).start(port);

        System.out.println("--- Parea Backend is LIVE on port " + port + " ---");
        
        app.post("/api/create-room", ctx ->{
            Room newRoom = roomManager.createNewRoom();
            ctx.json(Map.of("roomCode", newRoom.roomCode));
        });

        app.ws("/ws/{roomCode}", ws -> {

            ws.onConnect(ctx -> {
                String roomCode = ctx.pathParam("roomCode").toUpperCase();
                Room room = roomManager.getRoom(roomCode);

                if (room == null){
                    ctx.session.close(1008, "Room does not exist");
                    return;
                }

                boolean isHost = room.activeUsers.isEmpty();
                User user = new User(ctx, isHost);
                room.addUser(user);

                ctx.send(new Message("ROOM_JOINED", room.documentText, String.valueOf(isHost)));

                room.broadcastToEveryone(new Message("USER_COUNT_UPDATE", String.valueOf(room.activeUsers.size()), "SERVER"));

                System.out.println("User joined room " + roomCode + ". isHost: " + isHost);
            });

            ws.onMessage(ctx -> {
                String roomCode = ctx.pathParam("roomCode").toUpperCase();
                Room room = roomManager.getRoom(roomCode);
                if(room == null) return;

                Message msg = ctx.messageAsClass(Message.class);
                switch(msg.type){
                    case "TEXT_UPDATE":
                    case "FORCE_OVERWRITE":

                    room.documentText = msg.content;
                    for (User u : room.activeUsers) {
                        if (!u.connection.sessionId().equals(ctx.sessionId())){
                            u.send(ctx.message());
                        }
                    }
                    break;
                
                case "IMPORT_REQUEST":
                    //route this request only to the host
                    msg.senderId = ctx.sessionId();
                    for(User u:room.activeUsers){
                        if(u.isHost){
                            u.connection.send(msg);
                            break;
                        }
                    }
                    break;
                
                    case "IMPORT_DENIED":
                        //host denies import. route the rehection back to the specific guest
                        for (User u : room.activeUsers) {
                            if(u.connection.sessionId().equals(msg.senderId)){
                                u.connection.send(new Message("IMPORT_DENIED" , "Host rejected the import.", "SERVER"));
                                break;
                            }
                        }
                        break;
                }
            });

            //when a user closes their browser tab
            ws.onClose(ctx -> {
                String roomCode = ctx.pathParam("roomCode").toUpperCase();
                Room room = roomManager.getRoom(roomCode);
                if (room == null) return;

                //find and remove the user who left
                User userWhoLeft = null;
                for (User u : room.activeUsers) {
                    if (u.connection.sessionId().equals(ctx.sessionId())) {
                        userWhoLeft = u;
                        break;
                    }
                }

                if (userWhoLeft !=null){
                    room.removeUser(userWhoLeft);
                    System.out.println("User left room " + roomCode);
                    
                    if(room.activeUsers.isEmpty()){
                        roomManager.destroyRoom(roomCode);
                    }

                    else {
                        room.broadcastToEveryone(new Message ("USER_COUNT_UPDATE", String.valueOf(room.activeUsers.size()), "SERVER"));

                        if(userWhoLeft.isHost){
                            User newHost = room.activeUsers.get(0);
                            newHost.isHost = true;
                            newHost.connection.send(new Message ("PROMOTED_TO_HOST","You are now the room host.", "SERVER"));
                            System.out.println("Host transferred in room" + roomCode);
                        }
                        if (room.activeUsers.size() == 1){
                        room.activeUsers.get(0).connection.send(new Message ("LAST_USER_WARNING", "", "SERVER"));
                        }   
                    }   
                }
            });
        });
    }
}