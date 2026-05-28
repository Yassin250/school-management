import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold text-red-600 mb-2">Unauthorized</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <Link 
          href="/login" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}