"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Submission } from "@/lib/types";
import { getTodayDate } from "@/lib/utils";

type FormData = {
  drugUsedFor: string;
  genericDrugName: string;
  brandName: string;
  reasonRemark: string;
  applicantDetails: string;
  nameBlockLetters: string;
  department: string;
  date: string;
  description: string;
  decision: "approved" | "rejected" | "";
  committeeRemarks: string;
  committeeMemberDetails: string;
  member1Name: string;
  member1Date: string;
  member2Name: string;
  member2Date: string;
  member3Name: string;
  member3Date: string;
};

const initialData: FormData = {
  drugUsedFor: "",
  genericDrugName: "",
  brandName: "",
  reasonRemark: "",
  applicantDetails: "",
  nameBlockLetters: "",
  department: "",
  date: getTodayDate(),
  description: "",
  decision: "",
  committeeRemarks: "",
  committeeMemberDetails: "",
  member1Name: "",
  member1Date: getTodayDate(),
  member2Name: "",
  member2Date: getTodayDate(),
  member3Name: "",
  member3Date: getTodayDate(),
};

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"form" | "report">("form");

  // List state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Review state (for Section 2 committee decision)
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewMemberDetails, setReviewMemberDetails] = useState("");
  const [reviewMembers, setReviewMembers] = useState([
    { name: "", date: getTodayDate() },
    { name: "", date: getTodayDate() },
    { name: "", date: getTodayDate() },
  ]);
  const [savingDecision, setSavingDecision] = useState(false);

  const loadSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) setSubmissions(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    async function init() {
      await loadSubmissions();
      setLoading(false);
    }
    init();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  // ========== FORM HANDLERS ==========
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      await loadSubmissions();
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== DECISION HANDLERS ==========
  const handleDecisionSubmit = async () => {
    if (!reviewing) return;
    setSavingDecision(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewing.id,
          decision: reviewDecision,
          committeeRemarks: reviewRemarks,
          committeeMemberDetails: reviewMemberDetails,
          member1Name: reviewMembers[0].name,
          member1Date: reviewMembers[0].date,
          member2Name: reviewMembers[1].name,
          member2Date: reviewMembers[1].date,
          member3Name: reviewMembers[2].name,
          member3Date: reviewMembers[2].date,
        }),
      });
      if (!res.ok) throw new Error("Failed to save decision");
      await loadSubmissions();
      setReviewing(null);
      setReviewRemarks("");
      setReviewMemberDetails("");
      setReviewMembers([
        { name: "", date: getTodayDate() },
        { name: "", date: getTodayDate() },
        { name: "", date: getTodayDate() },
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingDecision(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-indigo-600 font-semibold text-lg">KHL Pharmacy</Link>
          <div className="bg-white rounded-lg shadow-md p-8 text-center mt-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted Successfully</h2>
            <p className="text-gray-600 mb-6">Your request has been submitted to KHL Pharmacy.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setFormData(initialData); setSubmitted(false); setStep(1); }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Submit Another
              </button>
              <button onClick={() => { setSubmitted(false); setActiveTab("report"); }}
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors">
                View All Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review modal
  if (reviewing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setReviewing(null)} className="text-indigo-600 hover:underline text-sm mb-4">
            &larr; Back to All Requests
          </button>

          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">{reviewing.drugUsedFor}</h2>
              <p className="text-indigo-100 text-sm">{reviewing.genericDrugName} - {reviewing.brandName}</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs">Applicant</p><p className="text-gray-900">{reviewing.applicantDetails}</p></div>
              <div><p className="text-gray-400 text-xs">Department</p><p className="text-gray-900">{reviewing.department}</p></div>
              <div><p className="text-gray-400 text-xs">Name</p><p className="text-gray-900 uppercase">{reviewing.nameBlockLetters}</p></div>
              <div><p className="text-gray-400 text-xs">Date</p><p className="text-gray-900">{reviewing.date}</p></div>
              <div className="col-span-2"><p className="text-gray-400 text-xs">Reason / Remark</p><p className="text-gray-900">{reviewing.reasonRemark}</p></div>
            </div>
          </div>

          {/* Committee Decision Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-bold">Section 2 - Committee Decision</h3>
              <p className="text-gray-300 text-sm">Drug Committee Use Only</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Decision</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-lg border-2 transition-all ${
                    reviewDecision === "approved" ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="radio" checked={reviewDecision === "approved"}
                      onChange={() => setReviewDecision("approved")} className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Approved</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-lg border-2 transition-all ${
                    reviewDecision === "rejected" ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="radio" checked={reviewDecision === "rejected"}
                      onChange={() => setReviewDecision("rejected")} className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-700">Rejected</span>
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Reasons / Remarks</label>
                <textarea value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter committee remarks..." />
              </div>

              {/* Member Details */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Committee Member Details</label>
                <input type="text" value={reviewMemberDetails} onChange={(e) => setReviewMemberDetails(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Committee details..." />
              </div>

              {/* Members */}
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-900 mb-1">Member {i + 1}</label>
                    <input type="text" value={reviewMembers[i].name}
                      onChange={(e) => {
                        const updated = [...reviewMembers];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setReviewMembers(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="Member name" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Date</label>
                    <input type="date" value={reviewMembers[i].date}
                      onChange={(e) => {
                        const updated = [...reviewMembers];
                        updated[i] = { ...updated[i], date: e.target.value };
                        setReviewMembers(updated);
                      }}
                      className="w-40 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button onClick={() => setReviewing(null)}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDecisionSubmit} disabled={savingDecision}
                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
                  reviewDecision === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}>
                {savingDecision ? "Saving..." : reviewDecision === "approved" ? "Approve & Save" : "Reject & Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-indigo-600 font-semibold text-lg hover:underline">KHL Pharmacy</Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Drug Introduction / Removal</h1>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab("form")}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "form"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}>
            Section 1 - Drug Requisition Form
          </button>
          <button onClick={() => setActiveTab("report")}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "report"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}>
            Section 2 - Committee Review
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === "report" ? "bg-white/20" : "bg-gray-200 text-gray-600"
            }`}>
              {submissions.length}
            </span>
          </button>
        </div>

        {/* ========== SECTION 1: DOCTOR FILLS FORM ========== */}
        {activeTab === "form" && (
          <>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{formError}</div>
            )}

            <div className="bg-indigo-600 text-white rounded-t-lg px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded">Step {step} of 2</span>
              </div>
              <h2 className="text-2xl font-bold">Drug Introduction / Removal Form.</h2>
              <p className="text-indigo-100 text-sm mt-1">(Please Fill all the details and submit to KHL pharmacy)</p>
            </div>

            <form onSubmit={handleFormSubmit}>
              {step === 1 && (
                <div className="bg-white rounded-b-lg shadow-md divide-y divide-gray-200">
                  {[
                    { label: "Drug Used For", name: "drugUsedFor" },
                    { label: "Generic Drug Name", name: "genericDrugName" },
                    { label: "Brand Name (please also mention pharma company name)", name: "brandName" },
                  ].map((field) => (
                    <div key={field.name} className="p-6">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name={field.name} value={formData[field.name as keyof FormData] as string}
                        onChange={handleFormChange} required
                        className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm"
                        placeholder="Short answer text" />
                    </div>
                  ))}

                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Reason / Remark <span className="text-red-500">*</span>
                    </label>
                    <textarea name="reasonRemark" value={formData.reasonRemark} onChange={handleFormChange} required rows={3}
                      className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm resize-none"
                      placeholder="Long answer text" />
                  </div>

                  {[
                    { label: "Applicant Details", name: "applicantDetails" },
                    { label: "Name (in BLOCK LETTERS)", name: "nameBlockLetters", className: "uppercase" },
                    { label: "Department", name: "department" },
                  ].map((field) => (
                    <div key={field.name} className="p-6">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name={field.name} value={formData[field.name as keyof FormData] as string}
                        onChange={handleFormChange} required
                        className={`w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm ${field.className || ""}`}
                        placeholder="Short answer text" />
                    </div>
                  ))}

                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input type="date" name="date" value={formData.date} onChange={handleFormChange} required
                      className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm" />
                  </div>

                  <div className="p-6 flex justify-end">
                    <button type="button" onClick={() => setStep(2)}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                      Continue to Section 2
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-b-lg shadow-md">
                  <div className="bg-gray-100 p-6 border-b border-gray-200">
                    <p className="text-sm text-gray-700 font-medium">
                      <strong>For Drug Committee Use Only</strong> (This section is reserved exclusively for Pharmacy and Drug Committee use.)
                    </p>
                  </div>
                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Description (optional)</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={2}
                      className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm resize-none"
                      placeholder="Optional description" />
                  </div>
                  <div className="p-6 border-t border-gray-200 flex justify-between">
                    <button type="button" onClick={() => setStep(1)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      Back
                    </button>
                    <button type="submit" disabled={submitting}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}

        {/* ========== SECTION 2: COMMITTEE REVIEW LIST ========== */}
        {activeTab === "report" && (
          <>
            {loading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">No requests submitted yet.</p>
                <button onClick={() => setActiveTab("form")}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
                  Submit a new request &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((s, idx) => (
                  <div key={s.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 font-medium text-sm">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{s.drugUsedFor}</p>
                          <p className="text-sm text-gray-500">{s.genericDrugName} - {s.brandName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          s.decision === "approved" ? "bg-green-100 text-green-800"
                          : s.decision === "rejected" ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {s.decision === "approved" ? "Approved" : s.decision === "rejected" ? "Rejected" : "Pending"}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(s.submittedAt)}</span>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-400 text-xs">Applicant</p><p className="text-gray-900">{s.applicantDetails}</p></div>
                      <div><p className="text-gray-400 text-xs">Department</p><p className="text-gray-900">{s.department}</p></div>
                      <div><p className="text-gray-400 text-xs">Request Date</p><p className="text-gray-900">{s.date}</p></div>
                      <div><p className="text-gray-400 text-xs">Name</p><p className="text-gray-900 uppercase">{s.nameBlockLetters}</p></div>
                    </div>

                    {s.decision && (
                      <div className={`px-4 py-3 border-t ${s.decision === "approved" ? "bg-green-50" : "bg-red-50"}`}>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-semibold ${s.decision === "approved" ? "text-green-700" : "text-red-700"}`}>
                            {s.decision === "approved" ? "Approved" : "Rejected"} by Committee
                          </span>
                          {s.committeeRemarks && <span className="text-gray-500">- {s.committeeRemarks}</span>}
                        </div>
                      </div>
                    )}

                    <div className="p-4 border-t border-gray-100 flex justify-end">
                      <button onClick={() => {
                        setReviewing(s);
                        setReviewDecision(s.decision === "rejected" ? "rejected" : "approved");
                        setReviewRemarks(s.committeeRemarks || "");
                        setReviewMemberDetails(s.committeeMemberDetails || "");
                        setReviewMembers([
                          { name: s.member1Name || "", date: s.member1Date || getTodayDate() },
                          { name: s.member2Name || "", date: s.member2Date || getTodayDate() },
                          { name: s.member3Name || "", date: s.member3Date || getTodayDate() },
                        ]);
                      }}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        Review & Decide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
