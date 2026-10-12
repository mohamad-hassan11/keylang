import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
      <p className="text-muted-foreground max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}
