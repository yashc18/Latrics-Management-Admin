import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Send, Clock } from "lucide-react";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseActivity } from "@/lib/firebase-types";
import { StatusChip } from "@/components/StatusChip";
import { PageHeader } from "@/components/MobileOptimized";
import { useNavigate } from "react-router-dom";

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

function KPICard({ title, value, icon, onClick }: KPICardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground md:text-sm">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold md:text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [activity, setActivity] = useState<FirebaseActivity[]>([]);
  const [stats, setStats] = useState({
    pendingUsers: 0,
    pendingTemplates: 0,
    submissionsToday: 0,
    overdueReviews: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, templates, submissions, activityData] = await Promise.all([
          firebaseService.getUserRequests(),
          firebaseService.getTemplates(),
          firebaseService.getSubmissions(),
          firebaseService.getActivity(),
        ]);

        const today = new Date().toISOString().split("T")[0];
        
        setStats({
          pendingUsers: users.filter((u) => u.status === "pending").length,
          pendingTemplates: templates.filter((t) => t.status === "pending" || t.status === "draft").length,
          submissionsToday: submissions.filter((s) => 
            s.submittedAt && s.submittedAt.toDate().toISOString().split("T")[0] === today
          ).length,
          overdueReviews: submissions.filter((s) => 
            s.status === "submitted" && 
            s.submittedAt && s.submittedAt.toDate() < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
        });

        setActivity(activityData.slice(0, 10));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <PageHeader 
          title="Dashboard"
          description="Welcome to Latrics Admin. Here's what's happening today."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
          <KPICard
            title="Pending User Requests"
            value={stats.pendingUsers}
            icon={<Users className="h-4 w-4" />}
            onClick={() => navigate("/users/requests")}
          />
          <KPICard
            title="Pending Template Approvals"
            value={stats.pendingTemplates}
            icon={<FileText className="h-4 w-4" />}
            onClick={() => navigate("/templates")}
          />
          <KPICard
            title="Submissions Today"
            value={stats.submissionsToday}
            icon={<Send className="h-4 w-4" />}
            onClick={() => navigate("/submissions")}
          />
          <KPICard
            title="Overdue Reviews"
            value={stats.overdueReviews}
            icon={<Clock className="h-4 w-4" />}
            onClick={() => navigate("/submissions")}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 border-b pb-2 last:border-0 sm:flex-row sm:items-center sm:justify-between md:pb-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm">
                      <span className="font-medium">{item.userName}</span>
                      {" "}
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.timestamp ? item.timestamp.toDate().toLocaleString(undefined, { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  <StatusChip
                    status={item.type.includes('approved') ? "approved" : "rejected"}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => navigate("/activity")}
              >
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="h-auto w-full justify-start py-3 md:py-2"
                onClick={() => navigate("/users/requests")}
              >
                <Users className="mr-3 h-5 w-5 shrink-0 md:mr-2 md:h-4 md:w-4" />
                <span className="text-left">Review User Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto w-full justify-start py-3 md:py-2"
                onClick={() => navigate("/templates")}
              >
                <FileText className="mr-3 h-5 w-5 shrink-0 md:mr-2 md:h-4 md:w-4" />
                <span className="text-left">Approve Templates</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto w-full justify-start py-3 md:py-2"
                onClick={() => navigate("/submissions")}
              >
                <Send className="mr-3 h-5 w-5 shrink-0 md:mr-2 md:h-4 md:w-4" />
                <span className="text-left">Monitor Submissions</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
