import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Subject = {
  id: number;
  name: string;
  sessionsPerWeek: number;
  description?: string;
  durations: number[];
  pricePerDuration: Record<string, number>;
  isActive: boolean;
};

type EditSubjectModalProps = {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function EditSubjectModal({ subject, isOpen, onClose }: EditSubjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Subject>({
    defaultValues: {
      name: subject?.name || "",
      sessionsPerWeek: subject?.sessionsPerWeek || 1,
      description: subject?.description || "",
      durations: subject?.durations || [],
      pricePerDuration: subject?.pricePerDuration || {},
      isActive: subject?.isActive ?? true,
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async (data: Subject) => {
      const response = await fetch(`/api/subjects/${subject?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDurationsChange = (value: string) => {
    try {
      const durationsArray = value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      form.setValue('durations', durationsArray);
    } catch (e) {
      console.error('Error parsing durations:', e);
    }
  };

  const handlePricePerDurationChange = (value: string) => {
    try {
      const priceObj = JSON.parse(`{${value}}`);
      form.setValue('pricePerDuration', priceObj);
    } catch (e) {
      console.error('Error parsing price per duration:', e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateSubjectMutation.mutateAsync(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sessionsPerWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sessions per Week</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durations (minutes, comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value.join(', ')}
                      onChange={(e) => handleDurationsChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Duration (e.g., "60": 100, "90": 150)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={Object.entries(field.value).map(([k, v]) => `"${k}": ${v}`).join(', ')}
                      onChange={(e) => handlePricePerDurationChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}