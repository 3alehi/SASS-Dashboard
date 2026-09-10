import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateProfileSchema, type UpdateProfileInput } from '@/schemas/auth';
import { resendVerificationEmail, updateProfileMetadata } from '@/services/auth-service';

export function ProfileSettingsPage() {
  const { user, fullName, isEmailVerified } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName,
      phone: (user?.user_metadata?.phone as string | undefined) ?? '',
    },
  });

  async function onSubmit(values: UpdateProfileInput) {
    const { error } = await updateProfileMetadata(values);
    if (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: error });
      return;
    }
    toast({ title: 'Profile updated' });
  }

  async function handleResendVerification() {
    if (!user?.email) return;
    const { error } = await resendVerificationEmail(user.email);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not resend email', description: error });
      return;
    }
    toast({ title: 'Verification email sent' });
  }

  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information and account preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{initials || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  aria-invalid={Boolean(errors.fullName)}
                  {...register('fullName')}
                />
                <FormError message={errors.fullName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
                <FormError message={errors.phone?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ''} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change the email on your account.
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>Confirm your email address to secure your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailVerified ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Your email is verified.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Your email address is not verified yet.
              </p>
              <Button variant="outline" size="sm" onClick={handleResendVerification}>
                Resend verification email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
