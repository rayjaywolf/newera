import { UserButton, useUser } from "@clerk/nextjs";
import {
  Search,
  PanelRight,
  BarChart3,
  Calendar,
  Users,
  Package,
  Truck,
  Image as ImageIcon,
  X, // imported for close icon
} from "lucide-react";
import Image from "next/image"; // added import for logo
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function ProjectHeader() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const projectId = pathname.split("/")[2];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  const navigation = [
    { name: "Overview", href: "", icon: BarChart3 },
    { name: "Attendance", href: "/attendance", icon: Calendar },
    { name: "Workers", href: "/workers", icon: Users },
    { name: "Materials", href: "/materials", icon: Package },
    { name: "Machinery", href: "/machinery", icon: Truck },
    { name: "Gallery", href: "/gallery", icon: ImageIcon },
  ];

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-4 sm:px-8 px-6">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle: visible only on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="sm:hidden p-0 "
          >
            <PanelRight className="h-6 w-6 text-[#060606]" />{" "}
            {/* updated color */}
          </button>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-none focus:outline-none focus:ring-2 focus:ring-[#E65E2B] w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
          <div className="flex items-center gap-3 sm:bg-white sm:p-2 sm:px-3 sm:rounded-full">
            {isLoaded ? (
              <>
                <UserButton appearance={{}} />
                <span className="hidden sm:inline text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </>
            ) : (
              <>
                <Skeleton className="h-8 w-8 rounded-full bg-black/[0.08]" />
                <Skeleton className="hidden sm:block h-4 w-24 bg-black/[0.08]" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-primary-text border-r border-[rgba(0,0,0,0.08)]">
            <div className="p-4 flex items-center justify-between">
              <Link href={`/projects`} className="pl-3">
                <Image
                  src="/logo-expanded-dark.png"
                  alt="New Era Construction"
                  width={90}
                  height={20}
                  priority
                />
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {navigation.map((item) => {
                const href = `/projects/${projectId}${item.href}`;
                const isActive = pathname === href;
                return (
                  <a
                    key={item.name}
                    href={href}
                    className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-primary-accent"
                        : "text-white hover:bg-gray-800"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${
                        isActive ? "text-primary-accent" : "text-white"
                      }`}
                    />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}
    </>
  );
}
