'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const configError = !auth ? 'Firebase is not initialized. Check your .env.local file and restart the dev server.' : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: unknown) {
      let message = 'Failed to sign in';
      if (err instanceof Error) {
        const code = (err as FirebaseError).code;
        switch (code) {
          case 'auth/invalid-api-key':
            message = 'Invalid Firebase API key. Check your .env.local file.';
            break;
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            message = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            message = 'This email is already registered.';
            break;
          case 'auth/weak-password':
            message = 'Password should be at least 6 characters.';
            break;
          case 'auth/popup-closed-by-user':
            message = 'Google sign-in was cancelled.';
            break;
          case 'auth/unauthorized-domain':
            message = 'Domain not authorized in Firebase Console. Add localhost to authorized domains.';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Check your connection.';
            break;
          default:
            message = `${code}: ${err.message}`;
        }
      }
      setError(message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting Google sign-in...');
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      console.log('Firebase auth available:', auth.app.options.projectId);
      const user = await signInWithGoogle();
      console.log('Google sign-in successful for user:', user?.email || user?.uid);
      console.log('About to redirect to /');
      router.push('/');
      console.log('Redirect called');
      
      // Also log the current path after redirect
      setTimeout(() => {
        console.log('Current path after redirect:', window.location.pathname);
      }, 1000);
    } catch (err: unknown) {
      console.log('Entering catch block');
      let message = 'Failed to sign in with Google';
      if (err instanceof Error) {
        const code = (err as FirebaseError).code;
        console.error('Google auth error details:', { code, message: err.message, stack: err.stack });
        switch (code) {
          case 'auth/popup-closed-by-user':
            message = 'Google sign-in was cancelled.';
            break;
          case 'auth/unauthorized-domain':
            message = 'Domain not authorized in Firebase Console. Add localhost to authorized domains.';
            break;
          case 'auth/popup-blocked':
            message = 'Popup was blocked by browser. Allow popups for this site.';
            break;
          case 'auth/operation-not-allowed':
            message = 'Google sign-in is not enabled in Firebase Console. Enable it in Authentication > Sign-in method.';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Check your connection.';
            break;
          default:
            message = `${code || 'Unknown'}: ${err.message}`;
        }
      }
      setError(message);
      console.error('Google auth error:', err);
    } finally {
      console.log('Entering finally block');
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your Personal Dairy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>{configError}</AlertDescription>
            </Alert>
          )}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
