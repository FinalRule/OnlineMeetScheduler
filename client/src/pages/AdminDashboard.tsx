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

type Subject = {
  id: number;
  name: string;
  duration: number;
  price: number;
  sessionsPerWeek: number;
};

type Class = {
  id: number;
  subjectId: number;
  teacherId: number;
  studentId: number;
  startDate: string;
  endDate: string;
  customPrice?: number;
  customTeacherSalary?: number;
  adminNotes?: string;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("subjects");

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const addSubjectForm = useForm<Subject>();
  const addClass = useForm<Class>();

  const addSubjectMutation = useMutation({
    mutationFn: async (data: Subject) => {
      const response = await fetch("/api/subjects", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
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

  const addClassMutation = useMutation({
    mutationFn: async (data: Class) => {
      const response = await fetch("/api/classes", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class added successfully",
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
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (minutes)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addSubjectForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
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
                        <FormField
                          control={addSubjectForm.control}
                          name="sessionsPerWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sessions per Week</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
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
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sessions/Week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects?.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.duration} min</TableCell>
                        <TableCell>${subject.price}</TableCell>
                        <TableCell>{subject.sessionsPerWeek}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
        </Tabs>
      </div>
    </div>
  );
}
