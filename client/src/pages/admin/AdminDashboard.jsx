import React from 'react';
import { BarChart3, Users, Building2, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Administration & Analytics"
        description={`Logged in as ${user?.name || 'Administrator'}. Oversee system performance, department resolution velocity, and audit logs.`}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Grievances</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Departments</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">4</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Staff</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">5</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Escalations</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity & Resolution Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="Analytics Engine Active"
            description="Detailed resolution timelines, category volume distributions, and audit trail metrics will render here."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
