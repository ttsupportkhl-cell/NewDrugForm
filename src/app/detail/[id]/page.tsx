"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Submission } from "@/lib/types";
import { getTodayDate } from "@/lib/utils";

export default function DetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(id ? "" : "Invalid submission ID");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Editable committee fields
  const [description, setDescription] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | "">("");
  const [committeeRemarks, setCommitteeRemarks] = useState("");
  const [committeeMemberDetails, setCommitteeMemberDetails] = useState("");
  const [members, setMembers] = useState([
    { name: "", date: getTodayDate() },
    { name: "", date: getTodayDate() },
    { name: "", date: getTodayDate() },
  ]);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Failed to load");
        const data: Submission[] = await res.json();
        const found = data.find((s) => s.id === id);
        if (!found) throw new Error("Submission not found");
        setSubmission(found);
        setDescription(found.description || "");
        setDecision(found.decision || "");
        setCommitteeRemarks(found.committeeRemarks || "");
        setCommitteeMemberDetails(found.committeeMemberDetails || "");
        setMembers([
          { name: found.member1Name || "", date: found.member1Date || getTodayDate() },
          { name: found.member2Name || "", date: found.member2Date || getTodayDate() },
          { name: found.member3Name || "", date: found.member3Date || getTodayDate() },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const showSaveMsg = (type: "success" | "error", text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveMsg({ type, text });
    saveTimerRef.current = setTimeout(() => setSaveMsg(null), 4000);
  };

  const handleSave = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submission.id,
          description,
          decision,
          committeeRemarks,
          committeeMemberDetails,
          member1Name: members[0].name,
          member1Date: members[0].date,
          member2Name: members[1].name,
          member2Date: members[1].date,
          member3Name: members[2].name,
          member3Date: members[2].date,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      const updated = await res.json();
      setSubmission(updated);
      showSaveMsg("success", "Decision saved successfully!");
    } catch (err) {
      showSaveMsg("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateMember = (index: number, field: "name" | "date", value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

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
            decision === "approved"
              ? "bg-green-100 text-green-800"
              : decision === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Pending"}
          </span>
        </div>

        {/* Header Card */}
        <div className="bg-indigo-600 text-white rounded-t-lg px-6 py-5">
          <h1 className="text-2xl font-bold">{submission.drugUsedFor}</h1>
          <p className="text-indigo-100 text-sm mt-1">Submitted on {formatDate(submission.submittedAt)}</p>
        </div>

        <div className="bg-white rounded-b-lg shadow-md divide-y divide-gray-200">
          {/* Section 1: Requester Details (Read-only) */}
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

          {/* Section 2: Drug Committee Decision (Editable) */}
          <div className="px-6 py-4 bg-indigo-50 border-t-2 border-indigo-200">
            <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Drug Committee Decision</h2>
            <p className="text-xs text-indigo-500 mt-1">Fill in the details below and save</p>
          </div>

          {/* Description */}
          <div className="px-6 py-4">
            <label className="block text-xs text-gray-400 mb-1" htmlFor="committee-description">Description</label>
            <textarea id="committee-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Enter description..." />
          </div>

          {/* Decision Radio */}
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 mb-2">Decision</p>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-lg border-2 transition-all ${
                decision === "approved" ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
              }`}>
                <input type="radio" name="committee-decision" value="approved"
                  checked={decision === "approved"}
                  onChange={() => setDecision("approved")} className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">Approved</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-lg border-2 transition-all ${
                decision === "rejected" ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
              }`}>
                <input type="radio" name="committee-decision" value="rejected"
                  checked={decision === "rejected"}
                  onChange={() => setDecision("rejected")} className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-700">Rejected</span>
              </label>
            </div>
          </div>

          {/* Reasons / Remarks */}
          <div className="px-6 py-4">
            <label className="block text-xs text-gray-400 mb-1" htmlFor="committee-remarks">Reasons / Remarks</label>
            <textarea id="committee-remarks" value={committeeRemarks} onChange={(e) => setCommitteeRemarks(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Enter committee remarks..." />
          </div>

          {/* Committee Member Details */}
          <div className="px-6 py-4">
            <label className="block text-xs text-gray-400 mb-1" htmlFor="committee-member-details">Committee Member Details</label>
            <input id="committee-member-details" type="text" value={committeeMemberDetails} onChange={(e) => setCommitteeMemberDetails(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Committee details..." />
          </div>

          {/* Committee Signatures */}
          <div className="px-6 py-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Committee Signatures</h2>
          </div>

          {[0, 1, 2].map((i) => (
            <div key={i} className="px-6 py-4 flex gap-4 items-end border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1" htmlFor={`member-${i}-name`}>Member {i + 1} Name</label>
                <input id={`member-${i}-name`} type="text" value={members[i].name}
                  onChange={(e) => updateMember(i, "name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Member name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1" htmlFor={`member-${i}-date`}>Date</label>
                <input id={`member-${i}-date`} type="date" value={members[i].date}
                  onChange={(e) => updateMember(i, "date", e.target.value)}
                  className="w-44 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Save Button + Messages */}
        <div className="mt-6 flex justify-between items-center">
          <Link href="/report" className="text-indigo-600 hover:underline text-sm">&larr; Back to Report</Link>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {saveMsg.text}
              </span>
            )}
            <button onClick={handleSave} disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm">
              {saving ? "Saving..." : "Save Decision"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
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
