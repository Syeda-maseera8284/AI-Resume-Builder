'use client';

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { AuthDialog } from "@/components/auth/auth-dialog";
// import { WaitlistDialog } from "@/components/waitlist/waitlist-dialog";

export function ActionButtons() {
  return (
    <div className="flex flex-col gap-6 z-[1000]">
      <div className="flex justify-start">
        <AuthDialog />
        {/* <WaitlistDialog /> */}
      </div>
      

    </div>
  );
} 