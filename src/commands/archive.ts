import { Context } from "telegraf";
import { getOpenTasks, updateTaskStatus } from "../notion/client";
import { format, parseISO } from "date-fns";

const pendingArchive = new Map<number, string[]>();

/**
 * Handles the /archive command to mark a task as archived in notion
 * Expected flow:
 * 1. User sends /archive
 * 2. Bot replies with a numbered list of open tasks
 * 3. User replies with the number corresponding to the completed task
 * 4. Bot updates the task status to "Done" in Notion and confirms
 *
 * Note: /quit to exit the flow
 * @param ctx - Telegraf context containing message details
 * @returns - A promise that resolves when the task is marked as done and a confirmation message is sent
 */
export async function handleArchive(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.trim();

  if (pendingArchive.has(userId) && text && text.startsWith("/quit")) {
    pendingArchive.delete(userId);
    await ctx.reply("Operation cancelled.");
    return;
  }

  if (!pendingArchive.has(userId) && !text?.startsWith("/archive")) {
    return;
  }

  if (pendingArchive.has(userId) && text && !text.startsWith("/archive")) {
    const taskIds = pendingArchive.get(userId)!;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= taskIds.length) {
      await ctx.reply("Invalid number. Try again or send /archive to restart.");
      return;
    }

    try {
      await updateTaskStatus(taskIds[index], "Archive");
      pendingArchive.delete(userId);
      await ctx.reply("Task marked as archived.");
    } catch (err) {
      await ctx.reply("Failed to update task.");
      console.error(err);
    }
    return;
  }

  try {
    const tasks = await getOpenTasks();

    if (tasks.length === 0) {
      await ctx.reply("No open tasks.");
      return;
    }

    pendingArchive.set(
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

    await ctx.reply(`Which task is archived? Task number:\n\n${taskList}`);
  } catch (err) {
    await ctx.reply("Failed to fetch tasks.");
    console.error(err);
  }
}
