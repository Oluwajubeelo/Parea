package parea.core;

public class Message {
    public String type;
    public String content;
    public String senderId;

    public Message(){}

    public Message(String type, String content, String senderId){
        this.type = type;
        this.content = content;
        this.senderId=senderId;
    }
}
