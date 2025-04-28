const bcrypt = require('bcrypt');

async function testPassword() {
  const plainPassword = '123'; // الكلمة اللي ندخلها
  const hashedPassword = '$2b$10$UDuh8Y3xPw/EaFYCk3MTLeAM87jVfTVNgtOWCZLMl16fFtdDWazPm'; // الكلمة المشفرة اللي عندك

  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

  if (isMatch) {
    console.log('✅ كلمة السر صحيحة!');
  } else {
    console.log('❌ كلمة السر غير صحيحة!');
  }
}

testPassword();
