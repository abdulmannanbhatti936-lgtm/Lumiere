import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, changePasswordSchema, type ProfileUpdateInput, type ChangePasswordInput } from '@shared/validation';
import { TRPCClientError } from '@trpc/client';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Reveal from '@/components/motion/Reveal';
import BackButton from '@/components/common/BackButton';

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const changePassword = trpc.users.changePassword.useMutation();

  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onProfileSubmit = async (values: ProfileUpdateInput) => {
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile.mutateAsync(values);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof TRPCClientError ? err.message : 'Could not update your profile.');
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordInput) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await changePassword.mutateAsync(values);
      setPasswordSuccess('Password changed successfully.');
      passwordForm.reset();
    } catch (err) {
      setPasswordError(err instanceof TRPCClientError ? err.message : 'Could not change your password.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="container max-w-2xl space-y-8">
        <BackButton fallbackHref="/" />
        <Reveal>
          <span className="label-caps mb-4 block">Account</span>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">My Profile</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-normal">Profile Information</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {profileSuccess && <p className="text-sm font-medium text-accent">{profileSuccess}</p>}
                  {profileError && <p className="text-sm font-medium text-destructive">{profileError}</p>}

                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.2}>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-normal">Change Password</CardTitle>
              <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {passwordSuccess && <p className="text-sm font-medium text-accent">{passwordSuccess}</p>}
                  {passwordError && <p className="text-sm font-medium text-destructive">{passwordError}</p>}

                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? 'Updating...' : 'Change Password'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
