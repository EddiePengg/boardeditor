/**
 * 瀑布流布局算法，将卡片数组中的每个卡片分配 x 和 y 坐标
 * @param cards - 卡片对象数组，每个对象必须包含 height 属性
 * @param options - 可选参数对象
 * @returns 返回更新后的卡片数组，每个卡片包含 x 和 y 坐标
 */
export function layoutCardsMasonry<
  T extends { height: number; width: number; x: number; y: number }
>(
  cards: Array<T>,
  options: {
    columns?: number;
    cardWidth?: number;
    columnGap?: number;
    rowGap?: number;
    startX?: number;
    startY?: number;
  } = {}
): void {
  // 解构可选参数并设置默认值
  const {
    columns = 5,
    cardWidth = 300,
    columnGap = 10,
    rowGap = 10,
    startX = 0, // 新增：起始X坐标默认值
    startY = 0, // 新增：起始Y坐标默认值
  } = options;

  // 初始化每一列的累计高度数组
  let columnHeights: number[] = new Array(columns).fill(0);

  // 遍历所有卡片，计算它们的 x 和 y 坐标
  cards.forEach((card, index) => {
    // 验证卡片是否有 height 属性
    if (typeof card.height !== "number") {
      throw new Error(`第 ${index + 1} 个卡片缺少 height 属性或类型错误`);
    }

    // 找到当前累计高度最小的列的索引
    let minColumnIndex: number = columnHeights.indexOf(
      Math.min(...columnHeights)
    );

    // 计算卡片的 x 坐标：起始X + 列索引 * （卡片宽度 + 列间距）
    card.x = startX + minColumnIndex * (cardWidth + columnGap);

    // 计算卡片的 y 坐标：起始Y + 该列的累计高度
    card.y = startY + columnHeights[minColumnIndex];

    // 更新该列的累计高度：加上当前卡片的高度和行间距
    columnHeights[minColumnIndex] += card.height + rowGap;
  });
}

/**
 * 圆形布局算法，将卡片数组中的每个卡片分配 x 和 y 坐标
 * @param cards - 卡片对象数组，每个对象必须包含 width 和 height 属性
 * @param options - 可选参数对象
 * @returns 返回更新后的卡片数组，每个卡片包含 x 和 y 坐标
 */
export function layoutCardsInCircle<
  T extends { height: number; width: number; x: number; y: number }
>(
  cards: Array<T>,
  options: {
    centerX?: number;
    centerY?: number;
    radius?: number;
    startAngle?: number;
    startX?: number; // 新增：起始X坐标
    startY?: number; // 新增：起始Y坐标
  } = {}
): void {
  // 解构可选参数并设置默认值
  const {
    centerX = 500, // 圆心 X 坐标
    centerY = 500, // 圆心 Y 坐标
    radius = 500, // 半径
    startAngle = 0, // 起始角度（弧度）
    startX = 0, // 新增：起始X坐标默认值
    startY = 0, // 新增：起始Y坐标默认值
  } = options;

  const totalCards = cards.length;
  const angleIncrement = (2 * Math.PI) / totalCards;

  cards.forEach((card, index) => {
    const angle = startAngle + index * angleIncrement;

    // 更新坐标计算，加入startX和startY偏移
    card.x = startX + (centerX + radius * Math.cos(angle) - card.width / 2);
    card.y = startY + (centerY + radius * Math.sin(angle) - card.height / 2);
  });
}

/**
 * 随机布局算法，将卡片随机放置在指定区域内
 * @param cards - 卡片对象数组，每个对象必须包含 width 和 height 属性
 * @param options - 可选参数对象
 * @returns 返回更新后的卡片数组，每个卡片包含 x 和 y 坐标
 */
export function layoutCardsRandomly<
  T extends { height: number; width: number; x: number; y: number }
>(
  cards: Array<T>,
  options: {
    areaWidth?: number;
    areaHeight?: number;
    padding?: number;
    startX?: number; // 新增：起始X坐标
    startY?: number; // 新增：起始Y坐标
  } = {}
): void {
  const {
    areaWidth = 800,
    areaHeight = 600,
    padding = 0,
    startX = 0, // 新增：起始X坐标默认值
    startY = 0, // 新增：起始Y坐标默认值
  } = options;

  cards.forEach((card) => {
    const maxX = areaWidth - card.width - padding * 2;
    const maxY = areaHeight - card.height - padding * 2;

    // 更新坐标计算，加入startX和startY偏移
    card.x = startX + padding + Math.random() * maxX;
    card.y = startY + padding + Math.random() * maxY;
  });
}

/**
 * 网格布局算法，将卡片数组按照固定的行和列排列
 * @param cards - 卡片对象数组，每个对象必须包含 width 和 height 属性
 * @param options - 可选参数对象
 * @returns 返回更新后的卡片数组，每个卡片包含 x 和 y 坐标
 */
export function layoutCardsInGrid<
  T extends { height: number; width: number; x: number; y: number }
>(
  cards: Array<T>,
  options: {
    columns?: number;
    columnGap?: number;
    rowGap?: number;
    startX?: number;
    startY?: number;
  } = {}
): void {
  // 解构可选参数并设置默认值
  const {
    columns = 5, // 列数
    columnGap = 10, // 列间距
    rowGap = 10, // 行间距
    startX = 0, // 起始 X 坐标
    startY = 0, // 起始 Y 坐标
  } = options;

  // 遍历所有卡片，计算它们的 x 和 y 坐标
  cards.forEach((card, index) => {
    const rowIndex = Math.floor(index / columns);
    const columnIndex = index % columns;

    // 计算卡片的 x 坐标
    card.x = startX + columnIndex * (card.width + columnGap);

    // 计算卡片的 y 坐标
    card.y = startY + rowIndex * (card.height + rowGap);
  });
}
