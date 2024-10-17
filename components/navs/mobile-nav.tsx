import React from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SideNav from "@/components/navs/side-nav";

export default function MobileNav() {
  return (
    <div>
      <div className="px-4 mb-2 bg-slate-50 dark:bg-slate-900 flex">
        <Sheet>
          <SheetTrigger>
            <div className="p-2">
              <Menu size={30} />
            </div>
          </SheetTrigger>

          <SheetContent side="left" className="w-[300px]">
            <div className="mt-5">
              <SideNav />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
