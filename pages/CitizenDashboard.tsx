
import React, { useState, useEffect } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import { Report, User, ReportStatus } from '../types.ts';
import * as api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
// FIX: Added .tsx extension to fix module resolution error.
import { FilePlusIcon, ListChecksIcon, WrenchIcon, CheckCircle2Icon } from '../components/Icons.tsx';

interface CitizenDashboardProps {
  currentUser: User;
  viewReport: (report: Report) => void;
  navigateToSubmitReport: () => void;
}

const statusColors: { [key in ReportStatus]: string } = {
  [ReportStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [ReportStatus.Assigned]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [ReportStatus.InProgress]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [ReportStatus.Resolved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
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


const CitizenDashboard = ({ currentUser, viewReport, navigateToSubmitReport }: CitizenDashboardProps) => {
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const allReports = await api.getReports();
      // In a real app, this filtering would be done on the backend
      const userReports = allReports.filter(report => report.submitted_by === currentUser.id);
      setMyReports(userReports);
      setLoading(false);
    };
    fetchReports();
  }, [currentUser.id]);
  
  const reportStats = React.useMemo(() => ({
      total: myReports.length,
      inProgress: myReports.filter(r => r.status === ReportStatus.InProgress || r.status === ReportStatus.Assigned).length,
      resolved: myReports.filter(r => r.status === ReportStatus.Resolved).length
  }), [myReports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser.name}. Here are your reports.</p>
        </div>
        <Button onClick={navigateToSubmitReport}>
          <FilePlusIcon className="mr-2 h-5 w-5" />
          Submit New Report
        </Button>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Reports Submitted" value={reportStats.total} icon={<ListChecksIcon />} />
          <StatCard title="Reports In Progress" value={reportStats.inProgress} icon={<WrenchIcon />} />
          <StatCard title="Reports Resolved" value={reportStats.resolved} icon={<CheckCircle2Icon />} />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>My Submitted Reports</CardTitle>
            <CardDescription>Track the status of issues you've reported.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading your reports...</p>
          ) : myReports.length > 0 ? (
            <div className="space-y-4">
              {myReports.map(report => (
                <Card key={report.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div className="flex-1 pr-4">
                            <h3 className="font-semibold">{report.title}</h3>
                            <p className="text-sm text-muted-foreground">Submitted: {new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-4 w-full sm:w-auto">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full text-center whitespace-nowrap ${statusColors[report.status]}`}>
                                {report.status}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => viewReport(report)} className="w-full sm:w-auto">View Details</Button>
                        </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
              <Button onClick={navigateToSubmitReport} className="mt-4">Submit Your First Report</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenDashboard;