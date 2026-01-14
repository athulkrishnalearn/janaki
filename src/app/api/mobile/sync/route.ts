import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, timestamp, location, callData, screenTime } = body;

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create or update employee activity record
    const activity = await prisma.employeeActivity.upsert({
      where: {
        userId_timestamp: {
          userId: userId,
          timestamp: new Date(timestamp),
        },
      },
      update: {
        location: location,
        callData: callData || undefined,
        screenTime: screenTime || undefined,
        lastSync: new Date(),
      },
      create: {
        userId: userId,
        timestamp: new Date(timestamp),
        location: location,
        callData: callData || undefined,
        screenTime: screenTime || undefined,
        lastSync: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      message: "Activity synced successfully",
    });
  } catch (error) {
    console.error("Mobile sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get recent activities for the user
    const activities = await prisma.employeeActivity.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50, // Get last 50 records
    });

    return NextResponse.json({
      activities,
    });
  } catch (error) {
    console.error("Mobile data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
