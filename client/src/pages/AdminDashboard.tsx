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
import { PlusCircle, Users, BookOpen, Calendar } from "lucide-react";
import EditSubjectModal from "@/components/modals/EditSubjectModal";
import { insertSubjectSchema } from "@db/schema";
import type { InsertSubject } from "@db/schema";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("subjects");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);

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
  const addClass = useForm<Class>();

  const addSubjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = {
        ...data,
        sessionsPerWeek: Number(data.sessionsPerWeek),
        durations: typeof data.durations === 'string'
          ? data.durations.split(',').map(Number)
          : data.durations,
        pricePerDuration: typeof data.pricePerDuration === 'string'
          ? Object.fromEntries(data.pricePerDuration.split(',').map(item => {
              const [key, value] = item.trim().split(':');
              return [key.replace(/"/g, ''), Number(value.trim())];
            }))
          : data.pricePerDuration,
      };

      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
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
                        onSubmit={addSubjectForm.handleSubmit((data) =>
                          addSubjectMutation.mutateAsync(data as Subject)
                        )}
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Class</DialogTitle>
                    </DialogHeader>
                    <Form {...addClass}>
                      <form
                        onSubmit={addClass.handleSubmit((data) =>
                          addClassMutation.mutateAsync(data as Class)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={addClass.control}
                          name="subjectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full p-2 border rounded-md"
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                >
                                  {subjects?.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
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
                        <Button type="submit">Add Class</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes?.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>{cls.id}</TableCell>
                        <TableCell>
                          {subjects?.find((s) => s.id === cls.subjectId)?.name}
                        </TableCell>
                        <TableCell>
                          {new Date(cls.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(cls.endDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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