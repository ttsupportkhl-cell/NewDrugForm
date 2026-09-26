"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Submission } from "@/lib/types";

export default function DetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Failed to load");
        const data: Submission[] = await res.json();
        const found = data.find((s) => s.id === id);
        if (!found) throw new Error("Submission not found");
        setSubmission(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Not found"}</p>
          <Link href="/report" className="text-indigo-600 hover:underline">Back to Report</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/report" className="text-indigo-600 hover:underline text-sm">&larr; Back to Report</Link>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            submission.decision === "approved"
              ? "bg-green-100 text-green-800"
              : submission.decision === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {submission.decision === "approved" ? "Approved" : submission.decision === "rejected" ? "Rejected" : "Pending"}
          </span>
        </div>

        {/* Header Card */}
        <div className="bg-indigo-600 text-white rounded-t-lg px-6 py-5">
          <h1 className="text-2xl font-bold">{submission.drugUsedFor}</h1>
          <p className="text-indigo-100 text-sm mt-1">Submitted on {formatDate(submission.submittedAt)}</p>
        </div>

        <div className="bg-white rounded-b-lg shadow-md divide-y divide-gray-200">
          {/* Section 1: Requester Details */}
          <div className="px-6 py-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Requester Details</h2>
          </div>

          <DetailRow label="Drug Used For" value={submission.drugUsedFor} />
          <DetailRow label="Generic Drug Name" value={submission.genericDrugName} />
          <DetailRow label="Brand Name (Pharma Company)" value={submission.brandName} />
          <DetailRow label="Reason / Remark" value={submission.reasonRemark} isLong />
          <DetailRow label="Applicant Details" value={submission.applicantDetails} />
          <DetailRow label="Name (BLOCK LETTERS)" value={submission.nameBlockLetters} />
          <DetailRow label="Department" value={submission.department} />
          <DetailRow label="Date" value={submission.date} />

          {/* Section 2: Drug Committee */}
          <div className="px-6 py-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Drug Committee Decision</h2>
          </div>

          <DetailRow label="Description" value={submission.description} isLong />
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 mb-1">Decision</p>
            <div className="flex gap-4 mt-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                submission.decision === "approved"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  submission.decision === "approved" ? "border-green-500" : "border-gray-300"
                }`}>
                  {submission.decision === "approved" && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                </div>
                Approved
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                submission.decision === "rejected"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  submission.decision === "rejected" ? "border-red-500" : "border-gray-300"
                }`}>
                  {submission.decision === "rejected" && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                </div>
                Rejected
              </div>
            </div>
          </div>

          <DetailRow label="Reasons / Remarks" value={submission.committeeRemarks} isLong />
          <DetailRow label="Committee Member Details" value={submission.committeeMemberDetails} />

          {/* Committee Signatures */}
          <div className="px-6 py-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Committee Signatures</h2>
          </div>

          {[1, 2, 3].map((n) => {
            const name = submission[`member${n}Name` as keyof Submission] as string;
            const date = submission[`member${n}Date` as keyof Submission] as string;
            if (!name && !date) return null;
            return (
              <div key={n} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Member {n}</p>
                  <p className="text-gray-900 font-medium">{name || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Date Signed</p>
                  <p className="text-gray-700">{date || "-"}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <Link href="/report" className="text-indigo-600 hover:underline text-sm">&larr; Back to Report</Link>
          <p className="text-xs text-gray-400">ID: {submission.id.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, isLong }: { label: string; value: string; isLong?: boolean }) {
  return (
    <div className={`px-6 py-4 ${isLong ? "" : "flex items-center justify-between"}`}>
      <div className={isLong ? "" : "flex-1"}>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className={`text-gray-900 ${isLong ? "whitespace-pre-wrap" : ""}`}>{value || "-"}</p>
      </div>
    </div>
  );
}
