-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: beerenberg_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `entity_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `performed_by` int DEFAULT NULL,
  `action_type` enum('INSERT','UPDATE','DELETE','SUPERVISOR_OVERRIDE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `override_reason` text COLLATE utf8mb4_unicode_ci,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `fk_audit_performer` (`performed_by`),
  KEY `idx_audit_entity` (`entity_name`,`entity_id`),
  KEY `idx_audit_timestamp` (`timestamp`),
  CONSTRAINT `fk_audit_performer` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clock_events`
--

DROP TABLE IF EXISTS `clock_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clock_events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `kiosk_id` int DEFAULT NULL,
  `event_type` enum('CLOCK_IN','CLOCK_OUT','BREAK_START','BREAK_END') COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verification_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PIN',
  `break_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_reference_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_manual_entry` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`event_id`),
  KEY `fk_clock_kiosk` (`kiosk_id`),
  KEY `idx_clock_user_timestamp` (`user_id`,`event_timestamp`),
  CONSTRAINT `fk_clock_kiosk` FOREIGN KEY (`kiosk_id`) REFERENCES `kiosks` (`kiosk_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_clock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clock_events`
--

LOCK TABLES `clock_events` WRITE;
/*!40000 ALTER TABLE `clock_events` DISABLE KEYS */;
INSERT INTO `clock_events` VALUES (1,1,1,'BREAK_START','2026-08-14 15:56:08','PIN',NULL,NULL,0),(2,3,1,'CLOCK_IN','2026-08-21 11:26:45','PIN',NULL,NULL,0),(3,3,1,'CLOCK_OUT','2026-08-21 11:26:53','PIN',NULL,NULL,0),(4,3,1,'BREAK_START','2026-08-21 11:58:53','PIN','Meal / Lunch Break',NULL,0),(5,3,1,'BREAK_END','2026-08-21 12:03:11','PIN',NULL,NULL,0),(6,3,1,'CLOCK_IN','2026-08-21 12:05:59','PIN',NULL,NULL,0),(7,3,1,'BREAK_START','2026-08-21 12:06:19','PIN','Rest / Tea Break',NULL,0),(8,3,1,'BREAK_END','2026-08-21 12:06:27','PIN',NULL,NULL,0),(9,3,1,'CLOCK_OUT','2026-08-21 12:06:36','PIN',NULL,NULL,0),(10,3,1,'CLOCK_IN','2026-08-21 08:04:42','PIN',NULL,NULL,0),(11,4,1,'CLOCK_IN','2026-08-21 08:11:51','PIN',NULL,NULL,0),(12,3,1,'CLOCK_OUT','2026-08-21 13:12:21','PIN',NULL,NULL,0),(13,4,1,'BREAK_START','2026-08-21 13:13:28','PIN','Meal / Lunch Break',NULL,0),(14,4,1,'BREAK_END','2026-08-21 13:13:45','PIN',NULL,NULL,0),(15,4,1,'CLOCK_OUT','2026-08-21 13:13:53','PIN',NULL,NULL,0),(16,4,1,'CLOCK_IN','2026-08-20 08:00:00','SUPERVISOR_OVERRIDE','[Manual Override: Forgot to Clock In]',NULL,1),(17,8,1,'CLOCK_IN','2026-08-20 07:30:00','SUPERVISOR_OVERRIDE','[Manual Override: Kiosk offline at start of shift]',NULL,1),(18,8,1,'BREAK_START','2026-08-20 12:00:00','PIN','Meal / Lunch Break',NULL,0),(19,8,1,'BREAK_END','2026-08-20 12:30:00','PIN','Meal / Lunch Break',NULL,0),(20,8,1,'CLOCK_OUT','2026-08-20 17:00:00','PIN',NULL,NULL,0),(21,3,1,'BREAK_END','2026-09-09 21:32:30','PIN',NULL,NULL,0),(22,3,1,'BREAK_END','2026-09-09 21:32:59','PIN',NULL,NULL,0),(23,3,1,'CLOCK_OUT','2026-09-09 21:33:07','PIN',NULL,NULL,0),(24,3,1,'CLOCK_IN','2026-09-09 21:36:42','PIN',NULL,NULL,0),(25,3,1,'CLOCK_OUT','2026-09-09 21:36:59','PIN',NULL,NULL,0),(26,2,1,'CLOCK_IN','2026-09-09 22:29:24','PIN',NULL,NULL,0),(27,2,1,'CLOCK_OUT','2026-09-09 22:29:32','PIN',NULL,NULL,0),(28,4,1,'CLOCK_IN','2026-09-09 22:29:40','PIN',NULL,NULL,0),(29,4,1,'CLOCK_OUT','2026-09-09 22:29:47','PIN',NULL,NULL,0);
/*!40000 ALTER TABLE `clock_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `contract_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `contract_type` enum('Full-Time','Part-Time','Casual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `weekly_max_hours` decimal(5,2) NOT NULL DEFAULT '38.00',
  `hourly_rate` decimal(10,4) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`contract_id`),
  KEY `idx_contracts_user_date` (`user_id`,`start_date`,`end_date`),
  CONSTRAINT `fk_contracts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_contract_dates` CHECK (((`end_date` is null) or (`end_date` >= `start_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,2,'Full-Time',38.00,30.0000,'2026-08-14',NULL),(2,3,'Full-Time',38.00,30.0000,'2026-08-21',NULL),(3,4,'Full-Time',38.00,28.5000,'2026-08-21',NULL),(4,5,'Full-Time',38.00,28.5000,'2026-08-21',NULL),(5,6,'Full-Time',38.00,28.5000,'2026-08-21',NULL),(6,7,'Full-Time',38.00,28.5000,'2026-08-21',NULL),(7,8,'Full-Time',38.00,28.5000,'2026-08-21',NULL);
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Factory Operations','2026-08-14 15:48:06'),(2,'Office & HR','2026-08-14 15:48:06'),(3,'Logistics & Warehouse','2026-08-14 15:48:06');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kiosks`
--

DROP TABLE IF EXISTS `kiosks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kiosks` (
  `kiosk_id` int NOT NULL AUTO_INCREMENT,
  `kiosk_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`kiosk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kiosks`
--

LOCK TABLES `kiosks` WRITE;
/*!40000 ALTER TABLE `kiosks` DISABLE KEYS */;
INSERT INTO `kiosks` VALUES (1,'Hahndorf Factory Entrance Kiosk #01','Hahndorf Factory','hash_mock_key_1',1),(2,'Packaging Line Station #02','Packaging Hall','hash_mock_key_2',1),(3,'Farm Operations Kiosk #03','Farm Entrance','hash_mock_key_3',1);
/*!40000 ALTER TABLE `kiosks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Office Admin'),(2,'Roster Admin'),(4,'Staff'),(3,'Supervisor');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roster_shifts`
--

DROP TABLE IF EXISTS `roster_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roster_shifts` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `shift_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_duration_mins` int DEFAULT '30',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`shift_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `roster_shifts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roster_shifts`
--

LOCK TABLES `roster_shifts` WRITE;
/*!40000 ALTER TABLE `roster_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `roster_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temp_pins`
--

DROP TABLE IF EXISTS `temp_pins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp_pins` (
  `temp_pin_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pin` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`temp_pin_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `temp_pins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temp_pins`
--

LOCK TABLES `temp_pins` WRITE;
/*!40000 ALTER TABLE `temp_pins` DISABLE KEYS */;
INSERT INTO `temp_pins` VALUES (1,1,'3223','2026-08-17 15:49:24','2026-08-14 06:19:23');
/*!40000 ALTER TABLE `temp_pins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `dept_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `employee_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pin_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '1234',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_dept` (`dept_id`),
  KEY `idx_users_role` (`role_id`),
  CONSTRAINT `fk_users_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,2,1,'ADM001','Office','Admin','admin@beerenberg.com.au','$2b$10$/Q1Y7c7/xqHbJSTd.2.eMOeg0/CVe2r5y.hMHNTxou4kNgeFOwG6K','1234',1,'2026-08-14 15:48:06','1234'),(2,2,4,'EMP002','Sarah ','Connor',NULL,NULL,'2222',1,'2026-08-14 15:51:32','2222'),(3,2,3,'EMP003','Daniel','Ngamelubun','ngam0004@flinders.edu.au',NULL,'3333',1,'2026-08-21 10:45:11','3333'),(4,2,1,'EMP004','Sanjay','Perumal',NULL,NULL,'4444',1,'2026-08-21 10:46:11','4444'),(5,2,2,'EMP005','Hasitha','.',NULL,NULL,'5555',1,'2026-08-21 10:47:28','5555'),(6,2,4,'EMP006','jaya','putra',NULL,NULL,'6666',1,'2026-08-21 10:48:16','6666'),(7,1,4,'EMP007','ab','cd',NULL,NULL,'$2b$10$ITZ6nGSbyC9RcevkvIEONeU0cYPV.lmCAN3Ev7f7Lfe18mu1/2iCS',1,'2026-08-21 11:02:44','9876'),(8,3,3,'EMP008','Adam','Asif',NULL,NULL,'$2b$10$O2r.n9tza2xvk58Ipn8gkuy6jz7FqJ3ogBXUqsuMO5KPEJtJRYfMW',1,'2026-08-21 14:58:22','4321');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-09 23:03:04
