import { UserButton, useUser } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectHeader() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const projectId = pathname.split("/")[2];
      router.push(
        `/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-8 sm:px-8 px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
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
  );
}
