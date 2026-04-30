import cron from "node-cron";
import { Telegraf } from "telegraf";
import { getUpcomingTasks } from "../notion/client";
import { format, parseISO } from "date-fns";

const messages = [
  (count: number, list: string) =>
    `Good morning. You have ${count} task(s) due soon:\n\n${list}`,
  (count: number, list: string) =>
    `Rise and shine! You've got ${count} items on your radar today:\n\n${list}`,
  (count: number, list: string) =>
    `Daily Status Report: ${count} task(s) require your attention.\n\n${list}`,
  (count: number, list: string) =>
    `Heads up! You have ${count} approaching deadline(s):\n\n${list}`,
  (count: number, list: string) =>
    `Hey! Just a quick reminder about these ${count} tasks:\n\n${list}`,
];

const completeMessage = [
  "All clear! No upcoming deadlines for now. Enjoy your day!",
  "Great job! You're all caught up on your tasks.",
  "No urgent deadlines at the moment. Take a break and recharge!",
];

/**
 * Schedules a daily notification at 09:00 to remind the user of upcoming task deadlines
 * @param bot - Telegraf bot instance that sends the notification
 */
export function startDeadlineNotifier(bot: Telegraf): void {
  cron.schedule(
    "0 9 * * *",
    async () => {
      const userId = process.env.TELEGRAM_USER_ID!;

      try {
        const tasks = await getUpcomingTasks();

        // if there are no upcoming tasks, send a random "all clear" message
        if (tasks.length === 0) {
          const randomIndex = Math.floor(
            Math.random() * completeMessage.length,
          );
          await bot.telegram.sendMessage(userId, completeMessage[randomIndex]);
          return;
        }

        const taskList = tasks
          .map((task) => {
            const due = task.dueDate
              ? ` — ${format(parseISO(task.dueDate), "dd/MM/yyyy")}`
              : "";
            return `- ${task.name}${due}`;
          })
          .join("\n");

        // randomly select a message template to keep notifications from becoming boring
        const randomIndex = Math.floor(Math.random() * messages.length);
        const finalMessage = messages[randomIndex](tasks.length, taskList);

        await bot.telegram.sendMessage(userId, finalMessage);
      } catch (err) {
        console.error("Deadline notifier failed:", err);
      }
    },
    {
      timezone: "Europe/Brussels",
    },
  );
}
