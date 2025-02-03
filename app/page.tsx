import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-primary-bg text-primary-text flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to New Era
        </h1>
        <p className="text-lg md:text-2xl mb-8 max-w-2xl">
          Manage your projects seamlessly with powerful tools for attendance,
          materials, machinery, and more.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Link legacyBehavior href="/projects">
            <a className="px-8 py-3 bg-primary-button text-primary bg-primary-accent rounded hover:opacity-90 transition">
              View Projects
            </a>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card */}
            <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">
                Attendance Management
              </h3>
              <p className="text-muted-foreground">
                Track workers’ attendance and manage payroll with ease.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Material Tracking</h3>
              <p className="text-muted-foreground">
                Monitor material usage, cost, and availability in real time.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Machinery Control</h3>
              <p className="text-muted-foreground">
                Manage machinery details, maintenance, and scheduling
                effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center">
        <p>
          Ready to take the next step?{" "}
          <Link legacyBehavior href="/projects">
            <a className="text-primary-accent font-semibold hover:underline">
              Explore Projects
            </a>
          </Link>
        </p>
      </footer>
    </main>
  );
}
