import fs from 'fs';
import path from 'path';

console.log('--- Configuring Android Native Platform ---');

// 1. AndroidManifest.xml permissions
const manifestPath = path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  const perms = [
    'android.permission.VIBRATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.USE_EXACT_ALARM',
    'android.permission.WAKE_LOCK',
    'android.permission.RECEIVE_BOOT_COMPLETED'
  ];
  let toAdd = '';
  perms.forEach(p => {
    if (!content.includes(p)) {
      toAdd += `    <uses-permission android:name="${p}" />\n`;
    }
  });
  if (toAdd) {
    content = content.replace('</manifest>', `${toAdd}</manifest>`);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('✔ Updated AndroidManifest.xml permissions');
  }
}

// 2. gradle.properties memory & optimizations
const propsPath = path.join(process.cwd(), 'android/gradle.properties');
if (fs.existsSync(propsPath)) {
  fs.appendFileSync(propsPath, '\norg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8\norg.gradle.parallel=false\n', 'utf8');
  console.log('✔ Updated android/gradle.properties');
}

// 3. build.gradle BouncyCastle exclusions
const buildGradlePath = path.join(process.cwd(), 'android/build.gradle');
if (fs.existsSync(buildGradlePath)) {
  const rule = `
allprojects {
    configurations.all {
        exclude group: 'org.bouncycastle', module: 'bcprov-jdk18on'
        exclude group: 'org.bouncycastle', module: 'bcpkix-jdk18on'
        exclude group: 'org.bouncycastle', module: 'bcprov-jdk15to18'
    }
}
subprojects {
    configurations.all {
        exclude group: 'org.bouncycastle', module: 'bcprov-jdk18on'
        exclude group: 'org.bouncycastle', module: 'bcpkix-jdk18on'
        exclude group: 'org.bouncycastle', module: 'bcprov-jdk15to18'
    }
}
`;
  fs.appendFileSync(buildGradlePath, rule, 'utf8');
  console.log('✔ Excluded BouncyCastle from android/build.gradle');
}
