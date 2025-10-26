'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  userType: 'farmer' | 'restaurant' | 'transporter';
  profile: {
    name: string;
    language: string;
  };
  isVerified: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      
      // Validate user data structure
      if (!parsedUser || !parsedUser.userType || !parsedUser.profile) {
        console.error('Invalid user data structure');
        router.push('/login');
        return;
      }
      
      setUser(parsedUser);
      
      // Route to role-specific dashboard
      const userType = parsedUser.userType;
      if (userType === 'farmer') {
        router.replace('/dashboard/farmer');
      } else if (userType === 'restaurant') {
        router.replace('/dashboard/restaurant');
      } else if (userType === 'transporter') {
        router.replace('/dashboard/transporter');
      } else {
        console.error('Unknown user type:', userType);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to access your dashboard</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {user.profile.name}!</h1>
        <p className="text-muted-foreground">
          Redirecting you to your {user.userType} dashboard...
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user.profile.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</p>
            <p><strong>Language:</strong> {user.profile.language === 'en' ? 'English' : 'Telugu'}</p>
            <p><strong>Status:</strong> {user.isVerified ? 'Verified' : 'Not Verified'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
