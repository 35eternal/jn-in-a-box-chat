import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

export const AdminAccessButton = () => {
  const { isAdmin, isLoading } = useAdminRole();
  const navigate = useNavigate();

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate('/admin')}
      variant="outline"
      size="sm"
      className="border-white/20 text-white hover:bg-white/10"
    >
      <Shield className="mr-2 h-4 w-4" />
      Admin Dashboard
    </Button>
  );
};
