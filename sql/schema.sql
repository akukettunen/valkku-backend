-- valkku.sessions definition

CREATE TABLE IF NOT EXISTS `sessions` (
  `jti` char(36) NOT NULL,
  `userId` varchar(21) NOT NULL,
  `refreshHash` varchar(86) NOT NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` datetime(3) NOT NULL,
  `replacedBy` char(36) DEFAULT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `lastUsedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`jti`),
  KEY `userId` (`userId`),
  KEY `expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `teams` (
  `id` varchar(21) NOT NULL,
  `name` varchar(300) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(21) NOT NULL,
  `email` varchar(255) NOT NULL,
  `emailLc` varchar(255) GENERATED ALWAYS AS (lower(`email`)) STORED,
  `passwordHash` varchar(255) DEFAULT NULL,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `fullName` varchar(511) GENERATED ALWAYS AS (trim(concat_ws(' ',nullif(trim(`firstName`),''),nullif(trim(`lastName`),'')))) STORED,
  `emailConfirmed` tinyint(1) NOT NULL DEFAULT '0',
  `profilePictureUrl` varchar(1000) DEFAULT NULL,
  `preferredLanguage` varchar(6) NOT NULL DEFAULT 'en',
  `forcePasswordChange` tinyint(1) NOT NULL DEFAULT '0',
  `emojiClickedCount` int NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `superAdmin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_emailLc` (`emailLc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cal_subscriptions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `token` varchar(16) NOT NULL,
  `userId` varchar(21) NOT NULL,
  `teamId` varchar(21) NOT NULL,
  `role` enum('owner','admin','coach','athlete','guardian') NOT NULL,
  `guardianOfId` varchar(21) DEFAULT NULL,
  KEY `userId` (`userId`),
  KEY `teamId` (`teamId`),
  KEY `guardianOfId` (`guardianOfId`),
  CONSTRAINT `cal_subscriptions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cal_subscriptions_ibfk_2` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cal_subscriptions_ibfk_3` FOREIGN KEY (`guardianOfId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(400) NOT NULL,
  `teamId` varchar(21) NOT NULL,
  `formattedAddress` varchar(500) NOT NULL,
  `addressLine1` varchar(255) DEFAULT NULL,
  `addressLine2` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(20) DEFAULT NULL,
  `country` char(2) DEFAULT NULL,
  `lat` decimal(9,6) DEFAULT NULL,
  `lon` decimal(9,6) DEFAULT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `providerPlaceId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_locations_team` (`teamId`),
  CONSTRAINT `fk_locations_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `userId` varchar(21) NOT NULL,
  `tokenHash` char(64) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `usedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token_hash` (`tokenHash`),
  KEY `userId` (`userId`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_part_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titleObject` json NOT NULL,
  `scope` enum('global','club','team','user') NOT NULL,
  `userId` varchar(21) DEFAULT NULL,
  `teamId` varchar(21) DEFAULT NULL,
  `color` varchar(10) NOT NULL,
  `createdById` varchar(21) DEFAULT NULL,
  `archived` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `position` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_team` (`teamId`),
  KEY `fk_user` (`userId`),
  KEY `fk_created_by` (`createdById`),
  CONSTRAINT `fk_created_by` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `team_user_roles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` varchar(21) NOT NULL,
  `teamId` varchar(21) NOT NULL,
  `role` enum('owner','admin','coach','athlete','guardian') NOT NULL,
  `guardianOf` varchar(21) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_tur_user` (`userId`),
  KEY `fk_tur_team` (`teamId`),
  KEY `fk_tur_guardian` (`guardianOf`),
  CONSTRAINT `fk_tur_guardian` FOREIGN KEY (`guardianOf`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tur_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tur_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `team_users` (
  `userId` varchar(21) NOT NULL,
  `teamId` varchar(21) NOT NULL,
  `status` enum('active','invited') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tokenHash` varchar(255) DEFAULT NULL,
  `validUntil` timestamp NULL DEFAULT NULL,
  `invitedBy` varchar(21) DEFAULT NULL,
  PRIMARY KEY (`userId`,`teamId`),
  UNIQUE KEY `uq_invites_active` (`teamId`,`userId`),
  UNIQUE KEY `uq_invites_tokenHash` (`tokenHash`),
  CONSTRAINT `fk_teamUsers_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teamUsers_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_valid_until_future` CHECK ((`validUntil` > `createdAt`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CHECK
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` varchar(21) DEFAULT NULL,
  `copyOfPlanId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `title` varchar(100) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `scope` enum('global','club','team','user') DEFAULT NULL,
  `showInLibrary` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdById` varchar(21) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `copyOfPlanId` (`copyOfPlanId`),
  KEY `createdById` (`createdById`),
  CONSTRAINT `plans_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plans_ibfk_2` FOREIGN KEY (`copyOfPlanId`) REFERENCES `plans` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plans_ibfk_3` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(400) NOT NULL,
  `teamId` varchar(21) NOT NULL,
  `type` enum('practise','match','meeting','self_training','other_event', 'mental') NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `createdById` varchar(21) DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `ownNotes` varchar(1000) DEFAULT NULL,
  `coachesNotes` varchar(1000) DEFAULT NULL,
  `eventDate` date NOT NULL,
  `startTimeUnixSec` int DEFAULT NULL,
  `endTimeUnixSec` int DEFAULT NULL,
  `durationInMinutes` int DEFAULT NULL,
  `repeats` enum('daily','weekly','monthly') DEFAULT NULL,
  `repeatsOn` varchar(7) DEFAULT NULL,
  `repeatsUntilUnixSec` int DEFAULT NULL,
  `planId` int DEFAULT NULL,
  `locationId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `forAllAthletes` tinyint(1) NOT NULL DEFAULT '1',
  `timezone` varchar(50) NOT NULL DEFAULT 'Europe/Helsinki',
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `locationId` (`locationId`),
  KEY `createdById` (`createdById`),
  KEY `planId` (`planId`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_3` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_4` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_parts` (
  `id` varchar(21) NOT NULL,
  `teamId` varchar(21) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `durationInMinutes` int NOT NULL,
  `typeId` int NOT NULL,
  `createdById` varchar(21) DEFAULT NULL,
  `position` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `scope` enum('global','club','team','user') NOT NULL DEFAULT 'team',
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `showInLibrary` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  KEY `typeId` (`typeId`),
  KEY `createdById` (`createdById`),
  KEY `teamId` (`teamId`),
  CONSTRAINT `plan_parts_ibfk_1` FOREIGN KEY (`typeId`) REFERENCES `plan_part_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_parts_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plan_parts_ibfk_3` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_plan_parts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `planId` INT NOT NULL,
  `planPartId` VARCHAR(21) NOT NULL,
  `position`INT NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `plan_part_parts_ibfk_1` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_part_parts_ibfk_2` FOREIGN KEY (`planPartId`) REFERENCES `plan_parts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_part_items` (
  `id` varchar(21) NOT NULL,
  `partId` varchar(21) DEFAULT NULL,
  `position` int DEFAULT NULL,
  `type` enum('audio','video','text','image','file','rest') NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `partId` (`partId`),
  CONSTRAINT `plan_part_items_ibfk_1` FOREIGN KEY (`partId`) REFERENCES `plan_parts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plan_part_item_texts` (
  `planPartItemId` varchar(21) NOT NULL,
  `text` text,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`planPartItemId`),
  CONSTRAINT `plan_part_item_texts_ibfk_1` FOREIGN KEY (`planPartItemId`) REFERENCES `plan_part_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;