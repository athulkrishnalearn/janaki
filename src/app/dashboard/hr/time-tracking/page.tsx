"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Clock, Loader2, Play, Square, Timer } from "lucide-react";
import { format, startOfWeek, endOfWeek, differenceInMinutes } from "date-fns";

interface TimeEntry {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number;
  breakMinutes: number;
  notes: string | null;
  status: string;
  user: { id: string; name: string };
  employee: { employeeId: string; department: string | null };
  task: { id: string; title: string } | null;
}

const defaultFormData = {
  date: format(new Date(), "yyyy-MM-dd"),
  clockIn: "",
  clockOut: "",
  breakMinutes: "0",
  notes: "",
};

export default function TimeTrackingPage() {
  const { data: session } = useSession();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [activeSession, setActiveSession] = useState<{ startTime: Date } | null>(null);

  const fetchTimeEntries = async () => {
    try {
      const today = new Date();
      const weekStart = format(startOfWeek(today), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(today), "yyyy-MM-dd");

      const response = await fetch(`/api/time-entries?startDate=${weekStart}&endDate=${weekEnd}`);
      const data = await response.json();
      setTimeEntries(data.timeEntries || []);
    } catch (error) {
      toast.error("Failed to fetch time entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const clockInDateTime = formData.clockIn
        ? new Date(`${formData.date}T${formData.clockIn}`)
        : null;
      const clockOutDateTime = formData.clockOut
        ? new Date(`${formData.date}T${formData.clockOut}`)
        : null;

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          clockIn: clockInDateTime?.toISOString(),
          clockOut: clockOutDateTime?.toISOString(),
          breakMinutes: parseInt(formData.breakMinutes) || 0,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create time entry");
      }

      toast.success("Time entry created successfully");
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      fetchTimeEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockIn = () => {
    setActiveSession({ startTime: new Date() });
    setIsClockingIn(true);
    toast.success("Clocked in at " + format(new Date(), "h:mm a"));
  };

  const handleClockOut = async () => {
    if (!activeSession) return;

    const endTime = new Date();
    const minutes = differenceInMinutes(endTime, activeSession.startTime);
    const hours = Math.round((minutes / 60) * 100) / 100;

    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(activeSession.startTime, "yyyy-MM-dd"),
          clockIn: activeSession.startTime.toISOString(),
          clockOut: endTime.toISOString(),
          hoursWorked: hours,
          notes: `Auto-tracked session: ${format(activeSession.startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to save time entry");

      toast.success(`Clocked out! Worked ${hours.toFixed(2)} hours`);
      setActiveSession(null);
      setIsClockingIn(false);
      fetchTimeEntries();
    } catch (error) {
      toast.error("Failed to save time entry");
    }
  };

  const totalHoursThisWeek = timeEntries.reduce((acc, entry) => acc + entry.hoursWorked, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Track work hours and productivity</p>
        </div>
        <div className="flex items-center gap-2">
          {!isClockingIn ? (
            <Button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Clock In
            </Button>
          ) : (
            <Button onClick={handleClockOut} variant="destructive">
              <Square className="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Time Entry</DialogTitle>
                <DialogDescription>Manually log your work hours</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clockIn">Clock In</Label>
                      <Input
                        id="clockIn"
                        type="time"
                        value={formData.clockIn}
                        onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clockOut">Clock Out</Label>
                      <Input
                        id="clockOut"
                        type="time"
                        value={formData.clockOut}
                        onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakMinutes">Break (minutes)</Label>
                    <Input
                      id="breakMinutes"
                      type="number"
                      min="0"
                      value={formData.breakMinutes}
                      onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisWeek.toFixed(1)} hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeEntries.filter(
                (e) => format(new Date(e.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isClockingIn ? (
              <Badge className="bg-green-100 text-green-800">
                <Timer className="mr-1 h-3 w-3 animate-pulse" />
                Currently Working
              </Badge>
            ) : (
              <Badge variant="secondary">Not Clocked In</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Week&apos;s Time Entries</CardTitle>
          <CardDescription>Your logged work hours for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No time entries yet</h3>
              <p className="text-muted-foreground">Start tracking your work hours</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.date), "EEE, MMM d")}
                    </TableCell>
                    <TableCell>
                      {entry.clockIn ? format(new Date(entry.clockIn), "h:mm a") : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.clockOut ? format(new Date(entry.clockOut), "h:mm a") : "-"}
                    </TableCell>
                    <TableCell>{entry.breakMinutes} min</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.hoursWorked.toFixed(2)} hrs</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
