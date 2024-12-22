import { useState } from "react";
import { SidebarProvider, SidebarTrigger, AppSideBar, Button } from "../components";
import { Bill, Hammer, HandShake, Package, IconComponent } from "../assets";
import { Bell } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const items: Array<{
    title: string;
    url: string;
    icon: IconComponent;
  }> = [
    {
      title: "Inventario",
      url: "#",
      icon: Package,
    },
    {
      title: "Proveedores",
      url: "#",
      icon: HandShake,
    },
    {
      title: "Facturación",
      url: "#",
      icon: Bill,
    },
    {
      title: "Servicios",
      url: "#",
      icon: Hammer,
    },
  ];

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative flex min-h-screen">
        <AppSideBar items={items} />
        <main className="flex-1 flex flex-col p-2 w-full transition-all duration-300">
          <div className="flex justify-between items-center w-full">
            <SidebarTrigger />
            <Button variant="ghost" size="icon" className="w-7 h-7">
            <Bell />
            </Button>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
