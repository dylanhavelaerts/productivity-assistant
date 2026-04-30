<h1 align="center">Productivity Assistant</h1>


<p align="center">
  Personal productivity assistant that links notion database and interacts with telegram messages
</p>

<p align="center">
Current version: v1.0
</p>

## Introduction

This productivity assistant is a small scale project that helps me integrate my notion to-do list database with my phone. A telegram bot will notify me when a deadline is nearby. Besides this I am able to add or complete tasks by interacting in the telegram chat.
This project will be documented and stay open-source for you to try or improve.

### Features

- Telegram deadline notifier
- Telegram ability to add tasks
- Telegram ability to complete tasks
- Telegram ability to see all tasks

### Planned

- Add Dockerfile and docker-compose.yml for hetzner server
- Add /statistics
- Add webpage to see better statistics
- Add study feature to webpage
- ...

### Commands

| Command    | Description                              |
| ---------- | ---------------------------------------- |
| `/tasks`   | List all open tasks with their deadlines |
| `/add`     | Add a new task to your Notion database   |
| `/done`    | Mark a task as done                      |
| `/archive` | Archive a task                           |
| `/delete`  | Permanently delete a task                |

### Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file in the root with the following variables:

- TELEGRAM_BOT_TOKEN=your_bot_token
- TELEGRAM_USER_ID=your_telegram_user_id
- NOTION_TOKEN=your_notion_integration_token
- NOTION_DATABASE_ID=your_notion_database_id

4. Run the bot with `npm start`

### Tech stack

- **Node.js** + **TypeScript**
- **Telegraf** — Telegram bot framework
- **Notion API** — task database
- **date-fns** — date formatting
