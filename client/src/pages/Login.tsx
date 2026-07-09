import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';
import { Sparkles } from 'lucide-react';
import { loginSchema, type LoginInput } from '@shared/validation';
import { useAuth, getAuthErrorMessage } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values);
      navigate('/');
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80"
          alt=""
          className="w-full h-full object-cover blur-sm scale-105 opacity-40"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute -top-1/4 -left-1/4 w-[50vw] h-[50vw] aurora-glow-teal" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] aurora-glow" />
        <div className="absolute inset-0 hero-vignette" />
      </div>

      <Reveal className="relative z-10 w-full max-w-md">
        <Card className="glass-panel border-white/10 shadow-2xl">
          <CardHeader className="text-center pt-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="text-accent" size={18} />
              <span className="font-serif text-2xl tracking-tight">
                LUMI<span className="text-accent">È</span>RE
              </span>
            </div>
            <CardTitle className="font-serif text-2xl font-normal">Sign in to Lumière Stays</CardTitle>
            <CardDescription>Welcome back — enter your details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

                <Magnetic className="block w-full">
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Magnetic>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
