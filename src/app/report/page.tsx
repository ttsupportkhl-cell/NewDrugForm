"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
};

export default function ReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

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
              <button onClick={() => { setFormData(initialData); setSubmitted(false); }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Submit Another
              </button>
              <button onClick={() => router.push("/status")}
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors">
                View All Requests
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
          <Link href="/status"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm">
            Status
          </Link>
        </div>

        {/* Form */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{formError}</div>
        )}

        <div className="bg-indigo-600 text-white rounded-t-lg px-6 py-4">
          <h2 className="text-2xl font-bold">Drug Introduction / Removal Form.</h2>
          <p className="text-indigo-100 text-sm mt-1">(Please Fill all the details and submit to KHL pharmacy)</p>
        </div>

        <form onSubmit={handleFormSubmit}>
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
              <button type="submit" disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
