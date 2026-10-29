-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 18, 2025 at 04:08 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `doratahillkhaoyai`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(120) NOT NULL,
  `role` enum('owner','editor') DEFAULT 'editor',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `email`, `password_hash`, `name`, `role`, `is_active`, `created_at`) VALUES
(1, 'admin@doratahillkhaoyai.com', '$2b$10$.kzLu.aRUag3tLl565KmGO9O/Uqum4iW19XbMdtFe05ZYT4vCIEvW', 'Admin', 'owner', 1, '2025-10-28 07:20:43');

-- --------------------------------------------------------

--
-- Table structure for table `attractions`
--

CREATE TABLE `attractions` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `map_link` varchar(512) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title_th` varchar(255) DEFAULT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `description_th` text DEFAULT NULL,
  `description_en` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attractions`
--

INSERT INTO `attractions` (`id`, `title`, `description`, `map_link`, `created_at`, `title_th`, `title_en`, `description_th`, `description_en`) VALUES
(1, 'มาเที่ยวกันเยอะๆ', 'ที่นี่เลย Dorata Hill Khao Yai', NULL, '2025-10-28 16:09:17', 'มาเที่ยวกันเยอะๆคะ', 'Yes', 'ที่นี่เลยค่ะ Dorata Hill Khao Yai', 'Oh yahh');

-- --------------------------------------------------------

--
-- Table structure for table `attraction_images`
--

CREATE TABLE `attraction_images` (
  `id` int(11) NOT NULL,
  `attraction_id` int(11) NOT NULL,
  `file_path` varchar(512) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attraction_images`
--

INSERT INTO `attraction_images` (`id`, `attraction_id`, `file_path`, `sort_order`, `created_at`) VALUES
(1, 1, '/uploads/attractions/1/IMG_5995-1761667758907-oel6xx.webp', 0, '2025-10-28 16:09:33'),
(2, 1, '/uploads/attractions/1/IMG_6010-1761667760654-d69hnz.webp', 1, '2025-10-28 16:09:33'),
(3, 1, '/uploads/attractions/1/IMG_6008-1761667762399-fael2c.webp', 2, '2025-10-28 16:09:33'),
(5, 1, '/uploads/attractions/1/496000276_669563149373715_8493272132046718637_n-1762878715033-l83pd2.webp', 0, '2025-11-11 16:31:55');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `status` enum('reserved','staying','completed','cancelled') NOT NULL DEFAULT 'reserved',
  `room_id` bigint(20) DEFAULT NULL,
  `people` int(11) DEFAULT NULL,
  `pet_type` varchar(100) DEFAULT NULL,
  `pet_count` int(11) DEFAULT NULL,
  `pets_note` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `full_name`, `phone`, `check_in`, `check_out`, `status`, `room_id`, `people`, `pet_type`, `pet_count`, `pets_note`, `note`, `created_at`, `updated_at`) VALUES
(1, 'ทดสอบแจ้งเตือนข้อความการจอง', '0987654321', '2025-11-01', '2025-11-03', 'reserved', NULL, NULL, NULL, NULL, NULL, '', '2025-10-29 23:41:41', '2025-10-29 23:41:41'),
(2, 'ทดสอบแจ้งเตือนข้อความการจอง', '0987654321', '2025-11-14', '2025-11-16', 'reserved', NULL, NULL, NULL, NULL, NULL, '', '2025-10-30 01:02:25', '2025-10-30 01:02:25'),
(4, 'วีรกุล', '0896756343', '2025-12-31', '2026-01-02', 'reserved', 1, NULL, NULL, 0, NULL, NULL, '2025-11-02 09:21:06', '2025-11-02 09:21:06'),
(5, 'สมอาจ', '0987654321', '2025-11-19', '2025-11-21', 'reserved', 2, 2, 'แมว', 1, NULL, NULL, '2025-11-02 09:25:08', '2025-11-02 09:29:46'),
(6, 'ปฏิฎาณ', '0987654322', '2025-11-27', '2025-11-28', 'reserved', 2, 4, 'หมา', 2, NULL, NULL, '2025-11-02 09:27:50', '2025-11-02 09:29:42'),
(7, 'ภูมิ', '092223444', '2025-11-24', '2025-11-25', 'reserved', 1, 2, NULL, 0, NULL, NULL, '2025-11-02 09:43:22', '2025-11-02 09:43:22'),
(8, 'เอ๋', '0874993244', '2025-11-10', '2025-11-11', 'reserved', 2, 4, NULL, 0, NULL, NULL, '2025-11-02 10:39:15', '2025-11-11 17:37:31');

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `id` int(11) NOT NULL,
  `category` enum('hall','kitchen','activity','ambience') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title_th` varchar(255) DEFAULT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `description_th` text DEFAULT NULL,
  `description_en` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`id`, `category`, `title`, `description`, `created_at`, `title_th`, `title_en`, `description_th`, `description_en`) VALUES
(1, 'hall', 'ห้องโถงใหญ่', 'ห้องโถงใหญ่ เหมาะทำกิจกรรม', '2025-10-26 22:41:33', 'ห้องโถงใหญ่', NULL, 'ห้องโถงใหญ่ เหมาะทำกิจกรรม', NULL),
(2, 'activity', 'ปิ้งย่าง เล่นน้ำ ปาร์ตี้ กิจกรรมสังสรรค์', 'กิจกรรมสังสรรค์', '2025-10-27 04:03:28', 'ปิ้งย่าง เล่นน้ำ ปาร์ตี้ กิจกรรมสังสรรค์', NULL, 'กิจกรรมสังสรรค์', NULL),
(3, 'activity', 'คาราโอเกะ โต๊ะพลู', 'คาราโอเกะ โต๊ะพลู', '2025-11-05 04:59:09', 'คาราโอเกะ โต๊ะพลู', NULL, 'คาราโอเกะ โต๊ะพลู', NULL),
(4, 'ambience', 'บทความ', 'เรื่องราวดีๆ จากโดราต้าฮิลล์', '2025-11-05 05:10:08', 'บทความ', NULL, 'เรื่องราวดีๆ จากโดราต้าฮิลล์', NULL),
(5, 'kitchen', 'สิ่งอำนวยความสะดวก', 'ที่จอดรถ เต้น เตาปิ้งย่าง', '2025-11-10 11:18:53', 'สิ่งอำนวยความสะดวก', 'BBQ', 'ที่จอดรถ เต้น เตาปิ้งย่าง', 'BBQ Eng'),
(6, 'activity', 'activity', '', '2025-11-14 09:14:59', 'activity', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `facility_images`
--

CREATE TABLE `facility_images` (
  `id` int(11) NOT NULL,
  `facility_id` int(11) NOT NULL,
  `file_path` varchar(512) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facility_images`
--

INSERT INTO `facility_images` (`id`, `facility_id`, `file_path`, `sort_order`, `created_at`) VALUES
(1, 1, '/uploads/facilities/hall/1/S__1040442_0-1761518493447-3csm5e.jpg', 0, '2025-10-26 22:41:33'),
(2, 1, '/uploads/facilities/hall/1/S__1040443_0-1761518493448-zvvmw1.jpg', 1, '2025-10-26 22:41:33'),
(3, 1, '/uploads/facilities/hall/1/S__1040444_0-1761518493448-mzxyhj.jpg', 2, '2025-10-26 22:41:33'),
(4, 1, '/uploads/facilities/hall/1/S__1040445_0-1761518493449-bw6zb5.jpg', 3, '2025-10-26 22:41:33'),
(5, 1, '/uploads/facilities/hall/1/S__1040446_0-1761518493449-vmzw4f.jpg', 4, '2025-10-26 22:41:33'),
(6, 1, '/uploads/facilities/hall/1/S__1040447_0-1761518493449-nzi4ty.jpg', 5, '2025-10-26 22:41:33'),
(7, 2, '/uploads/facilities/activity/2/S__1040428_0-1761537808446-gemoia.jpg', 0, '2025-10-27 04:03:28'),
(8, 2, '/uploads/facilities/activity/2/S__1040430_0-1761537808447-o2ekpl.jpg', 1, '2025-10-27 04:03:28'),
(9, 2, '/uploads/facilities/activity/2/S__1040431_0-1761537808449-5acpu8.jpg', 2, '2025-10-27 04:03:28'),
(10, 2, '/uploads/facilities/activity/2/S__1040432_0-1761537808449-net1l4.jpg', 3, '2025-10-27 04:03:28'),
(11, 2, '/uploads/facilities/activity/2/S__1040434_0-1761537808450-5o2s1f.jpg', 4, '2025-10-27 04:03:28'),
(12, 2, '/uploads/facilities/activity/2/S__1040453_0-1761537808451-zjp7nw.jpg', 5, '2025-10-27 04:03:28'),
(13, 2, '/uploads/facilities/activity/2/S__1040455_0-1761537808451-rs2u99.jpg', 6, '2025-10-27 04:03:28'),
(14, 2, '/uploads/facilities/activity/2/S__1040454_0-1761537808454-srdffc.jpg', 7, '2025-10-27 04:03:28'),
(15, 3, '/uploads/facilities/activity/3/S__1040445_0-1761584092690-k3pb53-1762318749772-x1ceop.webp', 0, '2025-11-05 04:59:10'),
(16, 3, '/uploads/facilities/activity/3/S__1040447_0-1761584121835-ls5jvp-1762318750271-1whd3j.webp', 1, '2025-11-05 04:59:10');

-- --------------------------------------------------------

--
-- Table structure for table `home_slides`
--

CREATE TABLE `home_slides` (
  `id` int(10) UNSIGNED NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `alt_text_th` varchar(255) DEFAULT NULL,
  `alt_text_en` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `home_slides`
--

INSERT INTO `home_slides` (`id`, `file_path`, `alt_text`, `sort_order`, `is_active`, `created_at`, `updated_at`, `alt_text_th`, `alt_text_en`) VALUES
(1, '/api/uploads/slides/S__1040448_0-1761584123537-5zbk1v-1762160934796-1rw89e.webp', '', 2, 0, '2025-11-03 16:08:54', '2025-11-06 01:07:54', '', NULL),
(2, '/api/uploads/slides/S__1040451_0-1761584127557-8vi46q-1762162012355-0zlgoy.webp', 'มาผ่อนคลายกับเรานะคะ', 1, 1, '2025-11-03 16:26:52', '2025-11-06 01:07:54', 'มาผ่อนคลายกับเรานะคะ', NULL),
(3, '/api/uploads/slides/S__1040450_0-1761584125176-ujvesp-1762162015686-45ierf.webp', '“เที่ยววันธรรมดา ก็สุขได้ไม่แพ้เสาร์อาทิตย์” หนีความวุ่นวาย แล้วมาพักใจที่ Dorata Hill เขาใหญ่ 💜ไม่ต้องแย่งใครในสระ 🩵 ถ่ายรูปมุมไหนก็ได้ ไม่ติดคน 💚 ราคาสบายกระเป๋า', 3, 1, '2025-11-03 16:26:55', '2025-11-06 01:07:54', '“เที่ยววันธรรมดา ก็สุขได้ไม่แพ้เสาร์อาทิตย์” หนีความวุ่นวาย แล้วมาพักใจที่ Dorata Hill เขาใหญ่ 💜ไม่ต้องแย่งใครในสระ 🩵 ถ่ายรูปมุมไหนก็ได้ ไม่ติดคน 💚 ราคาสบายกระเป๋า', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `cover_path` varchar(1024) DEFAULT NULL,
  `link` varchar(1024) DEFAULT NULL,
  `publish_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `title_th` varchar(255) DEFAULT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `body_th` text DEFAULT NULL,
  `body_en` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `title`, `body`, `cover_path`, `link`, `publish_at`, `is_active`, `created_at`, `updated_at`, `title_th`, `title_en`, `body_th`, `body_en`) VALUES
(1, 'โปรพิเศษ! เดือนนี้', '“เที่ยววันธรรมดา ก็สุขได้ไม่แพ้เสาร์อาทิตย์”\r\nหนีความวุ่นวาย แล้วมาพักใจที่ Dorata Hill เขาใหญ่\r\n💜ไม่ต้องแย่งใครในสระ\r\n🩵 ถ่ายรูปมุมไหนก็ได้ ไม่ติดคน\r\n💚 ราคาสบายกระเป๋า แค่ 6,900 บาท / 12 คน\r\n🧡 ฟรี!! ถ่าน น้ำแข็ง น้ำดื่ม กาแฟ\r\n\r\nวันธรรมดาก็ฟินได้ ไม่ต้องรอวันหยุด\r\nใครพร้อมเท มาเลย ทักแชทจองด่วนก่อนเต็ม!', '/uploads/news/1/496000276_669563149373715_8493272132046718637_n-1761546182902-ebv579.jpg', 'https://www.facebook.com/photo?fbid=669563142707049&set=a.234020902927944', '2025-10-23 16:18:00', 1, '2025-10-27 06:19:16', '2025-11-08 11:41:44', 'โปรพิเศษ! เดือนนี้', 'Special promotion! This month', '“เที่ยววันธรรมดา ก็สุขได้ไม่แพ้เสาร์อาทิตย์”\nหนีความวุ่นวาย แล้วมาพักใจที่ Dorata Hill เขาใหญ่\n💜ไม่ต้องแย่งใครในสระ\n🩵 ถ่ายรูปมุมไหนก็ได้ ไม่ติดคน\n💚 ราคาสบายกระเป๋า แค่ 6,900 บาท / 12 คน\n🧡 ฟรี!! ถ่าน น้ำแข็ง น้ำดื่ม กาแฟ\n\nวันธรรมดาก็ฟินได้ ไม่ต้องรอวันหยุด\nใครพร้อมเท มาเลย ทักแชทจองด่วนก่อนเต็ม!', '\"Weekday fun can be just as fun as weekends.\"\nEscape the hustle and bustle and relax at Dorata Hill Khao Yai.\n💜No need to fight over a spot in the pool.\n🩵 Take photos from any angle, no people in them.\n💚 Affordable price, just 6,900 baht for 12 people.\n🧡 Free!! Charcoal, ice, drinking water, and coffee.\n\nWeekday fun is just as fun, no need to wait for the weekend.\nIf you\'re ready to drop by, chat to reserve now before it\'s full!'),
(2, NULL, NULL, '/uploads/news/2/Screenshot2568-10-07at185921-1762841660801-f9m3u6.webp', NULL, '2025-11-11 00:00:00', 1, '2025-11-11 06:14:20', '2025-11-11 06:39:07', 'โปรโมชั่นเดือนนี้ 1', 'Promotion month 1', 'รายละเอียด โปรโมชั่นเดือนนี้ 1', 'Description Promotion month 1');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(190) NOT NULL,
  `title_th` varchar(255) NOT NULL,
  `title_en` varchar(255) DEFAULT NULL,
  `excerpt_th` text DEFAULT NULL,
  `excerpt_en` text DEFAULT NULL,
  `body_th` longtext DEFAULT NULL,
  `body_en` longtext DEFAULT NULL,
  `cover_path` varchar(500) DEFAULT NULL,
  `og_image_path` varchar(500) DEFAULT NULL,
  `meta_title_th` varchar(255) DEFAULT NULL,
  `meta_title_en` varchar(255) DEFAULT NULL,
  `meta_desc_th` varchar(300) DEFAULT NULL,
  `meta_desc_en` varchar(300) DEFAULT NULL,
  `canonical_url` varchar(500) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `publish_at` datetime DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `slug`, `title_th`, `title_en`, `excerpt_th`, `excerpt_en`, `body_th`, `body_en`, `cover_path`, `og_image_path`, `meta_title_th`, `meta_title_en`, `meta_desc_th`, `meta_desc_en`, `canonical_url`, `status`, `publish_at`, `author_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ทำไมต้องพักที่เรา', 'ที่พัก บ้านบรรยากาศดี', 'Accommodation, house with good atmosphere', 'มีที่จอดรถ เข้าออกง่าย', 'There is parking, easy entry and exit.', 'มาเป็นหมู่คณะ เป็นครอบครัว หรือเป็นคู่รัก ก็รับรองได้เป็นอย่างดี', 'Whether you come as a group, family, or couple, we can accommodate you perfectly.', '/uploads/posts/1/S__1040451_0-1761584127557-8vi46q-1762612409574-03xra2.webp', NULL, NULL, NULL, NULL, NULL, NULL, 'draft', '2025-11-05 17:49:00', NULL, 1, '2025-11-05 10:51:57', '2025-11-08 14:33:29');

-- --------------------------------------------------------

--
-- Table structure for table `post_images`
--

CREATE TABLE `post_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `post_id` int(10) UNSIGNED NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_tags`
--

CREATE TABLE `post_tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `post_id` int(10) UNSIGNED NOT NULL,
  `tag` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_tags`
--

INSERT INTO `post_tags` (`id`, `post_id`, `tag`) VALUES
(3, 1, 'บรรยากาศดี'),
(4, 1, 'สวยมาก');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL DEFAULT 5,
  `content` text DEFAULT NULL,
  `visited_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `content_th` text DEFAULT NULL,
  `content_en` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `author_name`, `rating`, `content`, `visited_at`, `created_at`, `content_th`, `content_en`) VALUES
(1, 'คุณเอ', 5, 'บรรยากาศดี สะอาด ผ่อนคลายมากๆ', '2025-10-25', '2025-10-27 05:12:11', 'บรรยากาศดี สะอาด ผ่อนคลายมากๆ 🥰', 'The atmosphere is good, clean, and very relaxing.🥰');

-- --------------------------------------------------------

--
-- Table structure for table `review_images`
--

CREATE TABLE `review_images` (
  `id` int(11) NOT NULL,
  `review_id` int(11) NOT NULL,
  `file_path` varchar(1024) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `review_images`
--

INSERT INTO `review_images` (`id`, `review_id`, `file_path`, `sort_order`, `created_at`) VALUES
(5, 1, '/uploads/reviews/1/493310044_667386199591410_566035942215120286_n-1762877615562-y7bztu.webp', 0, '2025-11-11 16:13:35');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `name_th` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `description_th` text DEFAULT NULL,
  `description_en` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `description`, `created_at`, `name_th`, `name_en`, `description_th`, `description_en`) VALUES
(3, 'Room1', '', '2025-10-27 15:58:48', 'Room1', NULL, '', NULL),
(5, 'ห้อง1', 'รายละเอียดห้อง1', '2025-10-28 09:23:23', 'ห้อง1', 'Room1', 'รายละเอียดห้อง1', 'Description1'),
(6, 'ห้อง2', 'รายละเอียดห้อง2', '2025-10-28 12:35:25', 'ห้อง2', 'Room2', 'รายละเอียดห้อง2', 'Description2'),
(7, 'ทดสอบ', 'รายละเอียดตรงนี้มีเยอะแยะ', '2025-11-06 09:29:55', 'ทดสอบ', 'Test', 'รายละเอียดตรงนี้มีเยอะแยะ', 'Description so');

-- --------------------------------------------------------

--
-- Table structure for table `room_images`
--

CREATE TABLE `room_images` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `file_path` varchar(512) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_images`
--

INSERT INTO `room_images` (`id`, `room_id`, `file_path`, `sort_order`, `created_at`) VALUES
(1, 21, '/uploads/rooms/21/S__1040441_0-1761503103753-9nxmo3.jpg', 0, '2025-10-26 18:25:03'),
(2, 21, '/uploads/rooms/21/S__1040442_0-1761503103755-86wn10.jpg', 1, '2025-10-26 18:25:03'),
(3, 22, '/uploads/rooms/22/S__1040436_0-1761517768601-k6h9j7.jpg', 0, '2025-10-26 22:29:28'),
(4, 22, '/uploads/rooms/22/S__1040437_0-1761517768607-0lfhtd.jpg', 1, '2025-10-26 22:29:28'),
(8, 3, '/uploads/rooms/3/S__1040441_0-1761580731377-jc7l5s.webp', 0, '2025-10-27 15:58:53'),
(9, 3, '/uploads/rooms/3/S__1040437_0-1761580733322-e2hfwp.webp', 1, '2025-10-27 15:58:53'),
(36, 5, '/uploads/rooms/5/S__1040441_0-1761584120381-4aotli-1761643404074-hpwja7.webp', 0, '2025-10-28 09:23:25'),
(37, 5, '/uploads/rooms/5/S__1040437_0-1761584090639-viqnpf-1761643404846-c6itc6.webp', 1, '2025-10-28 09:23:25'),
(38, 5, '/uploads/rooms/5/S__1040439_0-1761584121029-8s5d2x-1761643405110-mczw13.webp', 2, '2025-10-28 09:23:25'),
(39, 5, '/uploads/rooms/5/S__1040440_0-1761584120545-ws45dt-1761643405233-1b3oln.webp', 3, '2025-10-28 09:23:25'),
(40, 6, '/uploads/rooms/6/S__1040439_0-1761584121029-8s5d2x-1761654925711-gva0g9.webp', 0, '2025-10-28 12:35:27'),
(41, 6, '/uploads/rooms/6/S__1040440_0-1761584120545-ws45dt-1761654925824-d073ej.webp', 1, '2025-10-28 12:35:27'),
(42, 6, '/uploads/rooms/6/S__1040441_0-1761584120381-4aotli-1761654926061-j8386a.webp', 2, '2025-10-28 12:35:27'),
(43, 6, '/uploads/rooms/6/S__1040447_0-1761584121835-ls5jvp-1761654926562-u5w9vy.webp', 3, '2025-10-28 12:35:27'),
(44, 6, '/uploads/rooms/6/S__1040448_0-1761584123537-5zbk1v-1761654927069-6d091b.webp', 4, '2025-10-28 12:35:27'),
(45, 6, '/uploads/rooms/6/S__1040450_0-1761584125176-ujvesp-1761654927481-x3fgyj.webp', 5, '2025-10-28 12:35:27');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `skey` varchar(64) NOT NULL,
  `svalue` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `attractions`
--
ALTER TABLE `attractions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attraction_images`
--
ALTER TABLE `attraction_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attraction_id` (`attraction_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_period` (`check_in`,`check_out`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `facility_images`
--
ALTER TABLE `facility_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `home_slides`
--
ALTER TABLE `home_slides`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `is_active` (`is_active`),
  ADD KEY `publish_at` (`publish_at`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_status_pub` (`status`,`publish_at`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `post_images`
--
ALTER TABLE `post_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_post` (`post_id`);

--
-- Indexes for table `post_tags`
--
ALTER TABLE `post_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_post_tag` (`post_id`,`tag`),
  ADD KEY `idx_tag` (`tag`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `review_images`
--
ALTER TABLE `review_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room_images`
--
ALTER TABLE `room_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`skey`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attractions`
--
ALTER TABLE `attractions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attraction_images`
--
ALTER TABLE `attraction_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `facility_images`
--
ALTER TABLE `facility_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `home_slides`
--
ALTER TABLE `home_slides`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `post_images`
--
ALTER TABLE `post_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `post_tags`
--
ALTER TABLE `post_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `review_images`
--
ALTER TABLE `review_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `room_images`
--
ALTER TABLE `room_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attraction_images`
--
ALTER TABLE `attraction_images`
  ADD CONSTRAINT `attraction_images_ibfk_1` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `facility_images`
--
ALTER TABLE `facility_images`
  ADD CONSTRAINT `facility_images_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_images`
--
ALTER TABLE `post_images`
  ADD CONSTRAINT `fk_post_images_posts` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_tags`
--
ALTER TABLE `post_tags`
  ADD CONSTRAINT `fk_post_tags_posts` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `review_images`
--
ALTER TABLE `review_images`
  ADD CONSTRAINT `fk_review_images_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_images`
--
ALTER TABLE `room_images`
  ADD CONSTRAINT `room_images_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
