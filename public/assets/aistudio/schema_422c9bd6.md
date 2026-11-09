// ============================================================================
// Prisma Schema — FYP PM Platform
// Baseline: SRS v3.0 §6.2 (frozen data dictionary)
// Additions: G-03 (projects.start_date), G-04 (tasks.start_date, completed_at),
//            G-06 (risk_assessments.target_key + task_id + affected_user_id)
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

model User {
  id                      String    @id @default(uuid()) @db.Uuid
  email                   String    @unique @db.VarChar(255)
  passwordHash            String    @map("password_hash") @db.VarChar(255)
  fullName                String    @map("full_name") @db.VarChar(155)
  globalRole              String    @default("Team Member") @map("global_role") @db.VarChar(50)
  configuredCapacityHours Int       @default(40) @map("configured_capacity_hours")
  isActive                Boolean   @default(true) @map("is_active")
  failedLoginAttempts     Int       @default(0) @map("failed_login_attempts")
  lockedUntil             DateTime? @map("locked_until") @db.Timestamptz(6)
  lastLoginAt             DateTime? @map("last_login_at") @db.Timestamptz(6)
  createdAt               DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt               DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  teamMemberships     TeamMember[]
  projectMemberships  ProjectMember[]
  taskAssignments     TaskAssignee[]
  comments            Comment[]
  commentMentions     CommentMention[]
  attachments         Attachment[]
  notifications       Notification[]
  auditLogs           AuditLog[]       @relation("AuditActor")
  assignedMemberships TeamMember[]     @relation("TeamMemberAssignedBy")
  affectedRisks       RiskAssessment[] @relation("RiskAffectedUser")

  @@map("users")
  @@index([globalRole])
  @@index([isActive])
}

model Role {
  id   String @id @default(uuid()) @db.Uuid
  name String @unique @db.VarChar(50)

  @@map("roles")
}

model Team {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  members  TeamMember[]
  projects Project[]

  @@map("teams")
  @@index([name])
}

model TeamMember {
  teamId     String   @map("team_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  role       String   @default("Member") @db.VarChar(50)
  assignedBy String?  @map("assigned_by") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at") @db.Timestamptz(6)

  team       Team  @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user       User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedByUser User? @relation("TeamMemberAssignedBy", fields: [assignedBy], references: [id], onDelete: SetNull)

  @@id([teamId, userId])
  @@map("team_members")
  @@index([userId])
}

model Project {
  id          String    @id @default(uuid()) @db.Uuid
  teamId      String    @map("team_id") @db.Uuid
  title       String    @db.VarChar(150)
  description String?   @db.Text
  status      String    @default("Active") @db.VarChar(50)
  priority    String    @default("MEDIUM") @db.VarChar(50)
  startDate   DateTime? @map("start_date") @db.Timestamptz(6) // G-03 additive
  deadline    DateTime? @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  team     Team            @relation(fields: [teamId], references: [id], onDelete: Cascade)
  members  ProjectMember[]
  tasks    Task[]
  risks    RiskAssessment[]

  @@map("projects")
  @@index([teamId])
  @@index([status])
}

model ProjectMember {
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @default("Contributor") @db.VarChar(50)
  joinedAt  DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@map("project_members")
  @@index([userId])
}

model Task {
  id              String    @id @default(uuid()) @db.Uuid
  projectId       String    @map("project_id") @db.Uuid
  title           String    @db.VarChar(200)
  description     String?   @db.Text
  status          String    @default("TODO") @db.VarChar(50)
  priority        String    @default("MEDIUM") @db.VarChar(50)
  startDate       DateTime? @map("start_date") @db.Timestamptz(6)    // G-04 additive
  dueDate         DateTime? @map("due_date") @db.Timestamptz(6)
  completedAt     DateTime? @map("completed_at") @db.Timestamptz(6)  // G-04 additive
  estimatedEffort Decimal   @default(0.00) @map("estimated_effort") @db.Decimal(5, 2)
  subtasks        Json?     @default("[]") @db.JsonB
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignees       TaskAssignee[]
  comments        Comment[]
  attachments     Attachment[]
  dependencies    TaskDependency[] @relation("BlockedTask")
  blocking        TaskDependency[] @relation("BlockingTask")
  risks           RiskAssessment[] @relation("RiskTask")

  @@map("tasks")
  @@index([projectId, status])
  @@index([projectId, priority])
  @@index([dueDate])
}

model TaskDependency {
  id            String   @id @default(uuid()) @db.Uuid
  blockingTaskId String  @map("blocking_task_id") @db.Uuid
  blockedTaskId  String  @map("blocked_task_id")  @db.Uuid
  type          String   @default("BLOCKS") @db.VarChar(50)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  blockingTask Task @relation("BlockingTask", fields: [blockingTaskId], references: [id], onDelete: Cascade)
  blockedTask  Task @relation("BlockedTask",  fields: [blockedTaskId],  references: [id], onDelete: Cascade)

  @@unique([blockingTaskId, blockedTaskId])
  @@map("task_dependencies")
  @@index([blockingTaskId])
  @@index([blockedTaskId])
}

model TaskAssignee {
  taskId String @map("task_id") @db.Uuid
  userId String @map("user_id") @db.Uuid

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@map("task_assignees")
  @@index([userId])
}

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  taskId    String   @map("task_id") @db.Uuid
  authorId  String   @map("author_id") @db.Uuid
  body      String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime? @map("updated_at") @db.Timestamptz(6)

  task        Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author      User             @relation(fields: [authorId], references: [id], onDelete: Cascade)
  mentions    CommentMention[]
  attachments Attachment[]

  @@map("comments")
  @@index([taskId])
  @@index([authorId])
}

model CommentMention {
  commentId String @map("comment_id") @db.Uuid
  userId    String @map("user_id") @db.Uuid

  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([commentId, userId])
  @@map("comment_mentions")
  @@index([userId])
}

model Attachment {
  id               String   @id @default(uuid()) @db.Uuid
  taskId           String?  @map("task_id") @db.Uuid
  commentId        String?  @map("comment_id") @db.Uuid
  storageKey       String   @map("storage_key") @db.VarChar(512)
  mimeType         String   @map("mime_type") @db.VarChar(100)
  fileSize         BigInt   @map("file_size")
  originalFilename String   @map("original_filename") @db.VarChar(255)
  uploadedBy       String   @map("uploaded_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  task    Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  uploader User    @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)

  @@map("attachments")
  @@index([taskId])
  @@index([commentId])
}

model Notification {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  type      String    @db.VarChar(50)
  payload   Json      @db.JsonB
  readAt    DateTime? @map("read_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
  @@index([userId, createdAt])
  @@index([userId, readAt])
}

model AuditLog {
  id            String   @id @default(uuid()) @db.Uuid
  actorId       String?  @map("actor_id") @db.Uuid
  entityType    String   @map("entity_type") @db.VarChar(100)
  entityId      String   @map("entity_id") @db.Uuid
  action        String   @db.VarChar(50)
  oldValues     Json?    @map("old_values") @db.JsonB
  newValues     Json?    @map("new_values") @db.JsonB
  correlationId String   @map("correlation_id") @db.Uuid
  timestamp     DateTime @default(now()) @db.Timestamptz(6)

  actor User? @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@map("audit_logs")
  @@index([timestamp, entityType])
  @@index([entityId])
  @@index([actorId])
  @@index([correlationId])
}

model RiskAssessment {
  id             String    @id @default(uuid()) @db.Uuid
  projectId      String    @map("project_id") @db.Uuid
  riskType       String    @map("risk_type") @db.VarChar(50)
  riskScore      Int       @map("risk_score")
  severity       String    @db.VarChar(50)
  reason         String    @db.Text
  recommendation String    @db.Text
  status         String    @default("Open") @db.VarChar(50)
  targetKey      String?   @map("target_key") @db.VarChar(100)  // G-06 additive
  taskId         String?   @map("task_id") @db.Uuid             // G-06 additive
  affectedUserId String?   @map("affected_user_id") @db.Uuid    // G-06 additive
  resolvedAt     DateTime? @map("resolved_at") @db.Timestamptz(6)
  generatedAt    DateTime  @default(now()) @map("generated_at") @db.Timestamptz(6)

  project      Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task         Task?   @relation("RiskTask", fields: [taskId], references: [id], onDelete: SetNull)
  affectedUser User?   @relation("RiskAffectedUser", fields: [affectedUserId], references: [id], onDelete: SetNull)

  @@map("risk_assessments")
  @@index([projectId, riskType])
  @@index([projectId, status])
  @@index([severity, status])
  @@index([projectId, riskType, targetKey])
}
