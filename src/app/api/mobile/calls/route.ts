import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data for audio file
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const userId = formData.get("userId") as string | null;
    const callData = formData.get("callData") as string | null;
    const phoneNumber = formData.get("phoneNumber") as string | null;
    const duration = formData.get("duration") as string | null;

    if (!audioFile || !userId) {
      return NextResponse.json(
        { error: "Audio file and user ID are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Convert file to buffer and save to storage
    // In a real implementation, you would save to a cloud storage service
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save call record to database
    const callRecord = await prisma.callRecord.create({
      data: {
        userId: userId,
        phoneNumber: phoneNumber || "",
        duration: duration ? parseInt(duration) : 0,
        fileName: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        callData: callData ? JSON.parse(callData) : null,
        audioData: buffer, // In production, store in cloud storage instead
      },
    });

    return NextResponse.json({
      success: true,
      callId: callRecord.id,
      message: "Call recording uploaded successfully",
    });
  } catch (error) {
    console.error("Call upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload call recording" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const calls = await prisma.callRecord.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Return call records without audio data to save bandwidth
    const callsWithoutAudio = calls.map(call => {
      const { audioData, ...callWithoutAudio } = call;
      return callWithoutAudio;
    });

    return NextResponse.json({
      calls: callsWithoutAudio,
      total: await prisma.callRecord.count({ where: { userId: userId } }),
    });
  } catch (error) {
    console.error("Call fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call records" },
      { status: 500 }
    );
  }
}
