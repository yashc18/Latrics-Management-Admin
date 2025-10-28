import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseSubmission, FirebaseTemplate, SubmissionFilters, SubmissionStatistics } from "@/lib/firebase-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, MobileTableContainer } from "@/components/MobileOptimized";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Eye, Download, Search, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SubmissionStatistics as StatisticsComponent } from "@/components/SubmissionStatistics";
import { SubmissionFiltersComponent } from "@/components/SubmissionFilters";

export default function Submissions() {
  const [submissions, setSubmissions] = useState<FirebaseSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FirebaseSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<SubmissionStatistics | null>(null);
  const [templates, setTemplates] = useState<FirebaseTemplate[]>([]);
  const [contributors, setContributors] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState<SubmissionFilters>({
    templateId: null,
    userId: null,
    startDate: null,
    endDate: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, filters, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [submissionsData, templatesData, stats] = await Promise.all([
        firebaseService.getAllSubmissions(),
        firebaseService.getTemplates(),
        firebaseService.getSubmissionStatistics(),
      ]);

      setSubmissions(submissionsData);
      setTemplates(templatesData);
      setStatistics(stats);

      // Extract unique contributors
      const contributorSet = new Set<string>();
      submissionsData.forEach(sub => {
        if (sub.userContributions) {
          Object.keys(sub.userContributions).forEach(userId => contributorSet.add(userId));
        }
      });
      setContributors(Array.from(contributorSet));

      // Resolve template names
      const submissionsWithNames = submissionsData.map(sub => ({
        ...sub,
        templateName: templatesData.find(t => t.templateId === sub.templateId)?.templateName || 'Unknown Template'
      }));
      setSubmissions(submissionsWithNames);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      let filtered = [...submissions];

      // Apply repository filters
      if (filters.templateId || filters.userId || filters.startDate || filters.endDate) {
        filtered = await firebaseService.getSubmissionsFiltered(filters);
        
        // Resolve template names
        filtered = filtered.map(sub => ({
          ...sub,
          templateName: templates.find(t => t.templateId === sub.templateId)?.templateName || 'Unknown Template'
        }));
      }

      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            (s.templateId || s.id).toLowerCase().includes(query) ||
            (s.templateName || '').toLowerCase().includes(query) ||
            Object.values(s.userContributions || {}).some(contrib => 
              contrib.username?.toLowerCase().includes(query)
            )
        );
      }

      setFilteredSubmissions(filtered);
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Failed to filter submissions");
    }
  };

  const handleDownload = async (submissionId?: string) => {
    setDownloading(true);
    try {
      const submissionsToExport = submissionId 
        ? filteredSubmissions.filter(s => s.id === submissionId)
        : filteredSubmissions;
      
      const csvData = await firebaseService.exportSubmissionsAsCSV(
        submissionsToExport, 
        true
      );

      // Create download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = submissionId 
        ? `submission_${submissionId}_${new Date().toISOString().split('T')[0]}.csv`
        : `submissions_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${submissionsToExport.length} submission(s) exported successfully`, {
        description: "Downloaded as CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export submissions");
    } finally {
      setDownloading(false);
    }
  };

  const getContributorCount = (submission: FirebaseSubmission) => {
    return submission.userContributions ? Object.keys(submission.userContributions).length : 0;
  };

  const getLatestContributionDate = (submission: FirebaseSubmission) => {
    if (!submission.userContributions) return null;
    const dates = Object.values(submission.userContributions).map(c => c.contributedAt);
    return dates.reduce((latest, current) => {
      const currentDate = current?.toDate();
      const latestDate = latest?.toDate();
      return currentDate && (!latestDate || currentDate > latestDate) ? current : latest;
    }, dates[0] || null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <PageHeader 
          title="All Submissions"
          description="View and monitor all form submissions across all templates"
        />

        {/* Statistics Cards */}
        <StatisticsComponent statistics={statistics || {
          totalSubmissions: 0,
          totalContributors: 0,
          submissionsByTemplate: {},
          contributorsByUser: {},
          recentActivityCount: 0,
        }} loading={loading} />

        {/* Filters */}
        <SubmissionFiltersComponent
          templates={templates}
          contributors={contributors}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Search and Export */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by template, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-9 md:h-10"
            />
          </div>

          {filteredSubmissions.length > 0 && (
            <Button variant="default" size="sm" disabled={downloading} className="w-full md:w-auto" onClick={() => handleDownload()}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Exporting..." : `Download CSV (${filteredSubmissions.length})`}
            </Button>
          )}
        </div>

        {/* Submissions Table */}
        <MobileTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Template</TableHead>
                <TableHead className="min-w-[120px]">Contributors</TableHead>
                <TableHead className="min-w-[160px]">Last Contribution</TableHead>
                <TableHead className="min-w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading submissions...
                  </TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {searchQuery || Object.values(filters).some(v => v) 
                      ? "No submissions match your filters" 
                      : "No submissions found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => {
                  const contributorCount = getContributorCount(submission);
                  const lastContribution = getLatestContributionDate(submission);

                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.templateName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{submission.templateId || submission.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contributorCount}</span>
                          <span className="text-xs text-muted-foreground">user{contributorCount !== 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastContribution ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {lastContribution.toDate().toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/submissions/${submission.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={downloading}
                            onClick={() => handleDownload(submission.id)}
                            title="Download CSV for this submission"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </MobileTableContainer>
      </div>
    </DashboardLayout>
  );
}
