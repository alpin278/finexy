import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in-50 duration-200">
      <Card className="max-w-md w-full p-8 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-[#ECECE8]/60 flex items-center justify-center mb-4 text-[#777771]">
          <Compass className="w-7 h-7" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#777771] mb-1">
          404 Error
        </span>
        <h1 className="text-2xl font-bold text-[#171714] mb-2">Page Not Found</h1>
        <p className="text-sm text-[#777771] mb-6 leading-relaxed">
          The requested page could not be found. Please check the URL or return to your financial overview.
        </p>
        <Link to="/overview">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Overview
          </Button>
        </Link>
      </Card>
    </div>
  );
}

export default NotFoundPage;
