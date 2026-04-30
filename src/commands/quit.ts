import { Context } from "telegraf";
import { pendingDone } from "./done";
import { pendingArchive } from "./archive";
import { pendingDelete } from "./delete";

export async function handleQuit(ctx: Context): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const message = ctx.message as { text: string } | undefined;
  const text = message?.text?.trim();

  const isQuitCommand = text === "/quit";
  const isQuitText = text === "quit";

  if (!isQuitCommand && !isQuitText) return false;

  const hasPending =
    pendingDone.has(userId) ||
    pendingArchive.has(userId) ||
    pendingDelete.has(userId);

  if (isQuitText && !hasPending) return false;

  pendingDone.delete(userId);
  pendingArchive.delete(userId);
  pendingDelete.delete(userId);

  await ctx.reply(hasPending ? "Operation cancelled." : "No active operation.");
  return true;
}
