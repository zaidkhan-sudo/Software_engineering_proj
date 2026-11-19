import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { userApi, departmentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, formatDate } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Card, { CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ROLES.OFFICER,
    department: '',
    phone: '',
    password: ''
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentApi.getDepartments();
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await userApi.getUsers(params);
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: ROLES.OFFICER,
      department: departments.length > 0 ? departments[0]._id : '',
      phone: '',
      password: ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || ROLES.CITIZEN,
      department: u.department?._id || u.department || '',
      phone: u.phone || '',
      password: ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const { name, email, role, department, phone, password } = formData;

    if (!name.trim() || name.trim().length < 2) {
      setModalError('Name must be at least 2 characters long.');
      return;
    }

    if (!editingUser) {
      if (!email.trim()) {
        setModalError('Email address is required.');
        return;
      }
      if (!password || password.length < 8) {
        setModalError('Password must be at least 8 characters long.');
        return;
      }
      if (role === ROLES.OFFICER && !department) {
        setModalError('Officers must be assigned to an active department.');
        return;
      }
    }

    setModalSubmitting(true);
    try {
      if (editingUser) {
        const updatePayload = {
          name: name.trim(),
          phone: phone.trim() || undefined
        };
        if (role !== editingUser.role) updatePayload.role = role;
        if (role === ROLES.OFFICER && department) updatePayload.department = department;
        if (password) updatePayload.password = password;

        await userApi.updateUser(editingUser._id, updatePayload);
        toast.success(`User "${name}" updated successfully.`);
      } else {
        await userApi.createUser({
          name: name.trim(),
          email: email.trim(),
          role,
          department: role === ROLES.OFFICER ? department : undefined,
          phone: phone.trim() || undefined,
          password
        });
        toast.success(`New ${role} account created successfully.`);
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleActive = async (u) => {
    if (u._id === currentUser?._id) {
      toast.error('Security constraint: Administrators cannot deactivate their own active account.');
      return;
    }

    const action = u.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${u.name}'s account?`)) {
      return;
    }

    try {
      if (u.isActive) {
        await userApi.deleteUser(u._id);
        toast.success(`User account deactivated.`);
      } else {
        await userApi.updateUser(u._id, { isActive: true });
        toast.success(`User account reactivated.`);
      }
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal User & Staff Directory"
        description="Provision officer accounts, assign departmental roles, and manage system access authorizations."
        action={
          <Button variant="primary" iconLeft={PlusCircle} onClick={openCreateModal}>
            Provision Staff User
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />

            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Roles' },
                { value: ROLES.ADMIN, label: 'Administrators' },
                { value: ROLES.OFFICER, label: 'Department Officers' },
                { value: ROLES.CITIZEN, label: 'Citizens' }
              ]}
            />

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setPage(1);
                  fetchUsers();
                }}
              >
                Search Directory
              </Button>
              {(search || roleFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('');
                    setPage(1);
                  }}
                  className="text-slate-500"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No users match the search criteria"
              description="Try adjusting your filters or search keywords."
              actionText="Reset Filters"
              onAction={() => {
                setSearch('');
                setRoleFilter('');
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>User Name</TableHeader>
                  <TableHeader>Email & Contact</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Assigned Department</TableHeader>
                  <TableHeader>Account Status</TableHeader>
                  <TableHeader>Joined</TableHeader>
                  <TableHeader className="text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const isCurrent = u._id === currentUser?._id;

                  return (
                    <TableRow key={u._id} className={!u.isActive ? 'bg-slate-50/60 opacity-75' : ''}>
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-100 text-primary-700 font-bold">
                              You
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        <div>{u.email}</div>
                        {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                            u.role === ROLES.ADMIN
                              ? 'bg-purple-50 text-primary-700 border border-primary-200'
                              : u.role === ROLES.OFFICER
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        {u.role === ROLES.OFFICER ? (
                          u.department?.name || 'Department Assigned'
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Deactivated
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </TableCell>

                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(u)}
                          iconLeft={Edit}
                          className="text-slate-600 hover:text-primary-600"
                        >
                          Edit
                        </Button>

                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(u)}
                            iconLeft={Power}
                            className={u.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                            title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {pagination.pages > 1 && (
            <div className="pt-2">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}

      {/* User Provisioning Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? `Edit Account: ${editingUser.name}` : 'Provision Staff Account'}
        >
          <form onSubmit={handleModalSubmit} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <Input
              label="Legal Full Name"
              required
              placeholder="e.g. Anand K. Patil"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            {!editingUser && (
              <Input
                label="Municipal Staff Email Address"
                required
                type="email"
                placeholder="officer.roads2@grievance.local"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Access Role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: ROLES.OFFICER, label: 'Department Officer' },
                  { value: ROLES.ADMIN, label: 'System Administrator' },
                  ...(editingUser ? [{ value: ROLES.CITIZEN, label: 'Citizen' }] : [])
                ]}
              />

              {formData.role === ROLES.OFFICER && (
                <Select
                  label="Assigned Department"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  options={departments.map((d) => ({
                    value: d._id,
                    label: d.name
                  }))}
                />
              )}
            </div>

            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label={editingUser ? 'Reset Password (Leave blank to keep current)' : 'Account Password'}
              required={!editingUser}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters."
            />

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={modalSubmitting}
              >
                {editingUser ? 'Save Updates' : 'Provision User'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManageUsers;
