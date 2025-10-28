import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter, Calendar } from "lucide-react";
import { FirebaseTemplate, SubmissionFilters } from "@/lib/firebase-types";
import { Timestamp } from "firebase/firestore";

interface SubmissionFiltersProps {
  templates: FirebaseTemplate[];
  contributors: string[];
  filters: SubmissionFilters;
  onFiltersChange: (filters: SubmissionFilters) => void;
}

export function SubmissionFiltersComponent({
  templates,
  contributors,
  filters,
  onFiltersChange,
}: SubmissionFiltersProps) {
  const [showDateFilters, setShowDateFilters] = useState(false);

  const hasActiveFilters = filters.templateId || filters.userId || filters.startDate || filters.endDate;

  const handleFilterChange = (key: keyof SubmissionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      templateId: null,
      userId: null,
      startDate: null,
      endDate: null,
    });
    setShowDateFilters(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Template Filter */}
        <div className="min-w-[200px]">
                     <Select
             value={filters.templateId || "__all__"}
             onValueChange={(value) => handleFilterChange("templateId", value === "__all__" ? null : value)}
           >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Templates" />
            </SelectTrigger>
                         <SelectContent>
               <SelectItem value="__all__">All Templates</SelectItem>
               {templates.map((template) => (
                 <SelectItem key={template.templateId} value={template.templateId}>
                   {template.templateName}
                 </SelectItem>
               ))}
             </SelectContent>
          </Select>
        </div>

        {/* User Filter */}
        <div className="min-w-[200px]">
                     <Select
             value={filters.userId || "__all__"}
             onValueChange={(value) => handleFilterChange("userId", value === "__all__" ? null : value)}
           >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
                         <SelectContent>
               <SelectItem value="__all__">All Users</SelectItem>
               {contributors.map((userId) => (
                 <SelectItem key={userId} value={userId}>
                   {userId}
                 </SelectItem>
               ))}
             </SelectContent>
          </Select>
        </div>

        {/* Date Range Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDateFilters(!showDateFilters)}
          className="h-10"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Date Range
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Date Range Filters */}
      {showDateFilters && (
        <div className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate ? new Date((filters.startDate as Timestamp).toMillis()).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleFilterChange("startDate", date ? Timestamp.fromDate(date) : null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate ? new Date((filters.endDate as Timestamp).toMillis()).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleFilterChange("endDate", date ? Timestamp.fromDate(date) : null);
              }}
            />
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.templateId && (
            <Badge variant="secondary" className="gap-1">
              Template: {templates.find((t) => t.templateId === filters.templateId)?.templateName || filters.templateId}
              <button
                onClick={() => handleFilterChange("templateId", null)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.userId && (
            <Badge variant="secondary" className="gap-1">
              User: {filters.userId}
              <button
                onClick={() => handleFilterChange("userId", null)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date Range Active
              <button
                onClick={() => {
                  handleFilterChange("startDate", null);
                  handleFilterChange("endDate", null);
                }}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
