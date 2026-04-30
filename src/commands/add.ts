import { Context } from "telegraf";
import { addTask } from "../notion/client";
import { parse, isValid, format } from "date-fns";

/**
 * Handles the /add command to add a new task to notion
 * Expected format: /add Task name:dd/MM/yyyy
 * Date is optional
 * @param ctx - Telegraf context containing message details
 * @returns - A promise that resolves when the task is added and a confirmation message is sent
 */
export async function handleAdd(ctx: Context): Promise<void> {
  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.replace("/add", "").trim();

  if (!text) {
    await ctx.reply("Usage: /add Task name;dd/MM/yyyy\nDate is optional.");
    return;
  }

  const parts = text.split(";");
  const taskName = parts[0].trim();
  let dueDateStr: string | undefined;

  if (parts[1]) {
    const raw = parts[1].trim();
    const parsed = parse(raw, "dd/MM/yyyy", new Date());

    if (!isValid(parsed)) {
      await ctx.reply(
        "Invalid date format, use dd/MM/yyyy -> Example: /add Buy groceries;25/12/2024",
      );
      return;
    }

    // Convert to YYYY-MM-DD for notion (notion expects ISO format)
    dueDateStr = format(parsed, "yyyy-MM-dd");
  }

  try {
    await addTask(taskName, dueDateStr);
    const confirmation = dueDateStr
      ? `Added: "${taskName}" due on ${parts[1].trim()}`
      : `Added: "${taskName}"`;
    await ctx.reply(confirmation);
  } catch (err) {
    await ctx.reply("Failed to add task, check your Notion connection.");
    console.error(err);
  }
}
