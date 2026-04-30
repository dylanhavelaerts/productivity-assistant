import { Context } from "telegraf";
import { getOpenTasks, deleteTask } from "../notion/client";
import { format, parseISO } from "date-fns";

const pendingDelete = new Map<number, string[]>();

/**
 * Handles the /delete command to delete a task in notion
 * Expected flow:
 * 1. User sends /delete
 * 2. Bot replies with a numbered list of open tasks
 * 3. User replies with the number corresponding to the task to delete
 * 4. Bot deletes the task in Notion and confirms
 *
 * Note: /quit to exit the flow
 * @param ctx
 * @returns
 */
export async function handleDelete(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.trim();

  // 1. Handle Quit
  if (pendingDelete.has(userId) && text === "/quit") {
    pendingDelete.delete(userId);
    await ctx.reply("Operation cancelled.");
    return;
  }

  if (!pendingDelete.has(userId) && text !== "/delete") {
    return;
  }

  if (pendingDelete.has(userId) && text !== "/delete") {
    const taskIds = pendingDelete.get(userId)!;
    const index = parseInt(text || "") - 1;

    if (isNaN(index) || index < 0 || index >= taskIds.length) {
      await ctx.reply("Invalid number. Try again or send /quit to cancel.");
      return;
    }

    try {
      await deleteTask(taskIds[index]);
      pendingDelete.delete(userId);
      await ctx.reply("Task deleted successfully.");
    } catch (err) {
      await ctx.reply(
        "Failed to delete task. Please check your Notion connection.",
      );
      console.error(err);
    }
    return;
  }

  try {
    const tasks = await getOpenTasks();

    if (tasks.length === 0) {
      await ctx.reply("No open tasks to delete.");
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
      `Which task do you want to DELETE? This cannot be undone.\n\n${taskList}\n\nSend the number or /quit:`,
    );
  } catch (err) {
    await ctx.reply("Failed to fetch tasks from Notion.");
    console.error(err);
  }
}
