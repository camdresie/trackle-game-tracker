
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { GroupMessage } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendIcon, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessagesPanelProps {
  groupId: string;
  groupName: string;
  className?: string;
}

const MessagesPanel = ({ groupId, groupName, className = '' }: MessagesPanelProps) => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending } = useGroupMessages(groupId);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current;
      setTimeout(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 100); // Short delay to ensure DOM is updated
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    console.log('Sending message:', newMessage);
    sendMessage(newMessage.trim());
    setNewMessage('');
  };
  
  const renderMessage = (message: GroupMessage) => {
    const isCurrentUser = user?.id === message.user_id;
    const initials = message.sender?.username 
      ? message.sender.username.substring(0, 2).toUpperCase() 
      : 'U';
    
    return (
      <div 
        key={message.id} 
        className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isCurrentUser && (
          <Avatar className="mr-2 h-8 w-8">
            <AvatarImage src={message.sender?.avatar_url || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isCurrentUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary'
          }`}
        >
          {!isCurrentUser && (
            <div className="text-xs font-semibold mb-1">
              {message.sender?.username || 'Unknown User'}
            </div>
          )}
          <div className="break-words">{message.content}</div>
          <div className="text-xs opacity-70 mt-1 text-right">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </div>
        </div>
        
        {isCurrentUser && (
          <Avatar className="ml-2 h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || ''} />
            <AvatarFallback>{user.user_metadata?.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };
  
  return (
    <Card className={`${className} flex flex-col`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>{groupName} Messages</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea ref={scrollAreaRef} className="h-[300px] px-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground p-4">
              <Users className="h-10 w-10 opacity-40" />
              <p>No messages yet. Be the first to send a message!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(renderMessage)}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSending || !newMessage.trim()}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default MessagesPanel;
