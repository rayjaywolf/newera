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
    <div className="flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border border-none focus:outline-none focus:ring-2 focus:ring-[#E65E2B] w-64"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </form>
        <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-full">
          {isLoaded ? (
            <>
              <UserButton appearance={{}} />
              <span className="text-sm font-medium text">
                {user?.firstName} {user?.lastName}
              </span>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-8 rounded-full bg-black/[0.08]" />
              <Skeleton className="h-4 w-24 bg-black/[0.08]" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
