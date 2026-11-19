import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Building2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const OfficerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user?.department?.name || 'Departmental'} Operations Desk`}
        description={`Logged in as Officer ${user?.name || ''}. Triage, update, and resolve citizen grievances.`}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Queue Pending</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Under Review</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved This Month</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Complaint Triage Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="No grievances currently assigned"
            description="When citizens lodge issues categorized under your department, they will be queued here for inspection and status transition."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficerDashboard;
