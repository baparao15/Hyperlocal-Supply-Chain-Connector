import { cn } from '@/lib/utils';
import { Leaf } from 'lucide-react';

export const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'p-1.5 bg-primary rounded-md inline-block',
        className
      )}
    >
      <Leaf className="size-full text-primary-foreground" />
    </div>
  );
};
