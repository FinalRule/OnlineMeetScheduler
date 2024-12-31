import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Users, BookOpen, Calendar, Clock } from "lucide-react";
import EditSubjectModal from "@/components/modals/EditSubjectModal";
import { insertSubjectSchema } from "@db/schema";
import type { InsertUser } from "@db/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ClassDetailsModal from "@/components/modals/ClassDetailsModal";
import { format } from 'date-fns';

type Subject = {
  id: number;
  name: string;
  sessionsPerWeek: number;
  durations: number[];
  pricePerDuration: Record<string, number>;
  isActive: boolean;
};

type Class = {
  id: number;
  classId: string;
  subjectId: number;
  teacherId: number;
  startDate: string;
  endDate: string;
  weekDays: string[];
  timePerDay: Record<string, string>;
  durationPerDay: Record<string, number>;
  isActive: boolean;
  subjectName?: string; // Added
  teacherName?: string; // Added

};

type User = {
  id: number;
  username: string;
  name: string;
  role: "teacher" | "student";
  dateOfBirth?: string;
  nationality?: string;
  location?: string;
  basePayment?: number;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  role: "teacher" | "student";
  dateOfBirth?: string;
  nationality?: string;
  location?: string;
  basePayment?: number;
};

type AddClassFormData = {
  subjectId: number;
  teacherId: number;
  studentIds: number[];
  startDate: string;
  endDate: string;
  weekDays: string[];
  timePerDay: Record<string, string>;
  durationPerDay: Record<string, number>;
};

const WEEKDAYS = [
  { label: "Monday", value: "MON" },
  { label: "Tuesday", value: "TUE" },
  { label: "Wednesday", value: "WED" },
  { label: "Thursday", value: "THU" },
  { label: "Friday", value: "FRI" },
  { label: "Saturday", value: "SAT" },
  { label: "Sunday", value: "SUN" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("subjects");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isClassDetailsModalOpen, setIsClassDetailsModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const addUserForm = useForm<RegisterData>({
    defaultValues: {
      role: "student",
      username: "",
      password: "",
      name: "",
    }
  });
  const addSubjectForm = useForm<Subject>({
    defaultValues: {
      name: "",
      sessionsPerWeek: 1,
      durations: [],
      pricePerDuration: {},
      isActive: true,
    }
  });
  const addClass = useForm<AddClassFormData>({
    defaultValues: {
      weekDays: [],
      timePerDay: {},
      durationPerDay: {},
      studentIds: [],
    }
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Parse durations - handle empty or malformed input
        const durations = typeof data.durations === 'string'
          ? data.durations.split(',')
              .map(d => d.trim())
              .filter(Boolean)
              .map(d => parseInt(d, 10))
              .filter(d => !isNaN(d))
          : [];

        // Parse price per duration - handle empty or malformed input
        const pricePerDuration = typeof data.pricePerDuration === 'string'
          ? data.pricePerDuration.split(',')
              .reduce((acc: Record<string, number>, item: string) => {
                const [duration, price] = item.split(':').map(s => s.trim());
                const parsedPrice = parseInt(price, 10);
                if (duration && !isNaN(parsedPrice)) {
                  acc[duration.replace(/['"]/g, '')] = parsedPrice;
                }
                return acc;
              }, {})
          : {};

        const formData = {
          name: data.name,
          sessionsPerWeek: parseInt(data.sessionsPerWeek, 10) || 1,
          durations,
          pricePerDuration,
          isActive: true,
        };

        const response = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        // First check if it's a server error
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        // For client errors, try to get the error message
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || "Failed to create subject");
        }

        // Only try to parse JSON for successful responses
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error in subject mutation:', error);
        throw error instanceof Error ? error : new Error('Failed to create subject');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      addSubjectForm.reset();
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update the form submission handler
  const handleSubjectSubmit = addSubjectForm.handleSubmit((data) => {
    try {
      return addSubjectMutation.mutateAsync(data as Subject);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  });

  const addClassMutation = useMutation({
    mutationFn: async (data: AddClassFormData) => {
      try {
        const formData = {
          ...data,
          startDate: data.startDate,
          endDate: data.endDate,
          weekDays: Array.isArray(data.weekDays) ? data.weekDays : [],
          timePerDay: data.timePerDay || {},
          durationPerDay: data.durationPerDay || {},
        };

        const response = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to create class");
        }

        return response.json();
      } catch (error) {
        console.error('Error in class mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      addClass.reset();
      setSelectedWeekdays([]);
      setIsAddClassModalOpen(false);
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Class creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      addUserForm.reset();
      toast({
        title: "Success",
        description: "User added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubjectRowClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditSubjectModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subjects</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                    </DialogHeader>
                    <Form {...addSubjectForm}>
                      <form
                        onSubmit={handleSubjectSubmit}
                        className="space-y-4"
                      >
                        <FormField
                          control={addSubjectForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addSubjectForm.control}
                          name="durations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Durations (minutes, comma-separated)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addSubjectForm.control}
                          name="pricePerDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price per Duration (e.g., "60": 100, "90": 150)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={typeof field.value === 'object'
                                    ? Object.entries(field.value).map(([k, v]) => `"${k}": ${v}`).join(', ')
                                    : field.value
                                  }
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addSubjectForm.control}
                          name="sessionsPerWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sessions per Week</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit">Add Subject</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sessions/Week</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects?.map((subject) => (
                      <TableRow
                        key={subject.id}
                        onClick={() => handleSubjectRowClick(subject)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.sessionsPerWeek}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subject.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {subject.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <EditSubjectModal
              subject={selectedSubject}
              isOpen={isEditSubjectModalOpen}
              onClose={() => {
                setIsEditSubjectModalOpen(false);
                setSelectedSubject(null);
              }}
            />
          </TabsContent>
          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Classes</CardTitle>
                <Dialog open={isAddClassModalOpen} onOpenChange={setIsAddClassModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Add New Class</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto pr-2">
                      <Form {...addClass}>
                        <form
                          onSubmit={addClass.handleSubmit((data) =>
                            addClassMutation.mutateAsync(data)
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={addClass.control}
                            name="subjectId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <Select
                                  value={field.value?.toString()}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects?.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id.toString()}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addClass.control}
                            name="teacherId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teacher</FormLabel>
                                <Select
                                  value={field.value?.toString()}
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {users?.filter(user => user.role === "teacher").map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addClass.control}
                            name="studentIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Students</FormLabel>
                                <div className="border rounded-md p-4 space-y-2">
                                  {users?.filter(user => user.role === "student").map((student) => (
                                    <div key={student.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={field.value?.includes(student.id)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), student.id]
                                            : (field.value || []).filter(id => id !== student.id);
                                          field.onChange(newValue);
                                        }}
                                      />
                                      <label className="text-sm">{student.name}</label>
                                    </div>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addClass.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={addClass.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={addClass.control}
                            name="weekDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Week Days</FormLabel>
                                <div className="border rounded-md p-4 space-y-2">
                                  {WEEKDAYS.map(({ label, value }) => (
                                    <div key={value} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={field.value?.includes(value)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), value]
                                            : (field.value || []).filter(day => day !== value);
                                          field.onChange(newValue);
                                          setSelectedWeekdays(newValue);
                                        }}
                                      />
                                      <label className="text-sm">{label}</label>
                                    </div>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />

                          {selectedWeekdays.map((day) => (
                            <div key={day} className="grid grid-cols-2 gap-4 border rounded-md p-4">
                              <h4 className="col-span-2 font-medium">{WEEKDAYS.find(w => w.value === day)?.label}</h4>

                              <FormField
                                control={addClass.control}
                                name={`timePerDay.${day}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="time"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          const newTimePerDay = { ...addClass.getValues().timePerDay, [day]: e.target.value };
                                          addClass.setValue('timePerDay', newTimePerDay);
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={addClass.control}
                                name={`durationPerDay.${day}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Duration (minutes)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="15"
                                        step="15"
                                        {...field}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          field.onChange(value);
                                          const newDurationPerDay = { ...addClass.getValues().durationPerDay, [day]: value };
                                          addClass.setValue('durationPerDay', newDurationPerDay);
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          ))}

                          <Button type="submit">Add Class</Button>
                        </form>
                      </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes?.map((cls) => (
                      <TableRow
                        key={cls.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsClassDetailsModalOpen(true);
                        }}
                      >
                        <TableCell>{cls.subjectName}</TableCell>
                        <TableCell>{cls.teacherName}</TableCell>
                        <TableCell>
                          {format(new Date(cls.startDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(cls.endDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cls.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {cls.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <ClassDetailsModal
              class_={selectedClass}
              isOpen={isClassDetailsModalOpen}
              onClose={() => {
                setIsClassDetailsModalOpen(false);
                setSelectedClass(null);
              }}
            />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <Form {...addUserForm}>
                      <form
                        onSubmit={addUserForm.handleSubmit((data) => {
                          const formData = {
                            ...data,
                            basePayment: data.basePayment ? Number(data.basePayment) : undefined,
                          };
                          addUserMutation.mutateAsync(formData);
                        })}
                        className="space-y-4"
                      >
                        <FormField
                          control={addUserForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="teacher">Teacher</option>
                                  <option value="student">Student</option>
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addUserForm.control}
                          name="basePayment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {addUserForm.watch("role") === "teacher"
                                  ? "Base Salary per Hour"
                                  : "Base Payment per Hour"}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit">Add User</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Base Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{user.location || "-"}</TableCell>
                        <TableCell>
                          {typeof user.basePayment === 'number'
                            ? `$${user.basePayment.toFixed(2)}/hr`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}