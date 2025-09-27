import { auth } from "../actions";
import { redirect } from "next/navigation";
import CreateEventClient from "./create-event-client";

export default async function CreateEventPage() {
  const subject = await auth();

  if (!subject) {
    redirect("/login");
  }

  return <CreateEventClient user={subject.properties} />;
}