import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessagesPanel from './MessagesPanel';
import { memo, useRef } from 'react';

interface GroupMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

// Use memo to prevent unnecessary re-renders
const GroupMessagesModal = memo(({
  open,
  onOpenChange,
  groupId,
  groupName
}: GroupMessagesModalProps) => {
  // Keep a stable reference to the component instance
  const stableId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`).current;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Group Messages</DialogTitle>
        </DialogHeader>
        
        {/* Always render the panel regardless of open state - Dialog will handle visibility */}
        <div style={{ display: open ? 'block' : 'none' }}>
          <MessagesPanel 
            key={stableId}
            groupId={groupId} 
            groupName={groupName} 
            className="max-h-full flex-grow"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

GroupMessagesModal.displayName = 'GroupMessagesModal';

export default GroupMessagesModal;
