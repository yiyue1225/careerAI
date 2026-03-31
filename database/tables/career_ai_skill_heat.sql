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
INSERT INTO `skill_heat` VALUES (1,'Java',859),(2,'Python',631),(3,'C++',634),(4,'MySQL',246),(5,'SpringBoot',50),(6,'Linux',333),(7,'Docker',34),(8,'Git',75),(9,'沟通能力',700),(10,'抗压能力',224),(11,'学习能力',582),(12,'团队合作',688),(13,'硕士',274),(14,'本科',1336),(15,'大专',350),(16,'设计',1522),(17,'开发',1657),(18,'测试',1789),(19,'部署',253),(20,'维护',1051),(21,'架构',227),(22,'项目管理',198),(23,'数据分析',137),(24,'系统集成',43),(25,'培训',665),(26,'实施',515),(27,'C#',86),(28,'Go',278),(29,'JavaScript',253),(30,'SQL',334),(31,'HTML',324),(32,'CSS',235),(33,'Vue',163),(34,'Vue3',24),(35,'React',114),(36,'Angular',49),(37,'ElementUI',9),(38,'Spring',229),(39,'MyBatis',72),(40,'Node',40),(41,'Hibernate',13),(42,'Oracle',150),(43,'SQL Server',28),(44,'Redis',86),(45,'MongoDB',19),(46,'Kubernetes',20),(47,'Shell',70),(48,'Nginx',19),(49,'Kafka',29),(50,'微服务',74),(51,'分布式',103),(52,'自动化测试',206),(53,'性能测试',106),(54,'接口测试',13),(55,'功能测试',257),(56,'机器学习',44),(57,'人工智能',107),(58,'深度学习',43),(59,'大数据',130),(60,'Hadoop',18),(61,'Spark',15),(62,'需求分析',342),(63,'系统设计',121),(64,'代码优化',8),(65,'性能优化',75),(66,'故障排查',28),(67,'技术支持',714),(68,'文档编写',116),(69,'版本管理',10),(70,'团队协作',520),(71,'责任心',602),(72,'执行力',79),(73,'表达能力',316),(74,'逻辑思维',174),(75,'自我驱动',23),(76,'博士',254),(77,'本科',1336),(78,'硕士',274),(79,'大专',350),(80,'博士',254),(81,'高中及以上',2),(82,'中专',19),(85,'Java',859),(86,'Python',631),(87,'SQL',334),(88,'C++',634),(89,'SpringBoot',50),(90,'Vue',163),(91,'MySQL',246),(92,'Go',278),(93,'C#',86),(94,'JavaScript',253),(95,'HTML/CSS',12),(96,'React',114),(97,'Node.js',19),(98,'Angular',49),(99,'Vue3',24),(100,'ElementUI',9),(101,'Spring',229),(102,'MyBatis',72),(103,'Hibernate',13),(104,'Oracle',150),(105,'Redis',86),(106,'MongoDB',19),(107,'SQL Server',28),(108,'达梦数据库',1),(110,'Linux',333),(111,'Docker',34),(112,'Kubernetes',20),(113,'Nginx',19),(114,'Shell',70),(115,'Git',75),(116,'Jenkins',4),(117,'功能测试',257),(118,'自动化测试',206),(119,'性能测试',106),(120,'接口测试',13),(121,'国产化适配',1),(122,'嵌入式开发',22),(126,'英语口语流利',1),(127,'日语N2',5),(128,'日语N3',1),(131,'计算机二级证书',1),(132,'PMP认证',2),(140,'电工证',11),(146,'3年以上工作经验',6),(148,'5年以上工作经验',2),(149,'应届毕业生',153),(150,'无经验可培养',5),(151,'有项目经验',5),(158,'沟通能力',700),(159,'学习能力',582),(160,'责任心',602),(161,'团队协作',520),(162,'抗压能力',224),(163,'逻辑思维',174),(164,'执行力',79),(165,'自我驱动',23),(166,'细心严谨',1),(167,'创新能力',45),(168,'解决问题能力',71),(169,'客户服务意识',66),(170,'文档撰写能力',12),(171,'时间管理能力',5),(172,'抗压能力强',63),(173,'适应出差',79),(174,'能接受加班',4),(175,'具备保密意识',1),(176,'服从安排',10),(177,'积极主动',219),(178,'有耐心',31),(179,'有责任心',99),(180,'团队合作精神',505);
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

-- Dump completed on 2026-03-31 18:34:18
