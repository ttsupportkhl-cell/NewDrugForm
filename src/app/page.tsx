"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted Successfully</h2>
          <p className="text-gray-600 mb-6">Your Drug Introduction/Removal request has been submitted to KHL Pharmacy.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setFormData(initialData); setSubmitted(false); }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Submit Another
            </button>
            <Link href="/report"
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Report
            </Link>
            <Link href="/status"
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-indigo-600 font-semibold text-lg">KHL Pharmacy</Link>
          <div className="flex gap-4">
            <Link href="/report" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Report</Link>
            <Link href="/status" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Status</Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-indigo-600 text-white rounded-t-lg px-6 py-4">
          <h1 className="text-2xl font-bold">Drug Introduction / Removal Form.</h1>
          <p className="text-indigo-100 text-sm mt-1">(Please Fill all the details and submit to KHL pharmacy)</p>
        </div>

        <form onSubmit={handleSubmit}>
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
                  onChange={handleChange} required
                  className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm placeholder-gray-400"
                  placeholder="Short answer text" />
              </div>
            ))}

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Reason / Remark <span className="text-red-500">*</span>
              </label>
              <textarea name="reasonRemark" value={formData.reasonRemark} onChange={handleChange} required rows={3}
                className="w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm placeholder-gray-400 resize-none"
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
                  onChange={handleChange} required
                  className={`w-full border-0 border-b-2 border-gray-200 focus:border-indigo-500 focus:ring-0 py-2 text-sm placeholder-gray-400 ${field.className || ""}`}
                  placeholder="Short answer text" />
              </div>
            ))}

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required
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
