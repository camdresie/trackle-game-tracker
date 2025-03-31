import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { GroupMessage } from '@/utils/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendIcon, Users, UserPlus, Loader2, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MessagesPanelProps {
  groupId: string;
  groupName: string;
  isJoinedGroup?: boolean;
  className?: string;
}

const MESSAGE_HEIGHT = 84; // Estimated average height of message item

// Use stable memo component to prevent unnecessary re-renders
const MessagesPanel = memo(({ groupId, groupName, isJoinedGroup = false, className = '' }: MessagesPanelProps) => {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const instanceId = useRef(`panel-${Math.random().toString(36).substr(2, 9)}`).current;
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []); // Empty dependency array to run only on mount/unmount
  
  // Validate groupId to prevent API calls with invalid IDs
  const isValidGroupId = groupId && groupId.length > 0 && groupId !== '00000000-0000-0000-0000-000000000000';
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    isSending, 
    hasMoreMessages, 
    loadMoreMessages,
    isFetchingNextPage,
    isInitialLoadComplete
  } = useGroupMessages(isValidGroupId ? groupId : null);
  
  // Track if we've attempted to load more messages at least once
  const [attemptedLoadMore, setAttemptedLoadMore] = useState(false);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);
  
  // Handle loading more messages on button click
  const handleLoadMoreMessages = useCallback(() => {
    // Track if we've attempted to load more
    setAttemptedLoadMore(true);
    
    // If we're already fetching, don't do anything
    if (isFetchingNextPage) return;
    
    // Always try loading more - the server will return empty if there are truly no more
    loadMoreMessages();
    
  }, [isFetchingNextPage, loadMoreMessages]);

  // Automatically scroll to bottom on initial load
  useEffect(() => {
    // Only scroll to bottom on initial load of messages and if component is still mounted
    if (mountedRef.current && isInitialLoadComplete && !initialScrollComplete && messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      setInitialScrollComplete(true);
    }
  }, [isInitialLoadComplete, messages.length, initialScrollComplete]);
  
  // Auto-scroll to bottom when WE send a new message
  useEffect(() => {
    if (mountedRef.current && initialScrollComplete && messagesEndRef.current && isAtBottom()) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);
  
  // Check if the scroll is at the bottom
  const isAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return false;
    
    const viewport = scrollContainerRef.current.querySelector('div[class*="h-full w-full rounded-[inherit]"]');
    if (viewport instanceof HTMLDivElement) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Consider "bottom" if within 100px of actual bottom
      return scrollHeight - scrollTop - clientHeight < 100;
    }
    return false;
  }, []);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
      
      // After sending, ensure we scroll to bottom
      setTimeout(() => {
        if (mountedRef.current && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, sendMessage]);
  
  // Render messages in reverse order (newest at bottom)
  const messagesToDisplay = useMemo(() => [...messages].reverse(), [messages]);
  
  // Create the message list component
  const messageList = useMemo(() => {
    if (isLoading && messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading messages...
        </div>
      );
    } 
    
    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground p-4">
          <Users className="h-10 w-10 opacity-40" />
          <p>No messages yet. Be the first to send a message!</p>
        </div>
      );
    }
    
    // Always show the button if we have messages
    const showLoadMoreButton = messages.length > 0;
    
    return (
      <div className="flex flex-col space-y-3">
        {/* Always show Load More button if we have messages */}
        {showLoadMoreButton && (
          <div className="text-center py-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleLoadMoreMessages}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Load Older Messages
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Message list */}
        {messagesToDisplay.map((message) => {
          const isCurrentUser = user?.id === message.user_id;
          const initials = message.sender?.username 
            ? message.sender.username.substring(0, 2).toUpperCase() 
            : 'U';
          
          return (
            <div 
              key={message.id}
              className={`flex mb-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
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
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  }, [hasMoreMessages, isFetchingNextPage, handleLoadMoreMessages, messagesToDisplay, isLoading, messages.length, user]);
  
  // Header component with memoization
  const headerContent = useMemo(() => (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        {isJoinedGroup ? <UserPlus className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        <span>{groupName} Messages</span>
        {isJoinedGroup && (
          <Badge variant="outline" className="ml-1 bg-secondary/30">
            Joined Group
          </Badge>
        )}
      </CardTitle>
    </CardHeader>
  ), [groupName, isJoinedGroup]);
  
  // Form component with memoization
  const formComponent = useMemo(() => (
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
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </form>
    </CardFooter>
  ), [newMessage, isSending, handleSendMessage]);
  
  return (
    <Card className={`${className} flex flex-col`}>
      {headerContent}
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea ref={scrollContainerRef} className="h-full px-2 pt-2 pb-0 relative">
          <div className="flex flex-col min-h-full">
            {messageList}
          </div>
        </ScrollArea>
      </CardContent>
      {formComponent}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (meaning component should NOT re-render)
  return prevProps.groupId === nextProps.groupId && 
         prevProps.groupName === nextProps.groupName &&
         prevProps.isJoinedGroup === nextProps.isJoinedGroup &&
         prevProps.className === nextProps.className;
});

MessagesPanel.displayName = 'MessagesPanel';

export default MessagesPanel;
