import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground md:text-6xl">404</h1>
        <p className="mb-6 text-lg text-muted-foreground md:text-xl">Oops! Page not found</p>
        <a 
          href="/login" 
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default NotFound;
