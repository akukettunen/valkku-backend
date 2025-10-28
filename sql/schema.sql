-- valkku.sessions definition

CREATE TABLE IF NOT EXISTS `sessions` (
  `jti` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refreshHash` varchar(86) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` datetime(3) NOT NULL,
  `replacedBy` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastUsedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`jti`),
  KEY `userId` (`userId`),
  KEY `expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.teams definition

CREATE TABLE IF NOT EXISTS `teams` (
  `id` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.users definition

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emailLc` varchar(255) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (lower(`email`)) STORED,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullName` varchar(511) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (trim(concat_ws(_utf8mb4' ',nullif(trim(`firstName`),_utf8mb4''),nullif(trim(`lastName`),_utf8mb4'')))) STORED,
  `emailConfirmed` tinyint(1) NOT NULL DEFAULT '0',
  `profilePictureUrl` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredLanguage` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `forcePasswordChange` tinyint(1) NOT NULL DEFAULT '0',
  `emojiClickedCount` int NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `superAdmin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_emailLc` (`emailLc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.cal_subscriptions definition

CREATE TABLE IF NOT EXISTS `cal_subscriptions` (
  `token` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('owner','admin','coach','athlete','guardian') COLLATE utf8mb4_unicode_ci NOT NULL,
  `guardianOfId` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  KEY `userId` (`userId`),
  KEY `teamId` (`teamId`),
  KEY `guardianOfId` (`guardianOfId`),
  CONSTRAINT `cal_subscriptions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cal_subscriptions_ibfk_2` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cal_subscriptions_ibfk_3` FOREIGN KEY (`guardianOfId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.locations definition

CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(400) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `formattedAddress` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addressLine1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `addressLine2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` decimal(9,6) DEFAULT NULL,
  `lon` decimal(9,6) DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `providerPlaceId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_locations_team` (`teamId`),
  CONSTRAINT `fk_locations_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.password_resets definition

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.plan_part_types definition

CREATE TABLE IF NOT EXISTS `plan_part_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titleObject` json NOT NULL,
  `scope` enum('global','club','team','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdById` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.team_user_roles definition

CREATE TABLE IF NOT EXISTS `team_user_roles` (
  `userId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('owner','admin','coach','athlete','guardian') COLLATE utf8mb4_unicode_ci NOT NULL,
  `guardianOf` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_tur_user` (`userId`),
  KEY `fk_tur_team` (`teamId`),
  KEY `fk_tur_guardian` (`guardianOf`),
  CONSTRAINT `fk_tur_guardian` FOREIGN KEY (`guardianOf`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tur_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tur_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.team_users definition

CREATE TABLE IF NOT EXISTS `team_users` (
  `userId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','invited') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tokenHash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validUntil` timestamp NULL DEFAULT NULL,
  `invitedBy` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`userId`,`teamId`),
  UNIQUE KEY `uq_invites_active` (`teamId`,`userId`),
  UNIQUE KEY `uq_invites_tokenHash` (`tokenHash`),
  CONSTRAINT `fk_teamUsers_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teamUsers_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_valid_until_future` CHECK ((`validUntil` > `createdAt`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.events definition

CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(400) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('practise','match','meeting','self_training','other_event') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `createdById` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ownNotes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coachesNotes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eventDate` date NOT NULL,
  `startTimeUnixSec` int DEFAULT NULL,
  `endTimeUnixSec` int DEFAULT NULL,
  `durationInMinutes` int DEFAULT NULL,
  `repeats` enum('daily','weekly','monthly') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repeatsOn` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repeatsUntilUnixSec` int DEFAULT NULL,
  `locationId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `forAllAthletes` tinyint(1) NOT NULL DEFAULT '1',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Europe/Helsinki',
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `locationId` (`locationId`),
  KEY `createdById` (`createdById`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_ibfk_3` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.plans definition

CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int DEFAULT NULL,
  `teamId` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `copyOfPlanId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope` enum('global','club','team','user') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `eventId` (`eventId`),
  KEY `copyOfPlanId` (`copyOfPlanId`),
  CONSTRAINT `plans_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plans_ibfk_2` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plans_ibfk_3` FOREIGN KEY (`copyOfPlanId`) REFERENCES `plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.event_exceptions definition

CREATE TABLE IF NOT EXISTS `event_exceptions` (
  `eventId` int NOT NULL,
  `recurrenceDate` date NOT NULL,
  `replacementEventId` int DEFAULT NULL,
  `isCancelled` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `u_series_occurrence` (`eventId`,`recurrenceDate`),
  KEY `fk_exception_replacement` (`replacementEventId`),
  CONSTRAINT `fk_exception_replacement` FOREIGN KEY (`replacementEventId`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exception_series` FOREIGN KEY (`eventId`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.plan_parts definition

CREATE TABLE IF NOT EXISTS `plan_parts` (
  `id` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planId` int NOT NULL,
  `durationInMinutes` int NOT NULL,
  `typeId` int NOT NULL,
  `position` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `typeId` (`typeId`),
  KEY `planId` (`planId`),
  CONSTRAINT `plan_parts_ibfk_1` FOREIGN KEY (`typeId`) REFERENCES `plan_part_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_parts_ibfk_2` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.plan_part_items definition

CREATE TABLE IF NOT EXISTS `plan_part_items` (
  `id` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partId` varchar(21) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planId` int DEFAULT NULL,
  `position` int DEFAULT NULL,
  `type` enum('audio','video','text','image','file','rest') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `partId` (`partId`),
  KEY `planId` (`planId`),
  CONSTRAINT `plan_part_items_ibfk_1` FOREIGN KEY (`partId`) REFERENCES `plan_parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `plan_part_items_ibfk_2` FOREIGN KEY (`planId`) REFERENCES `plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- valkku.plan_part_item_texts definition

CREATE TABLE IF NOT EXISTS `plan_part_item_texts` (
  `planPartItemId` varchar(21) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`planPartItemId`),
  CONSTRAINT `plan_part_item_texts_ibfk_1` FOREIGN KEY (`planPartItemId`) REFERENCES `plan_part_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;