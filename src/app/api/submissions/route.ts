import { NextRequest, NextResponse } from "next/server";
import { getAllSubmissions, addSubmission, updateSubmission } from "@/lib/github";
import { Submission } from "@/lib/types";

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
    const body = await request.json();

    const requiredFields = [
      "drugUsedFor", "genericDrugName", "brandName", "reasonRemark",
      "applicantDetails", "nameBlockLetters", "department", "date",
    ];
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const submission: Submission = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      drugUsedFor: body.drugUsedFor,
      genericDrugName: body.genericDrugName,
      brandName: body.brandName,
      reasonRemark: body.reasonRemark,
      applicantDetails: body.applicantDetails,
      nameBlockLetters: body.nameBlockLetters,
      department: body.department,
      date: body.date,
      description: body.description || "",
      decision: body.decision || "",
      committeeRemarks: body.committeeRemarks || "",
      committeeMemberDetails: body.committeeMemberDetails || "",
      member1Name: body.member1Name || "",
      member1Date: body.member1Date || "",
      member2Name: body.member2Name || "",
      member2Date: body.member2Date || "",
      member3Name: body.member3Name || "",
      member3Date: body.member3Date || "",
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
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
    }

    const updates: Partial<Submission> = {
      description: body.description || "",
      decision: body.decision || "",
      committeeRemarks: body.committeeRemarks || "",
      committeeMemberDetails: body.committeeMemberDetails || "",
      member1Name: body.member1Name || "",
      member1Date: body.member1Date || "",
      member2Name: body.member2Name || "",
      member2Date: body.member2Date || "",
      member3Name: body.member3Name || "",
      member3Date: body.member3Date || "",
    };

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
