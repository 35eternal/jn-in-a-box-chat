import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const taglines = [
  "Your AI-Powered Fitness Coach",
  "Transform Your Body with AI",
  "Personalized Training That Adapts",
  "Science-Backed 24/7 Coaching"
];

const features = [
  {
    icon: "💬",
    title: "Personalized Coaching",
    description: "AI conversations tailored to your goals"
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description: "Monitor your transformation journey"
  },
  {
    icon: "🎯",
    title: "Custom Plans",
    description: "Workouts and nutrition designed for you"
  },
  {
    icon: "🤖",
    title: "Always Available",
    description: "24/7 access to your AI coach"
  }
];

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  percentage: number;
}

const Login = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  
  // Pick one random tagline on mount
  const [selectedTagline] = useState(() => 
    taglines[Math.floor(Math.random() * taglines.length)]
  );
  
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('signin');

  useEffect(() => {
    if (session && !loading) {
      navigate('/chat');
    }
  }, [session, loading, navigate]);

  // Calculate password strength
  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };

    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.number) score++;

    if (score <= 2) {
      return { score, label: 'Weak', color: 'bg-red-500', percentage: 33 };
    } else if (score === 3) {
      return { score, label: 'Fair', color: 'bg-yellow-500', percentage: 66 };
    } else {
      return { score, label: 'Strong', color: 'bg-green-500', percentage: 100 };
    }
  };

  const passwordStrength = getPasswordStrength(signUpPassword);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    if (passwordStrength.score < 4) {
      setError('Please create a stronger password that meets all requirements');
      return;
    }

    // Validate passwords match
    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          emailRedirectTo: window.location.origin + '/chat',
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      
      // Auto-confirmed, user can now sign in
      setError('');
      setActiveTab('signin');
      setSignInEmail(signUpEmail);
      setSignInPassword('');
      alert('Account created! Please sign in.');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/chat',
        }
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] p-4">
      <div className="w-full max-w-5xl">
        {/* Static Tagline with Subtitle */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
            {selectedTagline}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light">
            Join thousands transforming their fitness journey
          </p>
        </div>

        {/* Feature Highlights - More Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="bg-gradient-to-b from-[hsl(174,40%,20%)] to-[hsl(174,35%,17%)] border-white/10 hover:border-[hsl(164,65%,50%)]/50 transition-all duration-300"
            >
              <CardHeader className="pb-2 pt-4">
                <div className="text-3xl mb-1">{feature.icon}</div>
                <CardTitle className="text-white text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <CardDescription className="text-white/70 text-xs">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Auth Container with Tabs */}
        <div className="max-w-md mx-auto p-8 bg-gradient-to-b from-[hsl(174,40%,20%)] to-[hsl(174,35%,17%)] rounded-lg shadow-2xl border border-white/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[hsl(174,30%,18%)]">
              <TabsTrigger 
                value="signin"
                className="data-[state=active]:bg-[hsl(164,65%,50%)] data-[state=active]:text-white text-white/70"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="data-[state=active]:bg-[hsl(164,65%,50%)] data-[state=active]:text-white text-white/70"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-white">
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-[hsl(164,65%,50%)] hover:text-[hsl(153,60%,40%)] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[hsl(164,65%,50%)] hover:bg-[hsl(153,60%,40%)] text-white font-semibold"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[hsl(174,35%,17%)] text-white/60">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0 font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                {/* Trust Indicators */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center text-xs text-white/60">
                    <span className="mr-2">🔒</span>
                    <span>Your data is secure and private</span>
                  </div>
                  <div className="flex items-center text-xs text-white/60">
                    <span className="mr-2">✨</span>
                    <span>Free to start, no credit card required</span>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />

                  {/* Password Strength Indicator */}
                  {signUpPassword && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Password Strength:</span>
                        <span className={`text-sm font-semibold ${
                          passwordStrength.label === 'Weak' ? 'text-red-400' :
                          passwordStrength.label === 'Fair' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <Progress 
                        value={passwordStrength.percentage} 
                        className="h-2 bg-white/10"
                      />
                      <div className="text-xs text-white/60 space-y-1 mt-2">
                        <div className={signUpPassword.length >= 8 ? 'text-green-400' : ''}>
                          {signUpPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                        </div>
                        <div className={/[A-Z]/.test(signUpPassword) ? 'text-green-400' : ''}>
                          {/[A-Z]/.test(signUpPassword) ? '✓' : '○'} One uppercase letter
                        </div>
                        <div className={/[a-z]/.test(signUpPassword) ? 'text-green-400' : ''}>
                          {/[a-z]/.test(signUpPassword) ? '✓' : '○'} One lowercase letter
                        </div>
                        <div className={/[0-9]/.test(signUpPassword) ? 'text-green-400' : ''}>
                          {/[0-9]/.test(signUpPassword) ? '✓' : '○'} One number
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-[hsl(174,30%,18%)] border-[hsl(174,30%,30%)] text-white placeholder:text-white/40 focus:border-[hsl(164,65%,50%)]"
                  />
                  {confirmPassword && signUpPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || (signUpPassword && passwordStrength.score < 4) || (confirmPassword && signUpPassword !== confirmPassword)}
                  className="w-full bg-[hsl(164,65%,50%)] hover:bg-[hsl(153,60%,40%)] text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing up...' : 'Sign Up'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[hsl(174,35%,17%)] text-white/60">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0 font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                {/* Trust Indicators */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center text-xs text-white/60">
                    <span className="mr-2">🔒</span>
                    <span>Your data is secure and private</span>
                  </div>
                  <div className="flex items-center text-xs text-white/60">
                    <span className="mr-2">✨</span>
                    <span>Free to start, no credit card required</span>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
