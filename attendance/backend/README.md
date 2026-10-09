# New Duke & Duchess Attendance — Backend Service

This folder contains the database models, Express API server, Prisma schema, and seeding tools for the New Duke & Duchess Attendance system.

## Folder Structure

```text
backend/
├── src/
│   ├── db.ts               # Mongoose database connection module
│   ├── server.ts           # Express API server entry point
│   └── models/             # Database Mongoose models
│       ├── User.ts
│       ├── Attendance.ts
│       ├── AttendanceAttempt.ts
│       ├── Leave.ts
│       ├── Payroll.ts
│       └── SalonSettings.ts
├── prisma/
│   └── schema.prisma       # Prisma ORM schema
├── attendance.db           # Local SQLite database file
├── seed.ts                 # Database seeder script
├── .env                    # Environment config
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

- **`npm run dev`**: Start the backend server in development mode.
- **`npm run seed`**: Seed initial admin user (`A001`), staff (`E001`), and salon location settings.
- **`npm run build`**: Compile TypeScript source code to `dist/`.
- **`npm run start`**: Run the compiled production server.
