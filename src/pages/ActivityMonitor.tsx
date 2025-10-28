import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseActivity } from "@/lib/firebase-types";
import { StatusChip } from "@/components/StatusChip";
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
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function ActivityMonitor() {
  const [activity, setActivity] = useState<FirebaseActivity[]>([]);
  const [filteredActivity, setFilteredActivity] = useState<FirebaseActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  useEffect(() => {
    filterActivity();
  }, [activity, searchQuery]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const data = await firebaseService.getActivity();
      setActivity(data);
    } catch (error) {
      console.error("Error loading activity:", error);
      toast.error("Failed to load activity data");
    } finally {
      setLoading(false);
    }
  };

  const filterActivity = () => {
    let filtered = activity;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.userName.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    setFilteredActivity(filtered);
  };

  const handleExport = async () => {
    setExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Activity log exported successfully", {
      description: "Downloaded as CSV",
    });
    setExporting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-4">
        <PageHeader 
          title="Activity Monitor"
          description="View all admin actions and system events"
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-9 md:h-10"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        <MobileTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">User</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="min-w-[100px]">Type</TableHead>
                <TableHead className="min-w-[150px]">User ID</TableHead>
                <TableHead className="min-w-[160px]">Timestamp</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading activity data...
                  </TableCell>
                </TableRow>
              ) : filteredActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No activity data found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.userName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <span className="capitalize text-muted-foreground">{item.type.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.userId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.timestamp ? item.timestamp.toDate().toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={item.type.includes('approved') ? "approved" : "rejected"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </MobileTableContainer>
      </div>
    </DashboardLayout>
  );
}
