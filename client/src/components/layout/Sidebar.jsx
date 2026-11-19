import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  UserCheck,
  Building2,
  Users,
  Tag,
  ClipboardList,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || ROLES.CITIZEN;

  const getNavLinks = () => {
    switch (role) {
      case ROLES.ADMIN:
        return [
          { to: '/admin', label: 'Operations Overview', icon: LayoutDashboard, end: true },
          { to: '/admin/analytics', label: 'Analytics Reports', icon: BarChart3 },
          { to: '/admin/grievances', label: 'All Grievances', icon: FileText },
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          { to: '/admin/audit-logs', label: 'System Audit Logs', icon: ClipboardList }
        ];

      case ROLES.OFFICER:
        return [
          { to: '/officer', label: 'Department Overview', icon: LayoutDashboard, end: true },
          { to: '/officer/grievances', label: 'Complaints Queue', icon: FileText },
          { to: '/officer/profile', label: 'Officer Profile', icon: UserCheck }
        ];

      case ROLES.CITIZEN:
      default:
        return [
          { to: '/citizen', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/citizen/file', label: 'File Grievance', icon: PlusCircle },
          { to: '/citizen/grievances', label: 'My Grievances', icon: FileText },
          { to: '/citizen/track', label: 'Track by ID', icon: Search },
          { to: '/citizen/profile', label: 'Citizen Profile', icon: UserCheck }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between select-none">
      <div className="p-4 space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-base rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Civic Network Connected</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Municipal Redressal System &bull; v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
