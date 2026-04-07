#!/usr/bin/env node
/**
 * Pairlog App Store Screenshot Generator — 5 Languages
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const W = 1284;
const H = 2778;

// ── テキストエリア ──
const HEADING_Y     = 205;
const HEADING_LINE  = 112;
const HEADING_SIZE  = 82;
const SUBTITLE_Y    = 392;
const SUBTITLE_LINE = 62;
const SUBTITLE_SIZE = 41;

// ── iPhoneフレーム ──
const FRAME_X       = 68;
const FRAME_Y       = 555;
const FRAME_W       = W - FRAME_X * 2;   // 1154px
const FRAME_RADIUS  = 148;
const BORDER_SIDE   = 34;
const BORDER_TOP    = 36;
const BORDER_BOTTOM = 36;
const FRAME_COLOR   = '#1c1c1e';

// スクリーン領域
const SCREEN_X      = FRAME_X + BORDER_SIDE;
const SCREEN_W      = FRAME_W - BORDER_SIDE * 2;   // 1086px
const SCREEN_Y      = FRAME_Y + BORDER_TOP;
const SCREEN_RADIUS = 114;

// ── 下部ピンク帯 ──
const BOTTOM_BAR_H     = 110;
const BOTTOM_BAR_Y     = H - BOTTOM_BAR_H;
const BOTTOM_BAR_COLOR = '#fce7f3';

// ── 共通カラー ──
const HEADING_COLOR  = '#1f1f1f';
const SUBTITLE_COLOR = '#524850';

// ── 言語ごとの設定 ──
const LANG_CONFIGS = {
  ja: {
    fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
    configs: [
      {
        heading:  'ふたりの記録を、\n毎日ためよう',
        subtitle: '「ありがとう」や一緒に過ごした時間を、\nふたりだけの日記に。',
      },
      {
        heading:  '約束したこと、\n忘れない。',
        subtitle: '言いっぱなしにしない。\nふたりの約束をリストで管理。',
      },
      {
        heading:  'いつ、何をしたか。\n一目でわかる。',
        subtitle: 'カレンダーで振り返ると、\nふたりの時間が見えてくる。',
      },
      {
        heading:  '記録がたまったら、\nごほうびを。',
        subtitle: 'ポイントを使って\nふたりの楽しみにつなげよう。',
      },
      {
        heading:  'ふたりで使うから、\n意味がある。',
        subtitle: 'パートナーと繋がって、\n記録を共有しよう。',
      },
    ],
  },

  en: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    headingWeight: '900',
    configs: [
      {
        heading:  'Record your days\ntogether.',
        subtitle: "Save your 'thank you' moments\nand time together in one place.",
      },
      {
        heading:  'Promises made,\nnever forgotten.',
        subtitle: "No more empty words.\nManage your promises together.",
      },
      {
        heading:  "See everything\nyou've shared.",
        subtitle: 'Browse the calendar and rediscover\nyour journey together.',
      },
      {
        heading:  'Log more,\nearn rewards.',
        subtitle: 'Turn your points into\nsomething fun for two.',
      },
      {
        heading:  'Shared by two,\nmeaningful to both.',
        subtitle: 'Connect with your partner\nand share your story.',
      },
    ],
  },

  ko: {
    fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    configs: [
      {
        heading:  '둘만의 기록을,\n매일 쌓아가요.',
        subtitle: '감사한 순간과 함께한 시간을\n둘만의 일기에 남겨요.',
      },
      {
        heading:  '약속한 것,\n절대 잊지 않아요.',
        subtitle: '흐지부지 끝내지 않기.\n둘의 약속을 리스트로 관리해요.',
      },
      {
        heading:  '언제, 무엇을 했는지\n한눈에 봐요.',
        subtitle: '캘린더로 돌아보면\n둘의 시간이 보여요.',
      },
      {
        heading:  '기록이 쌓이면,\n보상을 받아요.',
        subtitle: '포인트를 써서\n둘만의 즐거움으로 연결해요.',
      },
      {
        heading:  '함께 쓰기 때문에,\n의미가 있어요.',
        subtitle: '파트너와 연결하고\n기록을 공유해요.',
      },
    ],
  },

  'zh-Hant': {
    fontFamily: '"PingFang TC", "Heiti TC", sans-serif',
    configs: [
      {
        heading:  '累積兩人的記錄，\n每一天。',
        subtitle: '把「謝謝你」和共度的時光，\n留在只屬於你們的日記裡。',
      },
      {
        heading:  '說好的承諾，\n不會忘記。',
        subtitle: '說到做到。\n用清單管理兩人的約定。',
      },
      {
        heading:  '何時做了什麼，\n一目了然。',
        subtitle: '翻開行事曆，\n看見兩人走過的點滴。',
      },
      {
        heading:  '記錄累積了，\n就來個獎勵吧。',
        subtitle: '用點數換取\n兩人的小確幸。',
      },
      {
        heading:  '因為一起使用，\n才有意義。',
        subtitle: '與伴侶連結，\n共享彼此的記錄。',
      },
    ],
  },

  'zh-Hans': {
    fontFamily: '"PingFang SC", "Heiti SC", sans-serif',
    configs: [
      {
        heading:  '积累两人的记录，\n每一天。',
        subtitle: '把「谢谢你」和共度的时光，\n留在只属于你们的日记里。',
      },
      {
        heading:  '说好的约定，\n不会忘记。',
        subtitle: '说到做到。\n用清单管理两人的约定。',
      },
      {
        heading:  '何时做了什么，\n一目了然。',
        subtitle: '翻开日历，\n看见两人走过的点滴。',
      },
      {
        heading:  '记录积累了，\n就来个奖励吧。',
        subtitle: '用积分换取\n两人的小确幸。',
      },
      {
        heading:  '因为一起使用，\n才有意义。',
        subtitle: '与伴侣连结，\n共享彼此的记录。',
      },
    ],
  },
};

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

async function generate(inputPath, outputPath, config, fontFamily, headingWeight = 'bold') {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── ピンクグラデーション背景 ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0,    '#fdf0f6');
  bgGrad.addColorStop(0.45, '#fff7fb');
  bgGrad.addColorStop(1,    '#fdeef5');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 見出し ──
  ctx.font      = `${headingWeight} ${HEADING_SIZE}px ${fontFamily}`;
  ctx.fillStyle = HEADING_COLOR;
  ctx.textAlign = 'center';
  config.heading.split('\n').forEach((line, i) => {
    ctx.fillText(line, W / 2, HEADING_Y + i * HEADING_LINE);
  });

  // ── サブタイトル ──
  ctx.font      = `${SUBTITLE_SIZE}px ${fontFamily}`;
  ctx.fillStyle = SUBTITLE_COLOR;
  config.subtitle.split('\n').forEach((line, i) => {
    ctx.fillText(line, W / 2, SUBTITLE_Y + i * SUBTITLE_LINE);
  });

  // ── スクリーンクリップ高さ ──
  const screenClipH = (BOTTOM_BAR_Y - BORDER_BOTTOM) - SCREEN_Y;

  // ── iPhoneフレーム本体 ──
  const FRAME_H_DRAW = BORDER_TOP + screenClipH - SCREEN_RADIUS + FRAME_RADIUS;

  ctx.save();
  ctx.shadowColor   = 'rgba(80, 20, 50, 0.28)';
  ctx.shadowBlur    = 60;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = FRAME_COLOR;
  roundedRect(ctx, FRAME_X, FRAME_Y, FRAME_W, FRAME_H_DRAW, FRAME_RADIUS);
  ctx.fill();
  ctx.restore();

  // フレームの光沢ライン
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth   = 2;
  roundedRect(ctx, FRAME_X + 1, FRAME_Y + 1, FRAME_W - 2, FRAME_H_DRAW - 2, FRAME_RADIUS - 1);
  ctx.stroke();
  ctx.restore();

  // ── サイドボタン ──
  ctx.fillStyle = '#2a2a2c';
  roundedRect(ctx, FRAME_X - 6, FRAME_Y + 230, 6, 64, 3); ctx.fill();
  roundedRect(ctx, FRAME_X - 6, FRAME_Y + 320, 6, 64, 3); ctx.fill();
  roundedRect(ctx, FRAME_X + FRAME_W, FRAME_Y + 275, 6, 94, 3); ctx.fill();

  // ── アプリスクショ ──
  const img     = await loadImage(inputPath);
  const scale   = SCREEN_W / img.width;
  const scaledH = Math.round(img.height * scale);

  ctx.save();
  roundedRect(ctx, SCREEN_X, SCREEN_Y, SCREEN_W, screenClipH, SCREEN_RADIUS);
  ctx.clip();
  ctx.drawImage(img, SCREEN_X, SCREEN_Y, SCREEN_W, scaledH);
  ctx.restore();

  // ── 下部ピンク帯 ──
  ctx.fillStyle = BOTTOM_BAR_COLOR;
  ctx.fillRect(0, BOTTOM_BAR_Y, W, BOTTOM_BAR_H);

  // ── 保存 ──
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`  ✅  ${path.basename(outputPath)}`);
}

function getInputs(lang) {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  // 言語別フォルダ → なければ共通フォルダにフォールバック
  const langDir    = path.join(screenshotsDir, lang);
  const defaultDir = path.join(screenshotsDir, 'ja');
  const dir = fs.existsSync(langDir) && fs.readdirSync(langDir).some(f => /\.(png|jpg|jpeg)$/i.test(f))
    ? langDir
    : defaultDir;

  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort()
    .map(f => path.join(dir, f));
}

async function main() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const langs = Object.keys(LANG_CONFIGS);
  console.log(`📸  ${langs.length}言語分を生成します...\n`);

  for (const lang of langs) {
    const { fontFamily, headingWeight, configs } = LANG_CONFIGS[lang];
    const inputs  = getInputs(lang);
    const langDir = path.join(outputDir, lang);
    if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

    const usingFallback = !fs.existsSync(path.join(__dirname, 'screenshots', lang)) ||
      !fs.readdirSync(path.join(__dirname, 'screenshots', lang)).some(f => /\.(png|jpg|jpeg)$/i.test(f));
    console.log(`🌐  [${lang}]${usingFallback ? ' ⚠️  ja/ フォールバック使用中' : ''}`);

    for (let i = 0; i < Math.min(inputs.length, configs.length); i++) {
      const num = String(i + 1).padStart(2, '0');
      await generate(inputs[i], path.join(langDir, `${num}_appstore.png`), configs[i], fontFamily, headingWeight);
    }
  }

  console.log(`\n🎉  完成！output/ フォルダの各言語フォルダを確認してください。`);
  console.log(`  output/ja/       — 日本語`);
  console.log(`  output/en/       — 英語`);
  console.log(`  output/ko/       — 韓国語`);
  console.log(`  output/zh-Hant/  — 繁体字中国語`);
  console.log(`  output/zh-Hans/  — 簡体字中国語`);
}

main().catch(err => {
  console.error('\n❌  エラー:', err.message);
  process.exit(1);
});
