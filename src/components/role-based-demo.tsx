'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, UtensilsCrossed, Truck, Copy } from 'lucide-react';

const demoUsers = {
  farmer: {
    email: 'farmer1@example.com',
    username: 'Rajesh Kumar',
    role: 'Farmer',
    location: 'Hyderabad, Telangana',
    otp: '123456',
    color: 'green',
    icon: Leaf
  },
  restaurant: {
    email: 'restaurant1@example.com',
    username: 'Spice Garden Restaurant',
    role: 'Restaurant',
    location: 'Hyderabad, Telangana',
    otp: '123456',
    color: 'blue',
    icon: UtensilsCrossed
  },
  transporter: {
    email: 'transporter1@example.com',
    username: 'Ravi Transport Services',
    role: 'Transporter',
    location: 'Hyderabad, Telangana',
    otp: '123456',
    color: 'orange',
    icon: Truck
  }
};

interface RoleBasedDemoProps {
  selectedRole: 'farmer' | 'restaurant' | 'transporter';
}

export function RoleBasedDemo({ selectedRole }: RoleBasedDemoProps) {
  const user = demoUsers[selectedRole];
  const IconComponent = user.icon;
  
  const colorClasses = {
    green: {
      badge: 'bg-green-100 text-green-800',
      otp: 'bg-green-100 text-green-800',
      icon: 'text-green-600'
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800',
      otp: 'bg-blue-100 text-blue-800',
      icon: 'text-blue-600'
    },
    orange: {
      badge: 'bg-orange-100 text-orange-800',
      otp: 'bg-orange-100 text-orange-800',
      icon: 'text-orange-600'
    }
  };

  const colors = colorClasses[user.color as keyof typeof colorClasses];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${colors.icon}`} />
          {user.role} Account
        </CardTitle>
        <CardDescription>
          Sample {user.role.toLowerCase()} account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {user.email}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.email);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">OTP:</span>
            <code className={`text-sm font-mono ${colors.otp} px-2 py-1 rounded`}>
              {user.otp}
            </code>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Copy the email above and use it in the login form. Use the OTP: <strong>{user.otp}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
