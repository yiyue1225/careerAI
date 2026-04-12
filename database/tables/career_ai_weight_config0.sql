-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: career_ai
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `weight_config`
--

DROP TABLE IF EXISTS `weight_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weight_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL COMMENT '对应 job_standard_profile 中的 category',
  `w_basic` decimal(3,2) NOT NULL DEFAULT '0.20' COMMENT '基础要求权重',
  `w_skill` decimal(3,2) NOT NULL DEFAULT '0.50' COMMENT '专业技能权重',
  `w_quality` decimal(3,2) NOT NULL DEFAULT '0.30' COMMENT '职业素质权重',
  `min_buffer` int DEFAULT '3' COMMENT '0值补偿常数',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name_UNIQUE` (`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weight_config`
--

LOCK TABLES `weight_config` WRITE;
/*!40000 ALTER TABLE `weight_config` DISABLE KEYS */;
INSERT INTO `weight_config` VALUES (1,'后端开发',0.15,0.70,0.15,3,'2026-03-19 09:20:00'),(2,'前端开发',0.15,0.65,0.20,3,'2026-03-19 09:20:00'),(3,'测试/运维',0.20,0.50,0.30,4,'2026-03-19 09:20:00'),(4,'人工智能/数据分析',0.30,0.60,0.10,2,'2026-03-19 09:20:00'),(5,'项目管理/技术支持',0.10,0.30,0.60,5,'2026-03-19 09:20:00'),(6,'其他',0.20,0.50,0.30,3,'2026-03-19 09:20:00');
/*!40000 ALTER TABLE `weight_config` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-12 17:23:10
