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
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
  title?: string;
}

const ShareModal = ({ open, onOpenChange, shareText, title = 'Share Stats' }: ShareModalProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      // Split the text into content and URL
      let statsContent = shareText;
      
      // Format the text to ensure iOS link preview detection
      // Ensure stats content doesn't have promotional text
      statsContent = statsContent.replace(/\n\nI\'m (tracking|keeping) (game scores|my stats|our scores) on Trackle!\n?/g, '');
      
      // iOS requires the URL to be on its own line with no additional text
      // and the URL should be the last thing in the message
      // Remove the line adding the promotional text and URL
      // const textToCopy = `${statsContent.trim()}\n\nI'm tracking game scores on Trackle!\n${urlLine}`;
      
      // Copy only the stats content
      const textToCopy = statsContent.trim();

      await navigator.clipboard.writeText(textToCopy);
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
    </>
  );
};

export default ShareModal;
