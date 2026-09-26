import { NextRequest, NextResponse } from "next/server";
import { getAllSubmissions, addSubmission, updateSubmission } from "@/lib/github";
import { Submission } from "@/lib/types";

const VALID_DECISIONS = ["", "approved", "rejected"];
const MAX_FIELD_LENGTH = 5000;

function sanitize(body: Record<string, unknown>, stripCommittee = false): Record<string, string> {
  const fields = [
    "drugUsedFor", "genericDrugName", "brandName", "reasonRemark",
    "applicantDetails", "nameBlockLetters", "department", "date",
    "description", "decision", "committeeRemarks", "committeeMemberDetails",
    "member1Name", "member1Date", "member2Name", "member2Date",
    "member3Name", "member3Date",
  ];
  const result: Record<string, string> = {};
  for (const f of fields) {
    if (stripCommittee && ["decision", "committeeRemarks", "committeeMemberDetails",
      "member1Name", "member1Date", "member2Name", "member2Date",
      "member3Name", "member3Date"].includes(f)) continue;
    result[f] = String(body[f] || "").slice(0, MAX_FIELD_LENGTH);
  }
  return result;
}

function validateDecision(decision: string): boolean {
  return VALID_DECISIONS.includes(decision);
}

export async function GET() {
  try {
    const submissions = await getAllSubmissions();
    return NextResponse.json(submissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const requiredFields = [
      "drugUsedFor", "genericDrugName", "brandName", "reasonRemark",
      "applicantDetails", "nameBlockLetters", "department", "date",
    ];
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const s = sanitize(body, true);

    const submission: Submission = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      drugUsedFor: s.drugUsedFor,
      genericDrugName: s.genericDrugName,
      brandName: s.brandName,
      reasonRemark: s.reasonRemark,
      applicantDetails: s.applicantDetails,
      nameBlockLetters: s.nameBlockLetters,
      department: s.department,
      date: s.date,
      description: "",
      decision: "",
      committeeRemarks: "",
      committeeMemberDetails: "",
      member1Name: "",
      member1Date: "",
      member2Name: "",
      member2Date: "",
      member3Name: "",
      member3Date: "",
    };

    const saved = await addSubmission(submission);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Missing or invalid submission id" }, { status: 400 });
    }

    const updates: Partial<Submission> = {};

    if (body.description !== undefined) updates.description = String(body.description || "").slice(0, MAX_FIELD_LENGTH);
    if (body.decision !== undefined) {
      const d = String(body.decision || "");
      if (!validateDecision(d)) {
        return NextResponse.json({ error: `Invalid decision value: "${d}". Must be "approved", "rejected", or empty.` }, { status: 400 });
      }
      updates.decision = d as "" | "approved" | "rejected";
    }
    if (body.committeeRemarks !== undefined) updates.committeeRemarks = String(body.committeeRemarks || "").slice(0, MAX_FIELD_LENGTH);
    if (body.committeeMemberDetails !== undefined) updates.committeeMemberDetails = String(body.committeeMemberDetails || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member1Name !== undefined) updates.member1Name = String(body.member1Name || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member1Date !== undefined) updates.member1Date = String(body.member1Date || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member2Name !== undefined) updates.member2Name = String(body.member2Name || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member2Date !== undefined) updates.member2Date = String(body.member2Date || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member3Name !== undefined) updates.member3Name = String(body.member3Name || "").slice(0, MAX_FIELD_LENGTH);
    if (body.member3Date !== undefined) updates.member3Date = String(body.member3Date || "").slice(0, MAX_FIELD_LENGTH);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateSubmission(body.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
