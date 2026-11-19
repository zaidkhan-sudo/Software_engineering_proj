import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  PlusCircle,
  Building2,
  MapPin,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { categoryApi, grievanceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/helpers';
import { PRIORITIES } from '../../utils/constants';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';

export const FileGrievance = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState([]); // array of File objects
  const [previews, setPreviews] = useState([]); // array of preview URLs

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submittedGrievance, setSubmittedGrievance] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load active categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.data?.success) {
          const list = res.data.data.categories || [];
          setCategories(list);
          if (list.length > 0) {
            setCategory(list[0]);
          }
        }
      } catch (err) {
        setFormError('Failed to load categories. Please verify backend connection.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle image files selection with client-side checks
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFormError(null);

    if (attachments.length + selectedFiles.length > 2) {
      setFormError('Maximum 2 attachments allowed per grievance.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of selectedFiles) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setFormError('Only JPG and PNG files are allowed.');
        return;
      }
      if (file.size > 1024 * 1024) {
        setFormError(`"${file.name}" exceeds 1 MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachment = (index) => {
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyId = () => {
    if (submittedGrievance?.trackingId) {
      navigator.clipboard.writeText(submittedGrievance.trackingId);
      setCopied(true);
      toast.success('Tracking ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    if (categories.length > 0) setCategory(categories[0]);
    setPriority('medium');
    setLocation('');
    previews.forEach((p) => URL.revokeObjectURL(p));
    setAttachments([]);
    setPreviews([]);
    setSubmittedGrievance(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation matching backend Joi
    if (!title.trim() || title.trim().length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Description must be at least 10 characters long.');
      return;
    }
    if (!category) {
      setFormError('Please select a valid municipal category.');
      return;
    }
    if (!location.trim() || location.trim().length < 3) {
      setFormError('Please provide a specific street address or landmark location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', title.trim());
      data.append('description', description.trim());
      data.append('category', category);
      data.append('priority', priority);
      data.append('location', location.trim());

      attachments.forEach((file) => {
        data.append('attachments', file);
      });

      const res = await grievanceApi.fileGrievance(data);
      if (res.data?.success && res.data?.data?.grievance) {
        setSubmittedGrievance(res.data.data.grievance);
        toast.success('Grievance filed successfully!');
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedGrievance) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="border-emerald-200 bg-white">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Grievance Lodged Successfully
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your report has been received and automatically routed to the accountable municipal department.
              </p>
            </div>

            {/* Prominent Tracking ID Container */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto space-y-2">
              <span className="text-xs uppercase font-medium tracking-wider text-slate-500 block">
                Official Tracking Reference ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold text-primary-700 tracking-wide select-all">
                  {submittedGrievance.trackingId}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyId}
                  iconLeft={Copy}
                  className="bg-white"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Routing Meta */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md text-xs text-blue-900 flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>
                Assigned Department:{' '}
                <strong>{submittedGrievance.department?.name || 'Departmental Review'}</strong>
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Link to={`/citizen/grievances/${submittedGrievance._id}`}>
                <Button variant="primary" iconRight={ArrowRight}>
                  View Grievance Details
                </Button>
              </Link>
              <Button variant="outline" onClick={resetForm} iconLeft={PlusCircle}>
                File Another Grievance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lodge a Civic Grievance"
        description="Submit infrastructure, public utility, or civic sanitation issues to your municipal council."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Grievance Information</CardTitle>
            </CardHeader>

            <CardContent>
              {formError && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Grievance Title"
                  required
                  placeholder="e.g. Severe water pipe leakage at 5th Cross Road"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  helperText="Brief summary of the issue (5–100 characters)."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Municipal Category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={categories.map((cat) => ({ value: cat, label: cat }))}
                    disabled={loadingCategories}
                    helperText="Auto-routes to the department in charge."
                  />

                  <Select
                    label="Perceived Urgency / Priority"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    options={[
                      { value: PRIORITIES.LOW, label: 'Low — Minor inconvenience' },
                      { value: PRIORITIES.MEDIUM, label: 'Medium — Normal attention required' },
                      { value: PRIORITIES.HIGH, label: 'High — Hazardous or severe' },
                      { value: PRIORITIES.URGENT, label: 'Urgent — Immediate safety risk' }
                    ]}
                  />
                </div>

                <Input
                  label="Specific Location or Address"
                  required
                  placeholder="e.g. Near Community Center, Main Gate, Ward 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  icon={MapPin}
                  helperText="Provide landmarks or street references for field inspection."
                />

                <Textarea
                  label="Detailed Description"
                  required
                  rows={5}
                  placeholder="Describe the severity, duration of the issue, and impact on local residents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  helperText="Minimum 10 characters. Include any specific observations."
                />

                {/* Attachments Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Photo Attachments <span className="text-xs text-slate-400 font-normal">(Optional, max 2 images, ≤ 1 MB each)</span>
                  </label>

                  {/* Previews */}
                  {previews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {previews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative w-28 h-28 rounded-md border border-slate-200 overflow-hidden bg-slate-50 group"
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute top-1 right-1 p-1 bg-slate-900/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachments.length < 2 && (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                      <input
                        type="file"
                        id="attachments-upload"
                        accept="image/jpeg,image/png"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="attachments-upload"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-primary-600 hover:underline">
                            Click to upload photos
                          </span>{' '}
                          or drag and drop
                        </div>
                        <p className="text-[11px] text-slate-400">JPG or PNG only &bull; Maximum 1 MB per image</p>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <Link to="/citizen">
                    <Button variant="ghost" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    Submit Grievance
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informational Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-50/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Redressal Protocol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Automatic Routing:</strong>
                  Your complaint is routed instantly to the respective municipal division based on the selected category.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Unique Tracking:</strong>
                  You will receive an atomic tracking number upon filing to check progress at any time.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Auto-Escalation:</strong>
                  If unresolved within 7 days, our backend cron automatically escalates the issue to senior administration.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FileGrievance;
