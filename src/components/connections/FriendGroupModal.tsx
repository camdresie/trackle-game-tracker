
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface FriendGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string, description?: string }) => void;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description?: string;
  };
  title?: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50, 'Group name is too long'),
  description: z.string().max(200, 'Description is too long').optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FriendGroupModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isEditing = false,
  initialData,
  title = isEditing ? 'Edit Friend Group' : 'Create New Friend Group'
}: FriendGroupModalProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  // Reset form when modal opens/closes or when initial data changes
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description,
      });
    } else if (!open) {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = (values: FormValues) => {
    // Since we're using zod validation, name will always be a non-empty string here
    onSubmit({
      name: values.name,
      description: values.description,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your friend group details.'
              : 'Create a new group to organize your friends and compare game stats.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Work Friends, Gaming Buddies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description for your group"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                {isEditing ? 'Save Changes' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FriendGroupModal;
