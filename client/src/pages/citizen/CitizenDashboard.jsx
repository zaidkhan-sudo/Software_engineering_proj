import React from 'react';
import { PlusCircle, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const CitizenDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'Citizen'}`}
        description="Monitor status updates, lodge new civic issues, and track your active grievances."
        action={
          <Link to="/citizen/file">
            <Button variant="primary" iconLeft={PlusCircle}>
              File New Grievance
            </Button>
          </Link>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Filed</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area (Phase 10 placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Grievance Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="You haven't filed any grievances yet"
            description="When you report local civic issues (such as potholes, water supply, or streetlights), they will appear here with live progress tracking."
            actionText="File your first grievance"
            onAction={() => window.location.hash = '#/citizen/file'}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenDashboard;
