package parea.core;

public class Message {
    public String type;
    public String content;
    public String senderId;
    public String senderName;
    public String fileName;
    public String currentMode;
    public String replyToSender;
    public String replyToContent;
    public Message(){}

    public Message(String type, String content, String senderId){
        this.type = type;
        this.content = content;
        this.senderId=senderId;
    }
}