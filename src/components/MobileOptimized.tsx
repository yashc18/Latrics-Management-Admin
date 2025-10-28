import { cn } from "@/lib/utils";

interface MobileTableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileTableContainer({ children, className }: MobileTableContainerProps) {
  return (
    <div className={cn("overflow-x-auto rounded-md border -mx-4 sm:mx-0", className)}>
      <div className="min-w-[800px]">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <p className="text-sm text-muted-foreground md:text-base">{description}</p>
    </div>
  );
}
