import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as dotenv from "dotenv";

dotenv.config();

export const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

export interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
}

/**
 * Takes a Task object from a notion page response
 * @param page - The notion page response to extract the task from (to-do list page in this case)
 * @returns - The extracted Task object
 */
function extractTask(page: PageObjectResponse): Task {
  const props = page.properties;

  const nameProp = props["Name"];
  const name =
    nameProp?.type === "title" && nameProp.title[0]
      ? nameProp.title[0].plain_text
      : "Untitled";

  const statusProp = props["Status"];
  const status =
    statusProp?.type === "status" && statusProp.status
      ? statusProp.status.name
      : "Unknown";

  const dateProp = props["Due date"];
  const dueDate =
    dateProp?.type === "date" && dateProp.date ? dateProp.date.start : null;

  return { id: page.id, name, status, dueDate };
}

/**
 * Fetches all tasks that have not been completed
 * @returns - a promise that resolves to an array of Task objects
 */
export async function getOpenTasks(): Promise<Task[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      or: [
        { property: "Status", status: { equals: "Not started" } },
        { property: "Status", status: { equals: "In progress" } },
      ],
    },
  });

  return (response.results as PageObjectResponse[]).map(extractTask);
}

/**
 * Fetches tasks that are due to today or tomorrow and have not been completed
 * @returns - promise that resolves to an array of Task objects that are due to today or tomorrow
 */
export async function getUpcomingTasks(): Promise<Task[]> {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        {
          or: [
            { property: "Due date", date: { equals: fmt(today) } },
            { property: "Due date", date: { equals: fmt(tomorrow) } },
          ],
        },
        {
          or: [
            { property: "Status", status: { equals: "Not started" } },
            { property: "Status", status: { equals: "In progress" } },
          ],
        },
      ],
    },
  });

  return (response.results as PageObjectResponse[]).map(extractTask);
}

/**
 * Adds a new task to the notion db with the given name and optional due date)
 * @param name - name of the task to add
 * @param dueDate - optional due date for the task
 */
export async function addTask(name: string, dueDate?: string): Promise<void> {
  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      ...(dueDate && { "Due date": { date: { start: dueDate } } }),
    },
  });
  console.log("Created page:", JSON.stringify(response, null, 2));
}

/**
 * Deletes the task with the given id by moving it to the trash
 * @param taskId - id of the task to delete
 */
export async function deleteTask(taskId: string): Promise<void> {
  await notion.pages.update({
    page_id: taskId,
    in_trash: true,
  });
}

/**
 * Updates the status of a task with the given id to the given status (Done or Archive)
 * @param taskId - id of the task to update
 * @param status - new status for the task (Done or Archive)
 */
export async function updateTaskStatus(
  taskId: string,
  status: "Done" | "Archive",
): Promise<void> {
  await notion.pages.update({
    page_id: taskId,
    properties: {
      Status: { status: { name: status } },
    },
  });
}
