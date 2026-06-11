CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('doctor','home_care','physiotherapy','pharmacy','hospital','other') NOT NULL,
	`description` text,
	`location` varchar(255),
	`startAt` bigint NOT NULL,
	`endAt` bigint,
	`allDay` boolean NOT NULL DEFAULT false,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `care_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`userId` int NOT NULL,
	`careRole` enum('family_member','patient','care_coordinator') NOT NULL,
	`displayName` varchar(255),
	`canEdit` boolean NOT NULL DEFAULT true,
	`canInvite` boolean NOT NULL DEFAULT false,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `care_group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `care_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`patientDob` varchar(20),
	`patientNotes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `care_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('prescription','power_of_attorney','medical_report','lab_result','referral','other') NOT NULL,
	`description` text,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`careRole` enum('family_member','patient','care_coordinator') NOT NULL,
	`token` varchar(128) NOT NULL,
	`accepted` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `medical_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`loggedByUserId` int NOT NULL,
	`entryType` enum('medication','symptom','vital','wellbeing','note') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`vitalSystolic` int,
	`vitalDiastolic` int,
	`vitalPulse` int,
	`vitalTemp` varchar(10),
	`vitalWeight` varchar(10),
	`vitalOxygen` int,
	`medicationName` varchar(255),
	`medicationDose` varchar(100),
	`medicationGiven` boolean,
	`severity` int,
	`recordedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medical_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`careGroupId` int,
	`type` enum('appointment','task_assigned','medical_log','document','invitation','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`linkPath` varchar(512),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`assignedToUserId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','done') NOT NULL DEFAULT 'pending',
	`dueAt` bigint,
	`completedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`careGroupId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`eventType` enum('diagnosis','treatment','surgery','hospitalization','medication_start','medication_stop','test_result','milestone','note') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`provider` varchar(255),
	`icdCode` varchar(20),
	`eventDate` bigint NOT NULL,
	`isKeyEvent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeline_events_id` PRIMARY KEY(`id`)
);
