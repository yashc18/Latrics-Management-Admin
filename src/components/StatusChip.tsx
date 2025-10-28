import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: "pending" | "approved" | "rejected" | "submitted" | "unreviewed" | "in-progress";
  className?: string;
}

const statusConfig = {
  approved: {
    label: "Approved",
    className: "bg-status-approved/10 text-status-approved border-status-approved/20",
  },
  rejected: {
    label: "Rejected",
    className: "bg-status-rejected/10 text-status-rejected border-status-rejected/20",
  },
  pending: {
    label: "Pending",
    className: "bg-status-pending/10 text-status-pending border-status-pending/20",
  },
  submitted: {
    label: "Submitted",
    className: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  },
  unreviewed: {
    label: "Unreviewed",
    className: "bg-muted text-muted-foreground border-border",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  },
};

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
