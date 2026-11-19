import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
  Power,
  RotateCcw
} from 'lucide-react';
import { departmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, formatDate } from '../../utils/helpers';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import Card, { CardContent } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

export const ManageDepartments = () => {
  const toast = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoriesInput: ''
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await departmentApi.getDepartments();
      if (res.data?.success) {
        setDepartments(res.data.data.departments || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', categoriesInput: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      categoriesInput: (dept.categoriesHandled || []).join(', ')
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const { name, description, categoriesInput } = formData;
    if (!name.trim() || name.trim().length < 2) {
      setModalError('Department name must be at least 2 characters.');
      return;
    }

    const categories = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (categories.length === 0) {
      setModalError('Please define at least one category handled by this department.');
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingDept) {
        await departmentApi.updateDepartment(editingDept._id, {
          name: name.trim(),
          description: description.trim(),
          categoriesHandled: categories
        });
        toast.success(`Department "${name.trim()}" updated successfully.`);
      } else {
        await departmentApi.createDepartment({
          name: name.trim(),
          description: description.trim(),
          categoriesHandled: categories
        });
        toast.success(`Department "${name.trim()}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleActive = async (dept) => {
    const actionName = dept.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionName} department "${dept.name}"?`)) {
      return;
    }

    try {
      if (dept.isActive) {
        await departmentApi.deleteDepartment(dept._id);
        toast.success(`Department "${dept.name}" deactivated.`);
      } else {
        await departmentApi.updateDepartment(dept._id, { isActive: true });
        toast.success(`Department "${dept.name}" reactivated.`);
      }
      fetchDepartments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredDepts = departments.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.categoriesHandled || []).some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Departments"
        description="Configure municipal divisions, assign accountable complaint categories, and manage operational status."
        action={
          <Button variant="primary" iconLeft={PlusCircle} onClick={openCreateModal}>
            Add Department
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="max-w-md">
            <Input
              placeholder="Search departments or categories handled..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Table */}
      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ) : filteredDepts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Building2}
              title="No departments found"
              description={search ? 'No departments match your search keywords.' : 'No departments configured yet.'}
              actionText={search ? 'Clear Search' : 'Create First Department'}
              onAction={search ? () => setSearch('') : openCreateModal}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Department Name</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Auto-Routed Categories</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepts.map((d) => (
                <TableRow key={d._id} className={!d.isActive ? 'bg-slate-50/60 opacity-75' : ''}>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span>{d.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 max-w-xs">
                    {d.description || '—'}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {(d.categoriesHandled || []).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-200"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(d.createdAt)}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(d)}
                      iconLeft={Edit}
                      className="text-slate-600 hover:text-primary-600"
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(d)}
                      iconLeft={Power}
                      className={d.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                      title={d.isActive ? 'Deactivate Department' : 'Reactivate Department'}
                    >
                      {d.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Municipal Department'}
        >
          <form onSubmit={handleModalSubmit} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <Input
              label="Department Name"
              required
              placeholder="e.g. Roads & Infrastructure Division"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Textarea
              label="Scope / Description"
              rows={3}
              placeholder="Primary responsibilities and jurisdiction of this municipal division..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Input
              label="Categories Handled (Comma Separated)"
              required
              placeholder="e.g. Roads, Potholes, Footpaths, Bridges"
              value={formData.categoriesInput}
              onChange={(e) => setFormData({ ...formData, categoriesInput: e.target.value })}
              helperText="Complaints filed under these categories will automatically route to this department."
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
                {editingDept ? 'Update Department' : 'Create Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManageDepartments;
