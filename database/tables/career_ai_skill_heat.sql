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
-- Table structure for table `skill_heat`
--

DROP TABLE IF EXISTS `skill_heat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill_heat` (
  `skill_id` int NOT NULL,
  `skill_name` varchar(100) DEFAULT NULL,
  `job_count` int DEFAULT NULL,
  PRIMARY KEY (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skill_heat`
--

LOCK TABLES `skill_heat` WRITE;
/*!40000 ALTER TABLE `skill_heat` DISABLE KEYS */;
INSERT INTO `skill_heat` VALUES (1,'Java',4300),(2,'Python',3175),(3,'C++',3170),(4,'MySQL',1235),(5,'SpringBoot',250),(6,'Linux',1670),(7,'Docker',170),(8,'Git',385),(9,'沟通能力',8485),(10,'抗压能力',3155),(11,'学习能力',5725),(12,'团队合作',4002),(13,'硕士',1945),(14,'本科',12350),(15,'大专',6370),(16,'设计',5226),(17,'开发',6576),(18,'测试',5628),(19,'部署',762),(20,'维护',7044),(21,'架构',801),(22,'项目管理',768),(23,'数据分析',1029),(24,'系统集成',180),(25,'培训',5838),(26,'实施',2256),(27,'C#',430),(28,'Go',1455),(29,'JavaScript',1265),(30,'SQL',1745),(31,'HTML',972),(32,'CSS',705),(33,'Vue',820),(34,'Vue3',120),(35,'React',570),(36,'Angular',245),(37,'ElementUI',45),(38,'Spring',1145),(39,'MyBatis',360),(40,'Node',120),(41,'Hibernate',65),(42,'Oracle',760),(43,'SQL Server',140),(44,'Redis',430),(45,'MongoDB',95),(46,'Kubernetes',105),(47,'Shell',350),(48,'Nginx',95),(49,'Kafka',87),(50,'微服务',222),(51,'分布式',318),(52,'自动化测试',1030),(53,'性能测试',535),(54,'接口测试',65),(55,'功能测试',1295),(56,'机器学习',138),(57,'人工智能',345),(58,'深度学习',141),(59,'大数据',444),(60,'Hadoop',54),(61,'Spark',45),(62,'需求分析',1083),(63,'系统设计',363),(64,'代码优化',24),(65,'性能优化',225),(66,'故障排查',90),(67,'技术支持',2277),(68,'文档编写',360),(69,'版本管理',33),(70,'团队协作',4225),(71,'责任心',6955),(72,'执行力',1875),(73,'表达能力',2403),(74,'逻辑思维',1820),(75,'自我驱动',270),(76,'博士',1335),(81,'高中及以上',54),(82,'中专',262),(95,'HTML/CSS',24),(97,'Node.js',38),(108,'达梦数据库',2),(116,'Jenkins',8),(121,'国产化适配',2),(122,'嵌入式开发',44),(126,'英语口语流利',32),(127,'日语N2',46),(128,'日语N3',4),(131,'计算机二级证书',2),(132,'PMP认证',4),(140,'电工证',142),(146,'3年以上工作经验',14),(147,'1-3年工作经验',4),(148,'5年以上工作经验',4),(149,'应届毕业生',854),(150,'无经验可培养',10),(151,'有项目经验',10),(152,'大型项目经验',4),(166,'细心严谨',8),(167,'创新能力',180),(168,'解决问题能力',174),(169,'客户服务意识',348),(170,'文档撰写能力',30),(171,'时间管理能力',88),(172,'抗压能力强',396),(173,'适应出差',230),(174,'能接受加班',22),(175,'具备保密意识',6),(176,'服从安排',54),(177,'积极主动',918),(178,'有耐心',220),(179,'有责任心',716),(180,'团队合作精神',1820);
/*!40000 ALTER TABLE `skill_heat` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-17 17:17:20
