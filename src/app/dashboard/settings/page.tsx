'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save, User, MapPin, CreditCard, Globe, Bell } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  language: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    location: {
      address: '',
      city: '',
      state: ''
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    },
    language: 'en'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load user profile from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setProfile({
        name: user.profile?.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: {
          address: user.profile?.location?.address || '',
          city: user.profile?.location?.city || '',
          state: user.profile?.location?.state || ''
        },
        bankDetails: {
          accountNumber: user.profile?.bankDetails?.accountNumber || '',
          ifscCode: user.profile?.bankDetails?.ifscCode || '',
          accountHolderName: user.profile?.bankDetails?.accountHolderName || ''
        },
        language: user.profile?.language || 'en'
      });
    }
    setIsLoading(false);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user profile
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.profile = {
          ...user.profile,
          ...profile
        };
        localStorage.setItem('user', JSON.stringify(user));
      }

      toast({
        title: 'Settings Saved',
        description: 'Your profile has been updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Information
            </CardTitle>
            <CardDescription>
              Update your location details for better service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.location.address}
                onChange={(e) => setProfile({
                  ...profile,
                  location: { ...profile.location, address: e.target.value }
                })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.location.city}
                  onChange={(e) => setProfile({
                    ...profile,
                    location: { ...profile.location, city: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.location.state}
                  onChange={(e) => setProfile({
                    ...profile,
                    location: { ...profile.location, state: e.target.value }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Update your bank account information for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={profile.bankDetails.accountNumber}
                onChange={(e) => setProfile({
                  ...profile,
                  bankDetails: { ...profile.bankDetails, accountNumber: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={profile.bankDetails.ifscCode}
                  onChange={(e) => setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, ifscCode: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={profile.bankDetails.accountHolderName}
                  onChange={(e) => setProfile({
                    ...profile,
                    bankDetails: { ...profile.bankDetails, accountHolderName: e.target.value }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
            <CardDescription>
              Customize your experience on the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={profile.language} onValueChange={(value) => setProfile({ ...profile, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
