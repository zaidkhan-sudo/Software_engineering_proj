import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, AlertCircle, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { grievanceApi } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import GrievanceCard from '../../components/grievance/GrievanceCard';

export const TrackGrievance = () => {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [foundGrievance, setFoundGrievance] = useState(null);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFoundGrievance(null);

    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a tracking ID (e.g. GRV-2026-000001).');
      return;
    }

    setLoading(true);
    try {
      const res = await grievanceApi.trackByTrackingId(cleanId);
      if (res.data?.success && res.data?.data?.grievance) {
        setFoundGrievance(res.data.data.grievance);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No grievance found with tracking ID "${cleanId}". Please verify the ID or check your "My Grievances" list.`);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Grievance by Reference ID"
        description="Lookup status, assigned department, and live resolution progression using your tracking number."
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <Input
                label="Tracking Reference Number"
                required
                placeholder="e.g. GRV-2026-000042"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                icon={Hash}
                helperText="Enter the full alphanumeric tracking ID assigned to your complaint."
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  iconLeft={Search}
                  isLoading={loading}
                >
                  Locate Grievance
                </Button>
              </div>
            </form>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Found Result Card */}
        {foundGrievance && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Grievance records verified. Click below to view the complete timeline.</span>
            </div>
            <GrievanceCard grievance={foundGrievance} />
          </div>
        )}

        {/* Informational Guidance */}
        <Card className="bg-slate-50/50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">About Tracking Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              &bull; Every grievance lodged with the municipal authority receives an atomic, non-reusable identifier formatted as <code>GRV-YYYY-XXXXXX</code>.
            </p>
            <p>
              &bull; For privacy and security compliance, citizens can only view status details for grievances registered under their account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackGrievance;
