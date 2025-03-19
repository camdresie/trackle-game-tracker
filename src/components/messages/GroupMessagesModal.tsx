
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessagesPanel from './MessagesPanel';

interface GroupMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

const GroupMessagesModal = ({
  open,
  onOpenChange,
  groupId,
  groupName
}: GroupMessagesModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Group Messages</DialogTitle>
        </DialogHeader>
        <MessagesPanel 
          groupId={groupId} 
          groupName={groupName} 
          className="max-h-full flex-grow"
        />
      </DialogContent>
    </Dialog>
  );
};

export default GroupMessagesModal;
