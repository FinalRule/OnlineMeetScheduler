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
import { Calendar, GraduationCap, Video } from "lucide-react";
import { useUser } from "@/hooks/use-user";

type Appointment = {
  id: number;
  classId: number;
  date: string;
  duration: number;
  teacherNote: string;
  studentNote: string;
  studentAttendance: boolean;
  meetLink: string;
};

type Class = {
  id: number;
  subjectId: number;
  teacherId: number;
  studentId: number;
  startDate: string;
  endDate: string;
};

type Subject = {
  id: number;
  name: string;
  duration: number;
  price: number;
  sessionsPerWeek: number;
};

export default function StudentDashboard() {
  const { user } = useUser();

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
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
                      {apt.teacherNote && (
                        <p className="text-sm text-gray-500">
                          Note: {apt.teacherNote}
                        </p>
                      )}
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
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                My Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sessions/Week</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes?.map((cls) => {
                    const subject = subjects?.find(
                      (s) => s.id === cls.subjectId
                    );
                    return (
                      <TableRow key={cls.id}>
                        <TableCell>{subject?.name}</TableCell>
                        <TableCell>{subject?.duration} min</TableCell>
                        <TableCell>{subject?.sessionsPerWeek}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Class History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments?.map((apt) => {
                  const cls = classes?.find((c) => c.id === apt.classId);
                  const subject = subjects?.find(
                    (s) => s.id === cls?.subjectId
                  );
                  return (
                    <TableRow key={apt.id}>
                      <TableCell>
                        {new Date(apt.date).toLocaleString()}
                      </TableCell>
                      <TableCell>{subject?.name}</TableCell>
                      <TableCell>{apt.duration} min</TableCell>
                      <TableCell>
                        {apt.studentAttendance ? "Present" : "Absent"}
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}