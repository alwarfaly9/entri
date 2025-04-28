// add-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 🔗 رابط الاتصال مع تحديد اسم قاعدة البيانات Entri_db
const uri = 'mongodb://alwarfaly:H1tBOkkLwRD2wIkS@ac-kd2gsop-shard-00-00.xo6971e.mongodb.net:27017/entri_db?replicaSet=atlas-q440g9-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// 🧩 تعريف الموديل مع is_admin
const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
  is_admin: { type: Number, default: 0 }
});

const Admin = mongoose.model('Login', AdminSchema); // الكولكشن logins

// 🔐 إنشاء مسؤول جديد
const createAdmin = async () => {
  const email = 'ahmed@example.com'; 
  const plainPassword = 'ahmed'; 

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = new Admin({
    email: email,
    password: hashedPassword,
    is_admin: 1 // 🛠️ تحديد انه أدمن حقيقي
  });

  await admin.save();
  console.log('✅ Admin created successfully');
  mongoose.disconnect();
};

createAdmin();
