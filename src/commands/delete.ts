import { Context } from "telegraf";
import { getAllTasks, deleteTask } from "../notion/client";
import { format, parseISO } from "date-fns";

export const pendingDelete = new Map<number, string[]>();

/**
 * Handles the /delete command to permanently delete a task from Notion
 * Expected flow:
 * 1. User sends /delete
 * 2. Bot replies with a numbered list of open tasks
 * 3. User replies with the number corresponding to the task to delete
 * 4. Bot deletes the task from Notion and confirms
 * @param ctx - Telegraf context containing message details
 * @returns - A promise that resolves when the task is deleted and a confirmation message is sent
 */
export async function handleDelete(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.trim();

  if (!pendingDelete.has(userId) && !text?.startsWith("/delete")) {
    return;
  }

  if (pendingDelete.has(userId) && text && !text.startsWith("/delete")) {
    const taskIds = pendingDelete.get(userId)!;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= taskIds.length) {
      await ctx.reply("Invalid number. Try again or send /delete to restart.");
      return;
    }

    try {
      await deleteTask(taskIds[index]);
      pendingDelete.delete(userId);
      await ctx.reply("Task deleted.");
    } catch (err) {
      await ctx.reply("Failed to delete task.");
      console.error(err);
    }
    return;
  }

  try {
    const tasks = await getAllTasks();

    if (tasks.length === 0) {
      await ctx.reply("No tasks found.");
      return;
    }

    pendingDelete.set(
      userId,
      tasks.map((t) => t.id),
    );

    const taskList = tasks
      .map((task, index) => {
        const due = task.dueDate
          ? ` — ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`
          : "";
        return `${index + 1}. ${task.name}${due}`;
      })
      .join("\n");

    await ctx.reply(
      `Which task should be deleted? Task number:\n\n${taskList}`,
    );
  } catch (err) {
    await ctx.reply("Failed to fetch tasks.");
    console.error(err);
  }
}
