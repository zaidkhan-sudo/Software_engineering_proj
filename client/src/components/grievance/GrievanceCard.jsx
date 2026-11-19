import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { Building2, Calendar, MapPin, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import Card, { CardContent } from '../common/Card';

export const GrievanceCard = ({ grievance, linkPrefix = '/citizen/grievances' }) => {
  if (!grievance) return null;

  const departmentName = grievance.department?.name || 'Department Assigned';

  return (
    <Card className="hover:border-slate-300 transition-colors shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Header: Tracking ID & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
              {grievance.trackingId}
            </span>
            {grievance.escalated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Escalated
              </span>
            )}
            {grievance.reopenCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                <RotateCcw className="w-3 h-3 text-amber-600" /> Reopened
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <PriorityBadge priority={grievance.priority} />
            <StatusBadge status={grievance.status} />
          </div>
        </div>

        {/* Title and Category */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-1">
            {grievance.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {grievance.description}
          </p>
        </div>

        {/* Footer Meta & Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {departmentName}
            </span>
            {grievance.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[150px] truncate">{grievance.location}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(grievance.createdAt)}
            </span>
          </div>

          <Link
            to={`${linkPrefix}/${grievance._id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrievanceCard;
