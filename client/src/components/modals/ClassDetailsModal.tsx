import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableRow, TableCell, Table, TableHeader, TableHead, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, Video } from "lucide-react";
import type { Class } from "@db/schema";
import { format } from "date-fns";

interface Props {
  class_: Class & {
    subjectName?: string;
    teacherName?: string;
    students?: { id: number; name: string }[];
    appointments?: {
      id: number;
      date: string;
      time: string;
      duration: number;
      meetLink?: string;
      status: "scheduled" | "completed" | "cancelled";
    }[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClassDetailsModal({ class_, isOpen, onClose }: Props) {
  if (!class_) return null;

  const formatWeekDays = (weekDays: string[]) => {
    const dayMap: Record<string, string> = {
      MON: "Monday",
      TUE: "Tuesday",
      WED: "Wednesday",
      THU: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
      SUN: "Sunday",
    };
    return weekDays.map(day => dayMap[day] || day).join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Class Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {format(new Date(class_.startDate), 'MMM d, yyyy')} - {format(new Date(class_.endDate), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatWeekDays(class_.weekDays as string[])}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subject & Teacher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{class_.subjectName}</p>
                <p className="text-sm text-muted-foreground">{class_.teacherName}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Schedule Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(class_.weekDays as string[]).map((day) => (
                  <TableRow key={day}>
                    <TableCell>{day}</TableCell>
                    <TableCell>{(class_.timePerDay as Record<string, string>)[day]}</TableCell>
                    <TableCell>{(class_.durationPerDay as Record<string, number>)[day]} minutes</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {class_.appointments && class_.appointments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Appointments</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Meeting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {class_.appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>{format(new Date(apt.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{apt.time}</TableCell>
                      <TableCell>{apt.duration} minutes</TableCell>
                      <TableCell>
                        <Badge variant={apt.status === 'scheduled' ? 'secondary' : apt.status === 'completed' ? 'default' : 'destructive'}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {apt.meetLink ? (
                          <a
                            href={apt.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Video className="h-4 w-4" />
                            Join
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {class_.students && class_.students.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Students</h3>
              <div className="flex flex-wrap gap-2">
                {class_.students.map((student) => (
                  <Badge key={student.id} variant="secondary">
                    {student.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {class_.teacherNotes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Teacher Notes</h3>
              <p className="text-sm text-muted-foreground">{class_.teacherNotes}</p>
            </div>
          )}

          {class_.adminNotes && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Admin Notes</h3>
              <p className="text-sm text-muted-foreground">{class_.adminNotes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}