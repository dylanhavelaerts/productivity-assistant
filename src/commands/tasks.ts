import { Context } from "telegraf";
import { getOpenTasks } from "../notion/client";
import { format, parseISO } from "date-fns";

/**
 * Handles the /tasks command to list all open tasks from notion
 * @param ctx - Telegraf context containing message details
 * @returns - A promise that resolves when the list of tasks is fetched and sent as a message
 */
export async function handleTasks(ctx: Context): Promise<void> {
  try {
    const tasks = await getOpenTasks();

    if (tasks.length === 0) {
      await ctx.reply("No open tasks! Good job!");
      return;
    }

    const taskList = tasks
      .map((task, index) => {
        const due = task.dueDate
          ? ` — ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`
          : "";
        return `${index + 1}. ${task.name}${due}`;
      })
      .join("\n");

    await ctx.reply(`**Open Tasks**:\n\n${taskList}`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    await ctx.reply("Failed to fetch tasks. Check your Notion connection.");
    console.error(err);
  }
}
