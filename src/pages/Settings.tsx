import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/MobileOptimized";
import { mockDataStore } from "@/lib/mock-data";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

export default function Settings() {
  const handleResetData = async () => {
    await mockDataStore.reset();
    toast.success("Demo data has been reset");
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <PageHeader 
          title="Settings"
          description="Configure your admin dashboard preferences"
        />

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Customize the appearance of your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Primary Color</p>
                  <p className="text-sm text-muted-foreground">Red (#D32F2F)</p>
                </div>
                <div className="h-10 w-10 rounded-md bg-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Settings</CardTitle>
            <CardDescription>Adjust how data tables are displayed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Density</p>
                  <p className="text-sm text-muted-foreground">Currently: Comfortable</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Page Size</p>
                  <p className="text-sm text-muted-foreground">10 rows per page</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>Reset all data to initial state</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleResetData}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset Demo Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>System information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium">UI-Only Demo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
