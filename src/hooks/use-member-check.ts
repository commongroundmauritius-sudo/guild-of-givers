import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCallback } from "react";

export function useMemberCheck() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();

  const handleMemberAction = useCallback(
    (e?: React.MouseEvent) => {
      if (user && isSubscribed) {
        if (e) {
          e.preventDefault();
        }
        toast.info("You're already a member");
        navigate({ to: "/dashboard" });
        return true;
      }
      return false;
    },
    [user, isSubscribed, navigate],
  );

  return {
    isSubscribedMember: !!(user && isSubscribed),
    handleMemberAction,
  };
}
