'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Leaf, UtensilsCrossed, Truck, Loader2, Mail, MapPin, User, CreditCard } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  location: z.object({
    address: z.string().min(5, { message: 'Please enter a valid address.' }),
    city: z.string().min(2, { message: 'Please enter a valid city.' }),
    state: z.string().min(2, { message: 'Please enter a valid state.' }),
  }),
  bankDetails: z.object({
    accountNumber: z.string().min(10, { message: 'Please enter a valid account number.' }),
    ifscCode: z.string().min(8, { message: 'Please enter a valid IFSC code.' }),
    accountHolderName: z.string().min(2, { message: 'Please enter account holder name.' }),
  }),
  language: z.enum(['en', 'te']).default('en'),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

type LoginFormValue = z.infer<typeof loginSchema>;
type SignupFormValue = z.infer<typeof signupSchema>;
type OtpFormValue = z.infer<typeof otpSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onRoleChange?: (role: 'farmer' | 'restaurant' | 'transporter') => void;
}

export function AuthForm({ mode, onRoleChange }: AuthFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);

  const defaultRole = searchParams.get('role') || 'farmer';
  const [role, setRole] = React.useState(defaultRole);

  const loginForm = useForm<LoginFormValue>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
    },
  });

  const signupForm = useForm<SignupFormValue>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      phone: '',
      name: '',
      location: {
        address: '',
        city: '',
        state: '',
      },
      bankDetails: {
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
      },
      language: 'en',
    },
  });

  const otpForm = useForm<OtpFormValue>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Reset OTP form when OTP is sent
  React.useEffect(() => {
    if (otpSent) {
      otpForm.reset({ otp: '' });
      // Force clear the field value
      setTimeout(() => {
        otpForm.setValue('otp', '');
      }, 100);
    }
  }, [otpSent, otpForm]);

  const sendOTP = async (data: LoginFormValue | SignupFormValue) => {
    setOtpLoading(true);
    try {
      let requestBody;
      
      if (mode === 'login') {
        // For login, only send email
        requestBody = {
          email: data.email,
          userType: role
        };
      } else {
        // For signup, send all signup fields
        const signupData = data as SignupFormValue;
        requestBody = {
          email: signupData.email,
          phone: signupData.phone,
          name: signupData.name,
          userType: role,
          location: {
            coordinates: [78.4867, 17.3850], // Default Hyderabad coordinates
            address: signupData.location.address,
            city: signupData.location.city,
            state: signupData.location.state
          },
          bankDetails: {
            accountNumber: signupData.bankDetails.accountNumber,
            ifscCode: signupData.bankDetails.ifscCode,
            accountHolderName: signupData.bankDetails.accountHolderName
          },
          language: signupData.language || 'en'
        };
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        toast({
          title: 'OTP Sent!',
          description: 'Please check your email for the verification code.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to send OTP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async (data: OtpFormValue) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: mode === 'login' ? loginForm.getValues('email') : signupForm.getValues('email'),
          otp: data.otp,
        }),
      });

      const result = await response.json();
      console.log('OTP Verification Response:', result);

      if (result.success) {
        // Store token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        toast({
          title: 'Verification Successful!',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Invalid OTP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginSubmit = async (data: LoginFormValue) => {
    await sendOTP(data);
  };

  const onSignupSubmit = async (data: SignupFormValue) => {
    await sendOTP(data);
  };

  const roleConfig = {
    farmer: { icon: Leaf, label: 'Farmer' },
    restaurant: { icon: UtensilsCrossed, label: 'Restaurant' },
    transporter: { icon: Truck, label: 'Transporter' },
  };

  if (otpSent) {
    return (
      <div className={cn('grid gap-6')}>
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="text-2xl font-bold">Verify Your Email</h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to {mode === 'login' ? loginForm.getValues('email') : signupForm.getValues('email')}
          </p>
        </div>
        
        <Form {...otpForm} key="otp-form">
          <form onSubmit={otpForm.handleSubmit(verifyOTP)} className="space-y-4">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter OTP</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="123456"
                      maxLength={6}
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest"
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        console.log('OTP Input changed:', value);
                        if (value.length <= 6) {
                          field.onChange(value);
                        }
                      }}
                      onBlur={field.onBlur}
                      name="otp"
                      ref={field.ref}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isLoading} className="w-full" type="submit">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setOtpSent(false)}
            >
              Back to Registration
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6')}>
      <Tabs value={role} onValueChange={(value) => {
          setRole(value);
          onRoleChange?.(value as 'farmer' | 'restaurant' | 'transporter');
        }} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(roleConfig).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {mode === 'login' ? (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button disabled={isLoading || otpLoading} className="w-full" type="submit">
              {(isLoading || otpLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <FormField
              control={signupForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={signupForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Location Details</h3>
            <FormField
              control={signupForm.control}
              name="location.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="123 Main Street, Area"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={signupForm.control}
                name="location.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Hyderabad"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="location.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Telangana"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Bank Details</h3>
            <FormField
              control={signupForm.control}
              name="bankDetails.accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="1234567890"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={signupForm.control}
                name="bankDetails.ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="SBIN0001234"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signupForm.control}
                name="bankDetails.accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
            <FormField
              control={signupForm.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      {...field}
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button disabled={isLoading || otpLoading} className="w-full" type="submit">
              {(isLoading || otpLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
