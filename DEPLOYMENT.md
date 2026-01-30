# نشر YANSY على Hostinger VPS — yansytech.com

دليل إعداد المشروع على VPS من Hostinger باستخدام الدومين **yansytech.com** و **api.yansytech.com**.

---

## المتطلبات على السيرفر

- **Node.js** 18+ (يفضل 20 LTS)
- **npm** أو **pnpm**
- **Nginx**
- **PM2** (تشغيل الـ API)
- **MongoDB** (محلي أو MongoDB Atlas)
- **Git**

---

## 1. إعداد السيرفر (مرة واحدة)

### الاتصال بـ VPS

```bash
ssh root@YOUR_VPS_IP
# أو مستخدم عادي: ssh user@YOUR_VPS_IP
```

### تثبيت Node.js 20 (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # يجب أن يظهر v20.x
```

### تثبيت Nginx و PM2

```bash
sudo apt update
sudo apt install -y nginx
sudo npm install -g pm2
```

### تثبيت MongoDB (اختياري — أو استخدم Atlas)

```bash
# Ubuntu 22.04
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 2. إعداد الدومين في Hostinger

1. من لوحة Hostinger: **Domains** → **yansytech.com**
2. أضف سجل **A** يشير إلى IP الـ VPS:
   - `yansytech.com` → `YOUR_VPS_IP`
   - `www.yansytech.com` → `YOUR_VPS_IP`
   - `api.yansytech.com` → `YOUR_VPS_IP`
3. انتظر انتشار الـ DNS (قد يستغرق دقائق إلى 48 ساعة).

---

## 3. استنساخ المشروع على الـ VPS

```bash
# إنشاء مجلد التطبيق
sudo mkdir -p /var/www
# إذا استخدمت مستخدم عادي:
mkdir -p ~/apps
cd ~/apps   # أو /var/www حسب الصلاحيات

# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/Company-YANSY.git yansy
cd yansy
```

---

## 4. متغيرات البيئة (Production)

### على السيرفر — Backend

```bash
cd /var/www/yansy/server   # أو ~/apps/yansy/server
cp .env.production.example .env
nano .env
```

عدّل القيم التالية:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/yansy
# أو MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/yansy
JWT_SECRET=استخدم_سلسلة_عشوائية_قوية
JWT_EXPIRES_IN=7d
CLIENT_URL=https://yansytech.com
```

### قبل البناء — Frontend

على جهازك أو على السيرفر قبل تشغيل `npm run build`:

```bash
cd client
cp .env.production.example .env.production
```

تأكد أن القيم:

```env
VITE_API_URL=https://api.yansytech.com/api
VITE_SOCKET_URL=https://api.yansytech.com
```

---

## 5. Nginx

### نسخ الإعداد

```bash
sudo cp deploy/nginx/yansytech.com.conf /etc/nginx/sites-available/yansytech.com
sudo ln -sf /etc/nginx/sites-available/yansytech.com /etc/nginx/sites-enabled/
# أو على بعض التوزيعات:
# sudo cp deploy/nginx/yansytech.com.conf /etc/nginx/conf.d/yansytech.com.conf
```

### التحقق وإعادة التشغيل

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. أول نشر (Deploy)

```bash
cd /var/www/yansy   # أو ~/apps/yansy
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

السكربت يقوم بـ:

- بناء الـ client مع `VITE_API_URL` و `VITE_SOCKET_URL`
- نسخ مخرجات البناء إلى `/var/www/yansytech.com`
- تثبيت تبعيات الـ server
- تشغيل/إعادة تشغيل الـ API عبر PM2

---

## 7. SSL (HTTPS) مع Let's Encrypt

بعد التأكد أن `yansytech.com` و `api.yansytech.com` يشيران لـ VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yansytech.com -d www.yansytech.com -d api.yansytech.com
```

ثم في `deploy/nginx/yansytech.com.conf`:

- أزل التعليق عن بلوكات `server { listen 443 ... }` للـ frontend والـ API.
- أضف `return 301 https://...` في بلوكات الـ `listen 80` إذا رغبت بإعادة توجيه HTTP إلى HTTPS.
- أعد تحميل Nginx: `sudo nginx -t && sudo systemctl reload nginx`.

---

## 8. أوامر مفيدة

| المهمة              | الأمر |
|---------------------|--------|
| إعادة تشغيل الـ API | `pm2 restart yansy-api` |
| عرض السجلات         | `pm2 logs yansy-api` |
| حالة التطبيق         | `pm2 status` |
| إعادة نشر كامل       | `./deploy/deploy.sh` |

---

## 9. تحديث المشروع لاحقاً

```bash
cd /var/www/yansy   # أو ~/apps/yansy
git pull
./deploy/deploy.sh
```

---

## ملخص الروابط

| الخدمة   | الرابط |
|----------|--------|
| الموقع   | https://yansytech.com |
| الـ API  | https://api.yansytech.com |
| Health   | https://api.yansytech.com/api/health |

بعد تطبيق الخطوات أعلاه يكون المشروع جاهزاً للعمل على Hostinger VPS على دومين yansytech.com.
