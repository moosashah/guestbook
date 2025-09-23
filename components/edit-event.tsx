"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DateRangePicker } from "@/components/date-picker";
import { Event } from "@/lib/types";
import { DateRange } from "react-day-picker";

interface FormValues {
  dateRange: DateRange;
}

interface EditEventDatesFormProps {
  event: NonNullable<Event>;
}

export function EditEventDatesForm({ event }: EditEventDatesFormProps) {
  const router = useRouter();

  const form = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: {
      dateRange: {
        from: new Date(event.submission_start_date),
        to: new Date(event.submission_end_date),
      },
    },
  });

  const validateDateRange = (dateRange: DateRange) => {
    if (!dateRange?.from || !dateRange?.to) {
      return "Please select both start and end dates";
    }

    const now = new Date();
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Reset time for accurate comparison
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate <= now) {
      return "Start date must be in the future";
    }

    if (endDate <= now) {
      return "End date must be in the future";
    }

    if (endDate <= startDate) {
      return "End date must be after start date";
    }

    return true;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch(`/api/event/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_start_date: data.dateRange.from!.toISOString(),
          submission_end_date: data.dateRange.to!.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to update event";

        // Set server error on the dateRange field
        form.setError("dateRange", {
          type: "server",
          message: errorMessage,
        });
        return;
      }

      const updatedEvent = await response.json();
      console.log("Event updated successfully:", updatedEvent);

      // Redirect to the event details page
      router.push(`/events/${event.id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      form.setError("root", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              Message Submission Period
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set the time period during which guests can submit messages
            </p>

            {form.formState.errors.root && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

            <FormField
              control={form.control}
              name="dateRange"
              rules={{
                validate: validateDateRange,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Date Range</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      dateRange={field.value}
                      setDateRange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/events/${event.id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
