import React from 'react';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import { ArrowRight, UserCheck, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

export const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 text-center">
        No status transitions recorded yet.
      </div>
    );
  }

  // Ensure chronological order (oldest first for timeline progression)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedHistory.map((item, index) => {
          const isLast = index === sortedHistory.length - 1;
          const role = item.changedBy?.role || 'staff';

          return (
            <li key={item._id || index}>
              <div className="relative pb-8">
                {/* Connecting vertical line */}
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Status Indicator Icon */}
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 ring-4 ring-white">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="min-w-0 flex-1 pt-1.5 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.fromStatus && (
                        <>
                          <StatusBadge status={item.fromStatus} />
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </>
                      )}
                      <StatusBadge status={item.toStatus} />

                      <span className="text-xs text-slate-400 ml-auto">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <span>Changed by:</span>
                      <span className="font-medium text-slate-800">
                        {item.changedBy?.name || 'Department Staff'}
                      </span>
                      {role && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium capitalize">
                          {role}
                        </span>
                      )}
                    </div>

                    {item.remark && (
                      <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed font-sans">
                        <span className="font-medium text-slate-900">Remark: </span>
                        {item.remark}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default StatusTimeline;
