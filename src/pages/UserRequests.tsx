import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseUser } from "@/lib/firebase-types";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, MobileTableContainer } from "@/components/MobileOptimized";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Eye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export default function UserRequests() {
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FirebaseUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("pending");
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; userId?: string }>({
    open: false,
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId?: string }>({
    open: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string }>({
    open: false,
  });
  const [viewSheet, setViewSheet] = useState<{ open: boolean; user?: FirebaseUser }>({
    open: false,
  });
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { adminData } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, activeTab]);

  const loadUsers = async () => {
    try {
      const data = await firebaseService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load user requests");
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter out admin users (users with admin permissions)
    filtered = filtered.filter((u) => !u.permissions?.canApproveUsers);

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((u) => u.status === "pending");
    } else if (activeTab === "approved") {
      filtered = filtered.filter((u) => u.status === "approved");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.companyName.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleApprove = async () => {
    if (!adminData) return;
    
    setLoading(true);
    const userIds = approveDialog.userId
      ? [approveDialog.userId]
      : Array.from(selectedUsers);

    try {
      for (const id of userIds) {
        await firebaseService.approveUser(id, adminData.uid, approveNote);
      }

      await loadUsers();
      setApproveDialog({ open: false });
      setApproveNote("");
      setSelectedUsers(new Set());
      toast.success(`${userIds.length} user(s) approved successfully`);
    } catch (error) {
      console.error("Error approving users:", error);
      toast.error("Failed to approve users");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setLoading(true);
    const userIds = rejectDialog.userId
      ? [rejectDialog.userId]
      : Array.from(selectedUsers);

    try {
      for (const id of userIds) {
        await firebaseService.rejectUser(id, rejectReason, adminData.uid);
      }

      await loadUsers();
      setRejectDialog({ open: false });
      setRejectReason("");
      setSelectedUsers(new Set());
      toast.success(`${userIds.length} user(s) rejected`);
    } catch (error) {
      console.error("Error rejecting users:", error);
      toast.error("Failed to reject users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.userId) return;

    setLoading(true);
    try {
      await firebaseService.deleteUser(deleteDialog.userId, adminData.uid);
      await loadUsers();
      setDeleteDialog({ open: false });
      setSelectedUsers(new Set());
      toast.success("User profile deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.uid)));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-4">
        <PageHeader 
          title="User Requests"
          description="Approve or reject user registration requests"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-9 md:h-10"
            />
          </div>

          {selectedUsers.size > 0 && activeTab === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setApproveDialog({ open: true })}
              >
                <Check className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Approve ({selectedUsers.size})</span>
                <span className="sm:hidden">Approve</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setRejectDialog({ open: true })}
              >
                <X className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Reject ({selectedUsers.size})</span>
                <span className="sm:hidden">Reject</span>
              </Button>
            </div>
          )}
        </div>

          <TabsContent value={activeTab} className="mt-4">
            <MobileTableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleAll}
                    aria-label="Select all users"
                  />
                </TableHead>
                <TableHead className="min-w-[150px]">User</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[120px]">Company</TableHead>
                <TableHead className="min-w-[100px]">Job Title</TableHead>
                <TableHead className="min-w-[120px]">Phone</TableHead>
                <TableHead className="min-w-[120px]">Requested At</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.uid)}
                      onCheckedChange={() => toggleUserSelection(user.uid)}
                      aria-label={`Select ${user.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.companyName}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{user.jobTitle}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.phone}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={user.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewSheet({ open: true, user })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setApproveDialog({ open: true, userId: user.uid })}
                          >
                            <Check className="h-4 w-4 text-status-approved" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRejectDialog({ open: true, userId: user.uid })}
                          >
                            <X className="h-4 w-4 text-status-rejected" />
                          </Button>
                        </>
                      )}
                      {user.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ open: true, userId: user.uid })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </MobileTableContainer>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve User Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this user request?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-note">Note (optional)</Label>
              <Textarea
                id="approve-note"
                placeholder="Add a note..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApproveDialog({ open: false })} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject User Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this user request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false })} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user's profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Deleting..." : "Delete Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Sheet */}
      <Sheet open={viewSheet.open} onOpenChange={(open) => setViewSheet({ open })}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>Complete user profile information</SheetDescription>
          </SheetHeader>
          {viewSheet.user && (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{viewSheet.user.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{viewSheet.user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{viewSheet.user.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Company</Label>
                <p className="font-medium">{viewSheet.user.companyName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Job Title</Label>
                <p className="font-medium">{viewSheet.user.jobTitle}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">License ID</Label>
                <p className="font-medium">{viewSheet.user.licenseId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Project Manager</Label>
                <p className="font-medium">{viewSheet.user.isProjectManager ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusChip status={viewSheet.user.status} />
                </div>
              </div>
              {viewSheet.user.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm">{viewSheet.user.rejectionReason}</p>
                </div>
              )}
              {viewSheet.user.approvedAt && (
                <div>
                  <Label className="text-muted-foreground">Approved At</Label>
                  <p className="text-sm">{viewSheet.user.approvedAt.toDate ? viewSheet.user.approvedAt.toDate().toLocaleString() : 'N/A'}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
