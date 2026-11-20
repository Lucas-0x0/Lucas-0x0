// 快递取件 · Egern 小组件
// 类型: generic 脚本, 返回 Widget DSL
// 数据来源(按优先级):
//   1. Env PARCELS_JSON: [{"code":"8241","courier":"菜鸟驿站","station":"小区东门菜鸟驿站","name":"日用品","time":"今日 18:00 前取"}]
//   2. Env 单件模式: PICKUP_CODE / COURIER / STATION / PARCEL_NAME / DEADLINE
//   3. ctx.storage 的 parcels (给以后接定时抓取留的口子)
// 点击小组件打开: Env OPEN_URL, 默认 cainiao://
// 刷新: refreshAfter 15 分钟

export default async function(ctx) {
  const parcels = loadParcels(ctx);
  const family = ctx.widgetFamily || 'systemMedium';
  const openUrl = (ctx.env && ctx.env.OPEN_URL) || 'cainiao://';
  const refreshAfter = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // ---------- 锁屏 ----------
  if (family === 'accessoryCircular') {
    return {
      type: 'widget',
      url: openUrl,
      children: [
        { type: 'text', text: String(parcels.length), font: { size: 'title2', weight: 'bold' }, textAlign: 'center' },
        { type: 'text', text: '待取', font: { size: 'caption2', weight: 'medium' }, textColor: { light: '#6E6E73', dark: '#A1A1AA' }, textAlign: 'center' },
      ],
    };
  }
  if (family === 'accessoryInline') {
    const first = parcels[0];
    return {
      type: 'widget',
      url: openUrl,
      children: [
        { type: 'text', text: parcels.length ? `待取件 ${parcels.length} · 取件码 ${first.code}` : '暂无待取件', font: { size: 'callout', weight: 'semibold' } },
      ],
    };
  }
  if (family === 'accessoryRectangular') {
    const first = parcels[0];
    return {
      type: 'widget',
      url: openUrl,
      padding: 12,
      gap: 2,
      children: [
        { type: 'text', text: parcels.length ? `待取件 ${parcels.length} 件` : '暂无待取件', font: { size: 'headline', weight: 'bold' } },
        { type: 'text', text: first ? `${first.courier} · ${spacedCode(first.code)}` : '取件码填到 Env 就显示在这里', font: { size: 'subheadline' }, textColor: { light: '#6E6E73', dark: '#A1A1AA' }, maxLines: 1 },
      ],
    };
  }

  // ---------- 空状态: 也要好看, 不是报错红字 ----------
  if (!parcels.length) {
    return {
      type: 'widget',
      url: openUrl,
      padding: 16,
      gap: 8,
      backgroundGradient: bg(),
      refreshAfter,
      children: [
        {
          type: 'stack', direction: 'row', alignItems: 'center', gap: 8,
          children: [
            { type: 'image', src: 'sf-symbol:shippingbox.fill', color: '#FF6A00', width: 20, height: 20 },
            { type: 'text', text: '快递取件', font: { size: 'headline', weight: 'bold' }, textColor: C.text },
          ],
        },
        { type: 'spacer' },
        { type: 'image', src: 'sf-symbol:tray.fill', color: { light: '#C7C7CC', dark: '#48484A' }, width: 36, height: 36 },
        { type: 'text', text: '暂无待取件', font: { size: 'headline', weight: 'semibold' }, textColor: C.text, textAlign: 'center' },
        { type: 'text', text: '有新包裹到驿站, 取件码会显示在这里', font: { size: 'caption1' }, textColor: C.sub, textAlign: 'center', maxLines: 2 },
        { type: 'spacer' },
        { type: 'text', text: '在模块 Env 里填 PARCELS_JSON', font: { size: 'caption2' }, textColor: C.muted, textAlign: 'center' },
      ],
    };
  }

  // ---------- 小尺寸: 只放最重要的一件 ----------
  if (family === 'systemSmall') {
    const p = parcels[0];
    return {
      type: 'widget',
      url: openUrl,
      padding: 14,
      gap: 6,
      backgroundGradient: bg(),
      refreshAfter,
      children: [
        countPill(parcels.length),
        { type: 'spacer' },
        { type: 'text', text: '取件码', font: { size: 'caption1', weight: 'semibold' }, textColor: C.sub },
        { type: 'text', text: spacedCode(p.code), font: { size: 32, weight: 'bold', family: 'Menlo' }, textColor: C.text, maxLines: 1, minScale: 0.6 },
        { type: 'text', text: p.courier, font: { size: 'subheadline', weight: 'semibold' }, textColor: accentFor(p.courier), maxLines: 1 },
        { type: 'text', text: p.station, font: { size: 'caption1' }, textColor: C.sub, maxLines: 2, minScale: 0.8 },
      ],
    };
  }

  // ---------- 大尺寸: 列表 ----------
  if (family === 'systemLarge' || family === 'systemExtraLarge') {
    const list = parcels.slice(0, 4);
    return {
      type: 'widget',
      url: openUrl,
      padding: 16,
      gap: 12,
      backgroundGradient: bg(),
      refreshAfter,
      children: [
        header(parcels.length),
        ...list.map((p) => parcelRow(p)),
        { type: 'spacer' },
        footer(parcels),
      ],
    };
  }

  // ---------- 中尺寸(默认): 一件大的 + 第二件提示 ----------
  const main = parcels[0];
  const second = parcels[1];
  return {
    type: 'widget',
    url: openUrl,
    padding: 14,
    gap: 10,
    backgroundGradient: bg(),
    refreshAfter,
    children: [
      header(parcels.length),
      {
        type: 'stack', direction: 'column', gap: 6,
        backgroundColor: C.card, borderRadius: 14, padding: 12,
        children: [
          {
            type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
            children: [
              { type: 'text', text: '取件码', font: { size: 'caption1', weight: 'semibold' }, textColor: C.sub },
              { type: 'spacer' },
              { type: 'text', text: main.courier, font: { size: 'caption1', weight: 'semibold' }, textColor: accentFor(main.courier), maxLines: 1 },
            ],
          },
          { type: 'text', text: spacedCode(main.code), font: { size: 36, weight: 'bold', family: 'Menlo' }, textColor: C.text, maxLines: 1, minScale: 0.6 },
          {
            type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
            children: [
              { type: 'image', src: 'sf-symbol:mappin.and.ellipse', color: C.sub, width: 13, height: 13 },
              { type: 'text', text: main.station, font: { size: 'subheadline' }, textColor: C.sub, maxLines: 1 },
            ],
          },
          ...(main.name ? [{ type: 'text', text: main.name, font: { size: 'caption1' }, textColor: C.muted, maxLines: 1 }] : []),
        ],
      },
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
        children: [
          { type: 'image', src: 'sf-symbol:clock', color: C.muted, width: 12, height: 12 },
          { type: 'text', text: main.time || '点击打开菜鸟查看详情', font: { size: 'caption1' }, textColor: C.muted, maxLines: 1 },
          { type: 'spacer' },
          ...(second ? [{ type: 'text', text: `还有 ${parcels.length - 1} 件 · ${spacedCode(second.code)}`, font: { size: 'caption1', weight: 'semibold' }, textColor: C.sub, maxLines: 1 }] : []),
        ],
      },
    ],
  };
}

// ---------- 设计 token: 克制, 只用黑白灰 + 一个品牌橙 ----------
const C = {
  text: { light: '#111113', dark: '#FFFFFF' },
  sub: { light: '#6E6E73', dark: '#A1A1AA' },
  muted: { light: '#AEAEB2', dark: '#6B6B70' },
  card: { light: '#F4F4F6', dark: '#232328' },
  line: { light: '#E8E8ED', dark: '#2E2E33' },
};

function bg() {
  return {
    type: 'linear',
    colors: [{ light: '#FFFFFF', dark: '#1B1B1F' }, { light: '#F6F6F8', dark: '#101013' }],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function accentFor(courier) {
  const s = String(courier || '');
  if (s.includes('丰巢')) return '#00B578';
  if (s.includes('京东')) return '#E1251B';
  if (s.includes('顺丰')) return { light: '#111113', dark: '#FFFFFF' };
  if (s.includes('邮政')) return '#00843D';
  return '#FF6A00'; // 菜鸟 / 默认
}

function spacedCode(code) {
  return String(code || '').split('').join(' ');
}

function countPill(n) {
  return {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: 'sf-symbol:shippingbox.fill', color: '#FF6A00', width: 18, height: 18 },
      { type: 'text', text: '待取件', font: { size: 'headline', weight: 'bold' }, textColor: C.text },
      { type: 'spacer' },
      {
        type: 'stack', direction: 'row', backgroundColor: '#FF6A00', borderRadius: 10, padding: [3, 8],
        children: [{ type: 'text', text: `${n} 件`, font: { size: 'caption1', weight: 'bold' }, textColor: '#FFFFFF' }],
      },
    ],
  };
}

function header(n) {
  return countPill(n);
}

function parcelRow(p) {
  return {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    children: [
      {
        type: 'stack', direction: 'column', gap: 2, flex: 1,
        children: [
          { type: 'text', text: p.name || p.courier, font: { size: 'subheadline', weight: 'semibold' }, textColor: C.text, maxLines: 1 },
          { type: 'text', text: p.station, font: { size: 'caption1' }, textColor: C.sub, maxLines: 1 },
          ...(p.time ? [{ type: 'text', text: p.time, font: { size: 'caption2' }, textColor: C.muted, maxLines: 1 }] : []),
        ],
      },
      {
        type: 'stack', direction: 'column', gap: 2,
        children: [
          { type: 'text', text: spacedCode(p.code), font: { size: 'headline', weight: 'bold', family: 'Menlo' }, textColor: C.text, textAlign: 'right', maxLines: 1 },
          { type: 'text', text: p.courier, font: { size: 'caption2', weight: 'semibold' }, textColor: accentFor(p.courier), textAlign: 'right', maxLines: 1 },
        ],
      },
    ],
  };
}

function footer(parcels) {
  return {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    children: [
      { type: 'image', src: 'sf-symbol:clock', color: C.muted, width: 12, height: 12 },
      { type: 'date', date: new Date().toISOString(), format: 'relative', font: { size: 'caption2' }, textColor: C.muted },
      { type: 'spacer' },
      { type: 'text', text: `共 ${parcels.length} 件待取`, font: { size: 'caption2' }, textColor: C.muted },
    ],
  };
}

function loadParcels(ctx) {
  const env = ctx.env || {};
  // 1) JSON 列表
  if (env.PARCELS_JSON) {
    try {
      const arr = JSON.parse(env.PARCELS_JSON);
      if (Array.isArray(arr)) return arr.map(normalize).filter((p) => p.code);
    } catch (e) { /* 格式错了就往下走单件模式, 不崩 */ }
  }
  // 2) 单件模式
  if (env.PICKUP_CODE) {
    return [normalize({
      code: env.PICKUP_CODE,
      courier: env.COURIER || '菜鸟驿站',
      station: env.STATION || '',
      name: env.PARCEL_NAME || '',
      time: env.DEADLINE || '',
    })];
  }
  // 3) storage (留给定时脚本以后写)
  try {
    const saved = ctx.storage && ctx.storage.getJSON('parcels');
    if (Array.isArray(saved)) return saved.map(normalize).filter((p) => p.code);
  } catch (e) {}
  return [];
}

function normalize(p) {
  return {
    code: String(p.code || p.pickupCode || '').trim(),
    courier: String(p.courier || p.company || '菜鸟驿站').trim(),
    station: String(p.station || p.location || '').trim(),
    name: String(p.name || p.title || '').trim(),
    time: String(p.time || p.deadline || '').trim(),
  };
}
