
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  Trash2, 
  AlertCircle,
  Camera,
  Moon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';

import { useAuth } from '@/contexts/AuthContext';
import { supabase, ensureAvatarBucketExists } from '@/lib/supabase';
import { toast } from 'sonner';
import { ThemeSwitch } from '@/components/theme/ThemeSwitch';

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();
  
  // Profile form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  
  // Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Delete account state
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Avatar upload state
  const [uploading, setUploading] = useState(false);
  
  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url);
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);
  
  // Check username availability with debounce
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameAvailable(true);
      return;
    }
    
    const timer = setTimeout(async () => {
      if (username.length < 3) return;
      
      setUsernameChecking(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .neq('id', user?.id || '')
          .maybeSingle();
          
        setUsernameAvailable(!data);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, profile?.username, user?.id]);
  
  const handleProfileUpdate = async () => {
    if (!usernameAvailable) {
      toast.error('Username is already taken');
      return;
    }
    
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    setSavingProfile(true);
    try {
      await updateProfile({
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };
  
  const handlePasswordUpdate = async () => {
    if (!password) {
      toast.error('Current password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword && newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setSavingPassword(true);
    try {
      // First sign in with the current credentials to verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast.success('Password updated successfully');
      
      // Clear form
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'delete my account') {
      toast.error('Please type "delete my account" to confirm');
      return;
    }
    
    setDeletingAccount(true);
    try {
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) throw error;
      
      // Sign out after deletion
      await signOut();
      
      // Close dialog and navigate to home
      setDeleteDialogOpen(false);
      navigate('/');
      
      toast.success('Your account has been deleted');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account: ' + error.message);
    } finally {
      setDeletingAccount(false);
    }
  };
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;
    
    setUploading(true);
    try {
      // Ensure avatars bucket exists using our utility function
      const bucketExists = await ensureAvatarBucketExists();
      if (!bucketExists) {
        throw new Error('Failed to ensure avatar bucket exists');
      }
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Update the avatar URL in the state
      setAvatarUrl(data.publicUrl);
      
      // Update the profile with the new avatar URL
      await updateProfile({
        avatar_url: data.publicUrl,
      });
      
      toast.success('Avatar uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          <h1 className="text-2xl font-bold">Account Settings</h1>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-3 gap-4">
            <TabsTrigger value="profile" className="px-4">Profile</TabsTrigger>
            <TabsTrigger value="account" className="px-4">Account & Password</TabsTrigger>
            <TabsTrigger value="appearance" className="px-4">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information visible to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile" />
                      ) : (
                        <AvatarFallback>
                          <User className="h-12 w-12" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="absolute -bottom-2 -right-2">
                      <label 
                        htmlFor="avatar-upload" 
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload avatar</span>
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h3 className="text-lg font-medium">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">
                      Click the camera icon to upload a new profile picture
                    </p>
                    {uploading && (
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input 
                        id="username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a unique username"
                      />
                      {username && username !== profile?.username && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {usernameChecking ? (
                            <span className="text-xs text-muted-foreground">Checking...</span>
                          ) : (
                            <span className={`text-xs ${usernameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                              {usernameAvailable ? 'Available' : 'Already taken'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your username must be unique and at least 3 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name (optional)"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={
                    savingProfile || 
                    !usernameAvailable || 
                    usernameChecking || 
                    username.length < 3
                  }
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="pt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email & Password</CardTitle>
                <CardDescription>
                  Update your account credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed directly
                  </p>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ml-auto" 
                  onClick={handlePasswordUpdate}
                  disabled={
                    savingPassword || 
                    !password || 
                    !newPassword || 
                    newPassword !== confirmPassword || 
                    newPassword.length < 6
                  }
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This action cannot be undone. All of your data will be permanently deleted.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="ml-auto">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. Are you sure you want to permanently delete your account?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="mb-4 text-sm">
                        To confirm, please type <span className="font-bold">delete my account</span> below:
                      </p>
                      <Input
                        value={confirmDeleteText}
                        onChange={(e) => setConfirmDeleteText(e.target.value)}
                        placeholder="delete my account"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={confirmDeleteText !== 'delete my account' || deletingAccount}
                      >
                        {deletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how Trackle looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark mode
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark theme
                        </p>
                      </div>
                    </div>
                    <ThemeSwitch id="theme-toggle" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
