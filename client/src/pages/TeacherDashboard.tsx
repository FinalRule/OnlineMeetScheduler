import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, Video } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import NotificationCenter from "@/components/NotificationCenter";

type Appointment = {
  id: number;
  classId: number;
  date: string;
  duration: number;
  teacherNote: string;
  studentNote: string;
  studentAttendance: boolean;
  teacherAttendance: boolean;
  meetLink: string;
};

type Class = {
  id: number;
  subjectId: number;
  teacherId: number;
  studentId: number;
  startDate: string;
  endDate: string;
  customTeacherSalary?: number;
  teacherNotes?: string;
};

export default function TeacherDashboard() {
  const { user } = useUser();

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const upcomingAppointments = appointments
    ?.filter((apt) => new Date(apt.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const joinMeeting = (meetLink: string) => {
    window.open(meetLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <NotificationCenter />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments?.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(apt.date).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {apt.duration} minutes
                      </p>
                    </div>
                    {apt.meetLink && (
                      <Button
                        onClick={() => joinMeeting(apt.meetLink)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meet
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        {new Date(apt.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{apt.duration} min</TableCell>
                      <TableCell>
                        {apt.teacherAttendance ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {apt.meetLink && new Date(apt.date) > new Date() && (
                          <Button
                            size="sm"
                            onClick={() => joinMeeting(apt.meetLink)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class ID</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.id}</TableCell>
                    <TableCell>
                      {new Date(cls.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(cls.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{cls.teacherNotes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}