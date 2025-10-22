import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
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
  const { toast } = useToast();
  
  // Pick one random tagline on mount
  const [selectedTagline] = useState(() => 
    taglines[Math.floor(Math.random() * taglines.length)]
  );
  
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      return { score, label: 'Weak', color: 'bg-destructive', percentage: 33 };
    } else if (score === 3) {
      return { score, label: 'Fair', color: 'bg-accent/50', percentage: 66 };
    } else {
      return { score, label: 'Strong', color: 'bg-primary', percentage: 100 };
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

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }

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
      toast({
        title: "Account created successfully!",
        description: "Please sign in to start your fitness journey.",
        duration: 5000,
      });
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

  const inputClasses = "w-full bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground px-4 py-3 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors";

  const passwordInputClasses = `${inputClasses} pr-10`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Hero Section */}
        <section className="lg:w-1/2 flex flex-col justify-center space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Welcome to Your AI Fitness Journey
            </h1>
            <p className="text-xl text-muted-foreground italic">
              "{selectedTagline}"
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-secondary/20 border border-border/20">
                <span className="text-2xl flex-shrink-0 mt-0.5">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Trust Indicators */}
          <div className="space-y-2 pt-6 border-t border-border/20">
            <div className="flex items-center justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="mr-2">🔒</span>
              <span>Your data is secure and private</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="mr-2">✨</span>
              <span>Free to start, no credit card required</span>
            </div>
          </div>
        </section>

        {/* Auth Form Card */}
        <section className="lg:w-1/2 flex justify-center">
          <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-foreground">
                Access Your Dashboard
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Message */}
              {error && (
                <div 
                  role="alert" 
                  aria-live="assertive"
                  className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                >
                  <div className="flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-transparent border border-input/50 rounded-xl p-1 mb-6 justify-items-center">
                  <TabsTrigger 
                    value="signin"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg py-3 px-3 transition-all hover:bg-accent/50 aria-selected:shadow-inner"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg py-3 px-3 transition-all hover:bg-accent/50 aria-selected:shadow-inner"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin" className="space-y-6">
                  <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-foreground font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        aria-describedby={signInEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail) ? "email-error" : undefined}
                        className={inputClasses}
                      />
                      {signInEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail) && (
                        <p id="email-error" className="text-xs text-destructive ml-1">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-foreground font-medium">
                          Password
                        </Label>
                        <a 
                          href="#" 
                          className="text-xs text-primary hover:text-primary-foreground transition-colors"
                          aria-label="Forgot your password?"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                          className={passwordInputClasses}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        >
                          {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !signInEmail || !signInPassword}
                      className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 animate-spin">⏳</span>
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/20"></span>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-background text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      variant="outline"
                      className="w-full border-border bg-background text-foreground hover:bg-accent/50 transition-colors rounded-xl py-3 font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
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
                      Continue with Google
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="space-y-6">
                  <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-foreground font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        minLength={2}
                        className={inputClasses}
                      />
                      {fullName && fullName.trim().length < 2 && (
                        <p className="text-xs text-destructive ml-1">Full name must be at least 2 characters</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-foreground font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        aria-describedby={signUpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail) ? "signup-email-error" : undefined}
                        className={inputClasses}
                      />
                      {signUpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail) && (
                        <p id="signup-email-error" className="text-xs text-destructive ml-1">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="signup-password" className="text-foreground font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          className={passwordInputClasses}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                        >
                          {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Password Strength Indicator */}
                      {signUpPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Password Strength:</span>
                            <span className={`font-semibold ${
                              passwordStrength.label === 'Weak' ? 'text-destructive' :
                              passwordStrength.label === 'Fair' ? '!text-yellow-500' :
                              'text-primary'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <Progress 
                            value={passwordStrength.percentage} 
                            className={`h-2 ${passwordStrength.score < 4 ? 'bg-destructive/20' : 'bg-primary/20'}`}
                          />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className={`${signUpPassword.length >= 8 ? 'text-primary' : 'text-destructive'}`}>
                              {signUpPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                            </div>
                            <div className={`${
                              /[A-Z]/.test(signUpPassword) ? 'text-primary' : 'text-destructive'
                            }`}>
                              {/[A-Z]/.test(signUpPassword) ? '✓' : '○'} One uppercase letter
                            </div>
                            <div className={`${
                              /[a-z]/.test(signUpPassword) ? 'text-primary' : 'text-destructive'
                            }`}>
                              {/[a-z]/.test(signUpPassword) ? '✓' : '○'} One lowercase letter
                            </div>
                            <div className={`${
                              /[0-9]/.test(signUpPassword) ? 'text-primary' : 'text-destructive'
                            }`}>
                              {/[0-9]/.test(signUpPassword) ? '✓' : '○'} One number
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-foreground font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={passwordInputClasses}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {confirmPassword && signUpPassword !== confirmPassword && (
                        <p className="text-xs text-destructive ml-1">Passwords do not match</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || passwordStrength.score < 4 || signUpPassword !== confirmPassword || !signUpEmail || !fullName || !signUpPassword}
                      className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 animate-spin">⏳</span>
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/20"></span>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-background text-muted-foreground">Or sign up with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      variant="outline"
                      className="w-full border-border bg-background text-foreground hover:bg-accent/50 transition-colors rounded-xl py-3 font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
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
                      Continue with Google
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Login;
