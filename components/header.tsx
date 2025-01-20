import { UserButton, useUser } from "@clerk/nextjs";

export function ProjectHeader() {
  const { user } = useUser();

  return (
    <div className="flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-full">
        <UserButton
          appearance={{
            elements: {
              // avatarBox: "h-8 w-8",
            },
          }}
        />
        <span className="text-sm font-medium text">
          {user?.firstName} {user?.lastName}
        </span>
      </div>
    </div>
  );
}
