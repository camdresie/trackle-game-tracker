
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Share, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import GroupDropdownSelector from './messages/GroupDropdownSelector';
import GroupMessagesModal from './messages/GroupMessagesModal';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
  title?: string;
}

const ShareModal = ({ open, onOpenChange, shareText, title = 'Share Stats' }: ShareModalProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [showGroupMessagesModal, setShowGroupMessagesModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };

  const handleGroupSelected = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
  };

  const handleShareInGroup = () => {
    if (selectedGroupId) {
      setShowGroupMessagesModal(true);
    } else {
      toast.error('Please select a group first');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Preview your stats before sharing
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2">
            <div className="bg-secondary/30 rounded-md p-4 my-4 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[300px]">
              {shareText}
            </div>
            
            <div className="space-y-4 my-4">
              <div>
                <p className="text-sm mb-2 font-medium">Share in a group:</p>
                <div className="flex gap-2">
                  <GroupDropdownSelector 
                    selectedGroupId={selectedGroupId} 
                    onSelectGroup={handleGroupSelected}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShareInGroup}
                    disabled={!selectedGroupId}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <div className="hidden sm:block"></div>
            <Button 
              variant="default" 
              onClick={handleCopyToClipboard}
              className="w-full sm:w-auto"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showGroupMessagesModal && selectedGroupId && (
        <GroupMessagesModal
          open={showGroupMessagesModal}
          onOpenChange={setShowGroupMessagesModal}
          groupId={selectedGroupId}
          groupName={selectedGroupName}
        />
      )}
    </>
  );
};

export default ShareModal;
