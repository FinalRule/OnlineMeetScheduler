import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableRow, TableCell, Table, TableHeader, TableHead, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users } from "lucide-react";
import type { Class } from "@db/schema";
import { format } from "date-fns";

interface Props {
  class_: Class & {
    subjectName?: string;
    teacherName?: string;
    students?: { id: number; name: string }[];
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Class Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                  {formatWeekDays(class_.weekDays)}
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
                {class_.weekDays.map((day) => (
                  <TableRow key={day}>
                    <TableCell>{day}</TableCell>
                    <TableCell>{class_.timePerDay[day]}</TableCell>
                    <TableCell>{class_.durationPerDay[day]} minutes</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
