#db01.sql
#功能二：商品列表
#1：添加一列 xz_laptop
use xz;
ALTER TABLE xz_laptop ADD img_url VARCHAR(255);
#2：更新数据
UPDATE xz_laptop SET img_url="01.jpg" WHERE lid=1;
UPDATE xz_laptop SET img_url="02.jpg" WHERE lid>1;