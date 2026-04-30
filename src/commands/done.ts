import { Context } from "telegraf";
import { getOpenTasks, updateTaskStatus } from "../notion/client";
import { format, parseISO } from "date-fns";

const pendingDone = new Map<number, string[]>();

/**
 * Handles the /done command to mark a task as done in notion
 * Expected flow:
 * 1. User sends /done
 * 2. Bot replies with a numbered list of open tasks
 * 3. User replies with the number corresponding to the completed task
 * 4. Bot updates the task status to "Done" in Notion and confirms
 *
 * Note: /quit to exit the flow
 * @param ctx - Telegraf context containing message details
 * @returns - A promise that resolves when the task is marked as done and a confirmation message is sent
 */
export async function handleDone(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.trim();

  if (pendingDone.has(userId) && text && text.startsWith("quit")) {
    pendingDone.delete(userId);
    await ctx.reply("Operation cancelled.");
    return;
  }

  if (pendingDone.has(userId) && text && !text.startsWith("/done")) {
    const taskIds = pendingDone.get(userId)!;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= taskIds.length) {
      await ctx.reply("Invalid number. Try again or send /done to restart.");
      return;
    }

    try {
      await updateTaskStatus(taskIds[index], "Done");
      pendingDone.delete(userId);
      await ctx.reply("Task marked as done.");
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

    pendingDone.set(
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

    await ctx.reply(`Which task is done? Task number:\n\n${taskList}`);
  } catch (err) {
    await ctx.reply("Failed to fetch tasks.");
    console.error(err);
  }
}
