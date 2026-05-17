import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-rose-400 hover:bg-rose-500 text-white rounded-full px-6">
              Go Home
            </Button>
          </Link>
          <Link href="/app">
            <Button variant="outline" className="rounded-full px-6">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
