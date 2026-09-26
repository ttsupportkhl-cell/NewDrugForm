"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Submission } from "@/lib/types";

type TabFilter = "approved" | "rejected" | "pending";

export default function StatusPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("approved");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Failed to load submissions");
        setSubmissions(await res.json());
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isPending = (s: Submission) => !s.decision;

  const tabFiltered = submissions.filter((s) =>
    activeTab === "approved" ? s.decision === "approved" :
    activeTab === "rejected" ? s.decision === "rejected" :
    isPending(s)
  );

  const counts = {
    approved: submissions.filter((s) => s.decision === "approved").length,
    rejected: submissions.filter((s) => s.decision === "rejected").length,
    pending: submissions.filter(isPending).length,
  };

  const formatDate = (iso: string) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-indigo-600 font-semibold text-lg hover:underline">KHL Pharmacy</Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Status</h1>
            <p className="text-gray-500 text-sm mt-1">View submissions by approval status</p>
          </div>
          <div className="flex gap-3">
            <Link href="/report"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Report
            </Link>
            <Link href="/"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
              + New Submission
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {([
            { key: "approved" as TabFilter, label: "Approved", color: "green", count: counts.approved },
            { key: "rejected" as TabFilter, label: "Rejected", color: "red", count: counts.rejected },
            { key: "pending" as TabFilter, label: "Pending", color: "yellow", count: counts.pending },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? tab.color === "green" ? "bg-green-600 text-white shadow-md"
                  : tab.color === "red" ? "bg-red-600 text-white shadow-md"
                  : "bg-yellow-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                activeTab === tab.key ? "bg-white"
                : tab.color === "green" ? "bg-green-500"
                : tab.color === "red" ? "bg-red-500"
                : "bg-yellow-500"
              }`}></span>
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {fetchError}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : tabFiltered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No {activeTab} submissions found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`border-b-2 ${
                  activeTab === "approved" ? "bg-green-50 border-green-200"
                  : activeTab === "rejected" ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
                }`}>
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Drug Used For</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Generic Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Brand Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tabFiltered.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.drugUsedFor}</td>
                      <td className="px-4 py-3 text-gray-700">{s.genericDrugName}</td>
                      <td className="px-4 py-3 text-gray-700">{s.brandName}</td>
                      <td className="px-4 py-3 text-gray-700">{s.applicantDetails}</td>
                      <td className="px-4 py-3 text-gray-700">{s.department}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.submittedAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/detail/${s.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
