import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/campaigns")({
  component: AdminCampaignsRedirect,
});

function AdminCampaignsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin-dashboard", replace: true });
  }, [navigate]);

  return null;
}
