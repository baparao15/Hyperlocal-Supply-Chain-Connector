'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  Leaf,
  UtensilsCrossed,
  Truck,
  FileText,
  PlusCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const commonNav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/settings', label: 'Settings', icon: LineChart },
];

const roleNavs = {
  farmer: [
    { href: '/dashboard/products', label: 'My Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/add-product', label: 'Add Product', icon: PlusCircle },
  ],
  restaurant: [
    { href: '/dashboard/farmers', label: 'Find Farmers', icon: Users },
    { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingCart },
  ],
  transporter: [
    { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
    {
      href: '/dashboard/file-complaint',
      label: 'File Complaint',
      icon: FileText,
    },
  ],
};

export function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('farmer');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setRole(parsedUser.userType || 'farmer');
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  }, []);

  const navItems = [...commonNav, ...(roleNavs[role as keyof typeof roleNavs] || [])];

  return (
    <aside className="hidden border-r bg-card lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
            <AppLogo />
            <span>Hyperlocal Supply Chain Connector</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <TooltipProvider>
              {navItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        pathname === item.href && 'bg-secondary text-primary'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
        </div>
      </div>
    </aside>
  );
}
