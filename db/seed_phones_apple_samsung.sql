-- iFixItEasy - Dummy data: Apple & Samsung telefoons
-- Doel: MySQL database 'ifixit_NEWDB' (DirectAdmin). Importeer via phpMyAdmin
-- of: mysql -u USER -p ifixit_NEWDB < db/seed_phones_apple_samsung.sql
--
-- Afbeeldingen: echte productfoto's via GSMArena CDN (geverifieerd: HTTP 200).
-- Idempotent: elke rij heeft een NOT EXISTS-guard, dus opnieuw draaien
-- maakt geen duplicaten. De reeds bestaande 'iPhone 17 Pro Max' wordt
-- overgeslagen.

SET NAMES utf8mb4;

-- ----- Apple -----
INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone SE (2020)', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-se-2020.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone SE (2020)');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone SE (2022)', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-se-2022.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone SE (2022)');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 11', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 11');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 11 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 11 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 11 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11-pro-max-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 11 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 12 mini', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-mini.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 12 mini');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 12', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 12');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 12 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 12 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 12 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12-pro-max.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 12 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 13 mini', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-mini.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 13 mini');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 13', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 13');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 13 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 13 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 13 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 13 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 14', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 14');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 14 Plus', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-plus.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 14 Plus');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 14 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 14 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 14 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 14 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 15', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 15');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 15 Plus', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-plus-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 15 Plus');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 15 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 15 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 15 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 15 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 16', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 16');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 16 Plus', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 16 Plus');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 16 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 16 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 16 Pro Max', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 16 Pro Max');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 16e', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 16e');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 17', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 17');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone 17 Pro', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone 17 Pro');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Apple', 'iPhone Air', 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-air.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Apple' AND model_name='iPhone Air');

-- ----- Samsung -----
INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S21 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-5g-r.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S21 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S21+ 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-plus-5g-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S21+ 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S21 Ultra 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-ultra-5g-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S21 Ultra 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S21 FE 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s21-fe-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S21 FE 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S22', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S22');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S22+', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-plus-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S22+');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S22 Ultra', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S22 Ultra');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S23', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S23');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S23+', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-plus-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S23+');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S23 Ultra', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S23 Ultra');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S23 FE', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S23 FE');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S24', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-5g-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S24');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S24+', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus-5g-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S24+');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S24 Ultra', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S24 Ultra');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S24 FE', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-fe-r1.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S24 FE');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S25', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-sm-s931.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S25');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S25+', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-plus-sm-s936.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S25+');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S25 Ultra', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra-sm-s938.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S25 Ultra');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy S25 Edge', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-edge-.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy S25 Edge');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A05s', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a05s.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A05s');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A14 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a14-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A14 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A15 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a15-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A15 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A16 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a16-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A16 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A35 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A35 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A54 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A54 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy A55 5G', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy A55 5G');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy Z Flip5', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy Z Flip5');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy Z Fold5', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5-5g.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy Z Fold5');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy Z Flip6', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy Z Flip6');

INSERT INTO phones (brand, model_name, image_url, device_category, is_active)
SELECT 'Samsung', 'Galaxy Z Fold6', 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg', 'smartphone', 1
WHERE NOT EXISTS (SELECT 1 FROM phones WHERE brand='Samsung' AND model_name='Galaxy Z Fold6');

