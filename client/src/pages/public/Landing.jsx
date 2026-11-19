import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, FileText, Hash, CheckCircle, Users, ShieldCheck, BarChart3, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';
import Card, { CardContent } from '../../components/common/Card';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-semibold text-slate-900 block leading-tight">
                Public Grievance Redressal
              </span>
              <span className="text-xs text-slate-500 block">
                Municipal Administration Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Register Citizen
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-100 text-primary-700 rounded-full text-xs font-medium">
            <span>Official Civic Grievance System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
            Transparent Municipal Complaint Redressal & Resolution
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report civic infrastructure issues directly to your municipal council, receive an atomic tracking ID, and monitor resolution in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/register">
              <Button variant="primary" size="lg" iconRight={ArrowRight}>
                Report a Grievance
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works (3 Steps) */}
        <section className="py-12 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
              <h2 className="text-2xl font-semibold text-slate-900">How It Works</h2>
              <p className="text-sm text-slate-500">Three straightforward steps to civic resolution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-900">File Grievance</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit details of roads, water supply, electricity, or sanitation defects along with photo attachments and exact location.
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-900">Get Unique Tracking ID</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive an automated, sequential reference ID (e.g. <code>GRV-2026-000042</code>) routed immediately to the accountable department.
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-900">Real-Time Resolution</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Track the full audit timeline, receive live WebSocket status updates, and provide satisfaction feedback once closed.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900">Platform Stakeholders</h2>
            <p className="text-sm text-slate-500">Structured workflows tailored for each municipal participant</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="space-y-3">
                <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Citizens</h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>File complaints with image attachments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Live status timeline and officer remarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>One-time reopen right for unresolved cases</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Department Officers</h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Department-scoped grievance dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Mandatory transition remarks and SLA adherence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Internal notes for staff-only field coordination</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Municipal Admins</h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>City-wide analytics and average resolution times</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Full chronological audit log of all actions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Automated escalation alerts for overdue cases</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>Public Grievance Redressal System — City Municipal Services Portal</p>
        <p className="text-slate-400">Desktop & Web Client v1.0.0</p>
      </footer>
    </div>
  );
};

export default Landing;
