import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";
import { handleAdd } from "./commands/add";
import { handleTasks } from "./commands/tasks";
import { handleDone } from "./commands/done";
import { handleArchive } from "./commands/archive";
import { startDeadlineNotifier } from "./jobs/deadlineNotifier";
import { handleDelete } from "./commands/delete";
import { handleQuit } from "./commands/quit";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID!);

// Middleware — only allow your Telegram user ID
bot.use((ctx, next) => {
  if (ctx.from?.id !== ALLOWED_USER_ID) {
    return ctx.reply("Unauthorized.");
  }
  return next();
});

// Commands
bot.command("add", handleAdd);
bot.command("tasks", handleTasks);
bot.command("done", handleDone);
bot.command("archive", handleArchive);
bot.command("delete", handleDelete);
bot.command("quit", (ctx) => handleQuit(ctx));

// Handle plain text replies (for multi-step flows)
bot.on("text", async (ctx) => {
  if (await handleQuit(ctx)) return;
  await handleDone(ctx);
  await handleArchive(ctx);
  await handleDelete(ctx);
});

// Start cron job
startDeadlineNotifier(bot);

// Start bot
(async () => {
  try {
    await bot.launch();
    console.log("Bot is running.");
  } catch (err) {
    console.error("Failed to launch bot:", err);
  }
})();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
