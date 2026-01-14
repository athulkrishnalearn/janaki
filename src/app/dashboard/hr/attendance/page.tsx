"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Attendance {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  status: string;
  workHours: number;
  location: string | null;
  employee: {
    user: {
      name: string;
    };
  };
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendances();
  }, [selectedMonth, selectedYear]);

  const fetchAttendances = async () => {
    try {
      const res = await fetch(
        `/api/hr/attendance?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch (error) {
      console.error("Error fetching attendances:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "half-day":
        return "bg-yellow-100 text-yellow-800";
      case "late":
        return "bg-orange-100 text-orange-800";
      case "on-leave":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Monitor employee attendance and work hours
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {format(new Date(2024, i, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : attendances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found for this period
            </p>
          ) : (
            <div className="space-y-4">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{attendance.employee.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(attendance.date), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {attendance.clockIn && (
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>In: {format(new Date(attendance.clockIn), "HH:mm")}</span>
                        </div>
                      </div>
                    )}

                    {attendance.clockOut && (
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>Out: {format(new Date(attendance.clockOut), "HH:mm")}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-sm font-medium">
                      {attendance.workHours.toFixed(2)}h
                    </div>

                    {attendance.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{attendance.location}</span>
                      </div>
                    )}

                    <Badge className={getStatusColor(attendance.status)}>
                      {attendance.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
