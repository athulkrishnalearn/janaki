"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  PhoneCall, 
  Monitor, 
  Clock, 
  Users, 
  Activity, 
  Volume2, 
  Play,
  Pause,
  Download
} from "lucide-react";
import { useSession } from "next-auth/react";

interface EmployeeActivity {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  location: string | null;
  callData: any;
  screenTime: number | null;
  lastSync: string;
}

interface CallRecord {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  duration: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function EmployeeMonitorPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<any[]>([]);
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch all employees
      const employeesRes = await fetch("/api/users");
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData.users || []);
      }
      
      // Fetch recent activities
      const activitiesRes = await fetch("/api/employees/activities");
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }
      
      // Fetch recent calls
      const callsRes = await fetch("/api/calls/recent");
      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCalls(callsData.calls || []);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCall = (callId: string) => {
    console.log("Playing call:", callId);
    // In a real implementation, this would play the call recording
  };

  const handleDownloadCall = (callId: string) => {
    console.log("Downloading call:", callId);
    // In a real implementation, this would download the call recording
  };

  // Calculate stats
  const totalEmployees = employees.length;
  const activeEmployees = activities.filter(a => 
    new Date(a.lastSync) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  ).length;
  
  const totalCalls = calls.length;
  const avgCallDuration = calls.length > 0 
    ? (calls.reduce((sum, call) => sum + call.duration, 0) / calls.length / 60).toFixed(1) // in minutes
    : "0";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Employee Monitor</h1>
        <p className="text-muted-foreground">
          Monitor sales staff calls, screen time, and performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                <p className="text-2xl font-bold">{activeEmployees}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calls Today</p>
                <p className="text-2xl font-bold">{totalCalls}</p>
              </div>
              <PhoneCall className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{avgCallDuration}m</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Records</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="screen-time">Screen Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Employees */}
            <Card>
              <CardHeader>
                <CardTitle>Active Employees</CardTitle>
                <CardDescription>Currently active employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.slice(0, 5).map((emp) => {
                    const activity = activities.find(a => a.userId === emp.id);
                    const lastActivity = activity ? new Date(activity.lastSync) : null;
                    const isOnline = lastActivity && 
                      lastActivity > new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes
                    
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`}></div>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                        <Badge variant={isOnline ? "default" : "secondary"}>
                          {isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Calls */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>Latest call recordings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calls.slice(0, 5).map((call) => {
                    const employee = employees.find(e => e.id === call.userId);
                    
                    return (
                      <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{employee?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{call.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(call.createdAt).toLocaleString()} • {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handlePlayCall(call.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDownloadCall(call.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Records</CardTitle>
              <CardDescription>All call recordings from sales staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Employee</th>
                      <th className="text-left py-2">Phone Number</th>
                      <th className="text-left py-2">Duration</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => {
                      const employee = employees.find(e => e.id === call.userId);
                      
                      return (
                        <tr key={call.id} className="border-b">
                          <td className="py-2">{employee?.name || "Unknown"}</td>
                          <td className="py-2">{call.phoneNumber}</td>
                          <td className="py-2">{Math.floor(call.duration / 60)}m {call.duration % 60}s</td>
                          <td className="py-2">{new Date(call.createdAt).toLocaleString()}</td>
                          <td className="py-2">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handlePlayCall(call.id)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDownloadCall(call.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Activities</CardTitle>
              <CardDescription>Activity logs from mobile app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const employee = employees.find(e => e.id === activity.userId);
                  
                  return (
                    <div key={activity.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{employee?.name || "Unknown"}</h4>
                          <p className="text-sm text-muted-foreground">{activity.location || "Location not available"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          Activity
                        </Badge>
                      </div>
                      {activity.callData && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <p><strong>Call Info:</strong> {activity.callData.phoneNumber || "Unknown number"}</p>
                          <p><strong>Duration:</strong> {activity.callData.duration || 0}s</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screen-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Screen Time Monitoring</CardTitle>
              <CardDescription>Screen time tracking from mobile devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.filter(a => a.screenTime).map((activity) => {
                  const employee = employees.find(e => e.id === activity.userId);
                  const screenTimeMinutes = activity.screenTime ? Math.floor(activity.screenTime / 60) : 0;
                  
                  return (
                    <div key={activity.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{employee?.name || "Unknown"}</h4>
                        <span className="text-sm font-medium">{screenTimeMinutes}m</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={(screenTimeMinutes % 600) / 6} className="flex-1" /> {/* Max 10 hours */}
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
