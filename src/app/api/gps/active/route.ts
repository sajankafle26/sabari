import { NextResponse } from "next/server";
import { GPSLog } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function GET(request: Request) {
  const { error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const activeVehicles = await GPSLog.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$vehicle", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicleInfo",
        },
      },
      { $unwind: { path: "$vehicleInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "drivers",
          localField: "driver",
          foreignField: "_id",
          as: "driverInfo",
        },
      },
      { $unwind: { path: "$driverInfo", preserveNullAndEmptyArrays: true } },
    ]);

    return NextResponse.json({ activeVehicles });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch active vehicles" }, { status: 500 });
  }
}
