import React, { useState, useEffect, useMemo } from 'react';
import { Report, ReportStatus } from '../types.ts';
import * as api from '../services/api.ts';
import { Button } from '../components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.tsx';
import { Select } from '../components/ui/Select.tsx';
import { ListChecksIcon, WrenchIcon, CheckCircle2Icon, SparklesIcon } from '../components/Icons.tsx';
import AIAnalysisModal from '../components/AIAnalysisModal.tsx';

interface AdminDashboardProps {
  viewReport: (report: Report) => void;
}

const statusColors: { [key in ReportStatus]: string } = {
  [ReportStatus.Pending]: 'border-yellow-500',
  [ReportStatus.Assigned]: 'border-blue-500',
  [ReportStatus.InProgress]: 'border-purple-500',
  [ReportStatus.Resolved]: 'border-green-500',
};

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


const AdminDashboard = ({ viewReport }: AdminDashboardProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'All'>('All');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const allReports = await api.getReports();
      setReports(allReports);
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleOpenAnalysis = async () => {
    setIsAnalysisModalOpen(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await api.getAIReportAnalysis(reports);
      setAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to load analysis.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter(r => r.status === statusFilter);
  }, [reports, statusFilter]);
  
  const reportStats = useMemo(() => ({
      total: reports.length,
      pending: reports.filter(r => r.status === ReportStatus.Pending).length,
      inProgress: reports.filter(r => r.status === ReportStatus.InProgress || r.status === ReportStatus.Assigned).length,
      resolved: reports.filter(r => r.status === ReportStatus.Resolved).length
  }), [reports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Oversee and manage all civic issue reports.</p>
        </div>
        <Button onClick={handleOpenAnalysis} disabled={analysisLoading}>
          <SparklesIcon className="mr-2 h-5 w-5" />
          {analysisLoading ? 'Analyzing...' : 'Get AI Analysis'}
        </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Reports" value={reportStats.total} icon={<ListChecksIcon />} />
          <StatCard title="Pending Review" value={reportStats.pending} icon={<WrenchIcon />} />
          <StatCard title="In Progress" value={reportStats.inProgress} icon={<WrenchIcon />} />
          <StatCard title="Resolved" value={reportStats.resolved} icon={<CheckCircle2Icon />} />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle>All Submitted Reports</CardTitle>
                <CardDescription>Click on a report to view details and take action.</CardDescription>
            </div>
             <div className="mt-4 sm:mt-0">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'All')}>
                    <option value="All">All Statuses</option>
                    {Object.values(ReportStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading reports...</p>
          ) : filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map(report => (
                <div key={report.id} onClick={() => viewReport(report)} className={`border-l-4 p-4 rounded-md cursor-pointer hover:bg-muted/50 transition-colors bg-card border ${statusColors[report.status]}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div className="flex-1 pr-4">
                            <h3 className="font-semibold">{report.title}</h3>
                            <p className="text-sm text-muted-foreground">Category: {report.category} | Submitted: {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-4 w-full sm:w-auto">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full text-center whitespace-nowrap bg-muted`}>
                                {report.status}
                            </span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No reports match the current filter.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        analysis={analysis}
        isLoading={analysisLoading}
        error={analysisError}
      />
    </div>
  );
};

export default AdminDashboard;
